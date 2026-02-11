from fastapi import FastAPI, Depends, HTTPException, status, Request, Response, Cookie, UploadFile, File, Form, BackgroundTasks, Header, Security
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy import desc, func, extract, and_ , case
from fastapi.responses import FileResponse
from datetime import datetime, date , timezone
import uuid
import hashlib
import os, json
import shutil
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import timedelta
import app.models as models
import app.schemas as schemas
import app.database as database
import app.auth as auth
from typing import List, Optional
import numpy as np
import app.utils.populate_database as populate_db
import app.utils.quiz as quiz
from app.utils.populate_database import DATA_DIR, CHROMA_PATH
from app.celery_config import celery_app
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.models import APIKey
from fastapi.staticfiles import StaticFiles
import app.utils.summarize as summarize 
import app.utils.tasks as tasks
import app.utils.moderation as moderation
from redis import asyncio as aioredis
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
from pydantic_settings import BaseSettings
from pydantic import EmailStr
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from datetime import timedelta
import boto3
UPLOAD_DIR = "uploads"
UPLOAD_DOC_DIR = "uploaded_docs"
DOC_GENERATION_DIR = "generated_docs"

class Settings(BaseSettings):
    SECRET_KEY: str  # For signing JWTs, CSRF, and itsdangerous tokens
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_SES_REGION: str
    SENDER_EMAIL: EmailStr
    FRONTEND_URL: str = "http://localhost:3000"
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    APP_ENV: str = "development"
    BACKEND_URL: str = "http://localhost:8000"
    CORS_ORIGINS: str = ""
    
    model_config = ConfigDict(
        env_file=".env",
        extra="allow",
    )
settings = Settings()

app = FastAPI()
# Keep create_all only for non-production local workflows.
if settings.APP_ENV.lower() != "production":
    models.Base.metadata.create_all(bind=database.engine)
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(UPLOAD_DOC_DIR, exist_ok=True)
os.makedirs(DOC_GENERATION_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")  
app.mount("/uploaded_docs", StaticFiles(directory=UPLOAD_DOC_DIR), name="uploaded_docs") 
app.mount("/generated_docs", StaticFiles(directory=DOC_GENERATION_DIR), name="generated_docs")

def get_db():
    
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _build_cors_origins() -> list[str]:
    origins = {
        "http://localhost:3000",
        "http://localhost:3002",
        "https://automateu.space",
        "https://www.automateu.space",
    }
    if settings.FRONTEND_URL:
        origins.add(settings.FRONTEND_URL.rstrip("/"))
    if settings.CORS_ORIGINS:
        extra = [o.strip().rstrip("/") for o in settings.CORS_ORIGINS.split(",") if o.strip()]
        origins.update(extra)
    return sorted(origins)


origins = _build_cors_origins()
# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
)



    
SES_CLIENT = boto3.client(
    'ses',
    region_name=settings.AWS_SES_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
)

# Configure itsdangerous Serializer
URL_SERIALIZER = URLSafeTimedSerializer(settings.SECRET_KEY)

# Configure Authlib Google OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

async def get_current_active_user(
    request: Request,
    db: Session = Depends(get_db),
    csrf_token_from_header: Optional[str] = Security(auth.csrf_scheme)
) -> models.User:
    if not csrf_token_from_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing X-CSRF-Token header"
        )
    try:
        user = auth.get_current_user_from_cookie(
            request=request, 
            csrf_token_from_header=csrf_token_from_header, 
            db=db
        )
        return user
    except HTTPException as e:
        raise e
    
def send_verification_email(user_email: str, user_id: int):
    """
    Generates a verification token and sends it via AWS SES.
    """
    token = URL_SERIALIZER.dumps(user_id, salt='email-verification')
    verification_link = f"{settings.BACKEND_URL}/auth/verify-email?token={token}"
    
    try:
        SES_CLIENT.send_email(
            Source=settings.SENDER_EMAIL,
            Destination={'ToAddresses': [user_email]},
            Message={
                'Subject': {'Data': 'Welcome to AutomateU! Verify Your Email', 'Charset': 'UTF-8'},
                'Body': {
                    'Text': {'Data': f'Click to verify: {verification_link}', 'Charset': 'UTF-8'},
                    'Html': {'Data': f'<p>Welcome to AutomateU! Please click the link to verify your email:</p><p><a href="{verification_link}">Verify My Email</a></p>', 'Charset': 'UTF-8'}
                }
            }
        )
        print(f"Verification email sent to {user_email}")
    except Exception as e:
        print(f"Error sending email: {e}")
        # This HTTP Exception will be caught by the calling endpoint
        raise HTTPException(status_code=500, detail="Error sending verification email.")

def _set_login_cookies(response: Response, user_id: int):
    """
    Centralized function to create and set auth cookies.
    """
    csrf_token = auth.create_csrf_token()
    access_token_expire = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    data_for_jwt = {"sub": str(user_id), "csrf": csrf_token}
    
    access_token = auth.create_access_token(
        data=data_for_jwt, 
        expires_delta=access_token_expire
    )
    
    auth.set_login_cookies(response, access_token, csrf_token)
    return csrf_token
    
@app.get("/")
def read_root():
    return {"message": "Hello World"}
@app.post("/upload_doc")
async def upload_doc(
   # background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_active_user),
    tag: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if moderation.is_disallowed_image_upload(file.content_type, file.filename):
        raise HTTPException(status_code=400, detail="Image uploads are not allowed in RAG document ingestion.")
    if not moderation.is_supported_rag_upload(file.content_type, file.filename):
        raise HTTPException(status_code=400, detail="Unsupported file type for RAG ingestion. Use PDF/TXT/DOCX.")
    if moderation.contains_vulgar_text(tag):
        raise HTTPException(status_code=400, detail="Tag contains disallowed language.")

    file_content = await file.read()
    content_hash = hashlib.sha256(file_content).hexdigest()

    existing_document = db.query(models.Document).filter(models.Document.content_hash == content_hash).first()
    if existing_document:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This exact document already exists with doc_id: {existing_document.id}"
        )

    doc_id = str(uuid.uuid4())
    db_document = models.Document(
        id=doc_id,
        filename=file.filename,
        tag=tag,
        content_hash=content_hash,
        user_id=current_user.id,
        status=models.DocumentStatus.PROCESSING,
        content_type=file.content_type
    )
    db.add(db_document)
    db.commit()
    
    target_dir = os.path.join(UPLOAD_DOC_DIR, tag)
    unique_name = f"{doc_id}_{file.filename}"
    permanent_file_path = os.path.join(target_dir, unique_name)
    # Use a unique name for the temp file to avoid conflicts
    try:
        with open(permanent_file_path, "wb") as f:
            f.write(file_content)
    except IOError as e:
        # If file saving fails, revert the database entry
        db.delete(db_document)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save the uploaded file: {e}"
        )

    # background_tasks.add_task(
    #     populate_db.run_ingestion_pipeline,
    #     db_url=str(database.engine.url), # Pass the database URL as a string
    #     doc_id=doc_id,
    #     file_path=temp_file_path,
    #     tag=tag,
    #     user_id=str(current_user.id)
    # )
    celery_app.send_task("process_document_task", kwargs={"doc_id": doc_id, "file_path": permanent_file_path, "tag": tag, "user_id": str(current_user.id)})
    print(f"Dispatched task for doc_id: {doc_id} to Celery.")

    return schemas.Document.model_validate(db_document)

@app.get("/document/{doc_id}")
async def get_document(
    doc_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Securely retrieves a document file for the authenticated user.
    - It checks if the document exists.
    - It verifies that the document belongs to the user making the request.
    - It returns the file for viewing.
    """
    # 1. Query the database for the document, ensuring it belongs to the current user.
    # This is a critical security check to prevent one user from accessing another's files.
    document = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.user_id == current_user.id
    ).first()

    # 2. If no document is found for that ID and user, raise a 404 error.
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or you do not have permission to view it."
        )

    file_path = os.path.join(UPLOAD_DOC_DIR, document.tag, f"{document.id}_{document.filename}")

    if not os.path.exists(file_path):
        # Log this error for system administrators
        print(f"ERROR: File not found for doc_id {doc_id} at path {file_path}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File is missing from storage."
        )

    return FileResponse(file_path, media_type=document.content_type, filename=document.filename)

# NEW ENDPOINT to check document status
@app.get("/documents/{doc_id}/status", response_model=schemas.Document)
async def get_document_status(
    doc_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    
    db_doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Ensure a user can only check the status of their own documents
    if db_doc.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view this document's status")
        
    return db_doc

@app.get("/documents", response_model=List[schemas.Document])
async def read_user_documents(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all documents uploaded by the currently authenticated user.
    """
    # Query the Document table, filtering by the current user's ID.
    # The '.all()' executes the query and returns a list of results.
    documents = db.query(models.Document).filter(models.Document.user_id == current_user.id).all()
    return documents
@app.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: str, 
    current_user: models.User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    db_doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if db_doc.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    #Perform deletion from ChromaDB if it exists
    if db_doc.chroma_ids:   # store this as a list of IDs in your model
        populate_db.delete_from_chroma(db_doc.chroma_ids, db_doc.tag, doc_id)

    # Delete from Postgresql database
    db.delete(db_doc)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# for deleting all documnets of a user
@app.delete("/documents", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_documents(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    
    # Fetch all documents for the user
    user_documents = db.query(models.Document).filter(models.Document.user_id == current_user.id).all()
    
    if not user_documents:
        raise HTTPException(status_code=404, detail="No documents found for this user")
    
    # Delete each document from ChromaDB and SQL database
    for doc in user_documents:
        # populate_db.delete_from_chroma(doc_id=doc.id, tag=doc.tag)
        db.delete(doc)
        
    db.commit()
    return {"message": "Documents are Deleted Successfully"}
@app.get("/conversations", response_model=List[schemas.Conversation])
async def get_conversations(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conversations = db.query(models.Conversation).filter(models.Conversation.user_id == current_user.id).order_by(desc(models.Conversation.created_at)).all()
    return conversations

@app.get("/conversations/{conversation_id}", response_model=schemas.ConversationWithMessages)
async def get_conversation_history(
    conversation_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id, models.Conversation.user_id == current_user.id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

# delete a conversation and its messages
@app.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this conversation")
    
    db.delete(conversation)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
@app.post("/ask", response_model=schemas.AskResponse)
async def ask_question(
    ask_request: schemas.AskRequest,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if moderation.contains_vulgar_text(ask_request.question):
        raise HTTPException(status_code=400, detail="Please avoid vulgar or explicit language.")

    conversation_id = ask_request.conversation_id
    chat_history_messages = []

    # If a conversation_id is provided, load its history
    if conversation_id:
        conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
        if not conversation or conversation.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation not found or not owned by user")
        # Fetch last 6 messages to keep the context window reasonable
        chat_history_messages = db.query(models.Message).filter(models.Message.conversation_id == conversation_id).order_by(desc(models.Message.created_at)).limit(6).all()
        chat_history_messages.reverse() # Reverse to get chronological order
    else:
        # If no ID, create a new conversation
        conversation_id = str(uuid.uuid4())
        title = ask_request.question[:50] # Use first 50 chars as title
        conversation = models.Conversation(id=conversation_id, title=title, user_id=current_user.id)
        db.add(conversation)
        db.commit()

    # Save the user's new message
    user_message = models.Message(conversation_id=conversation_id, role="user", content=ask_request.question)
    db.add(user_message)
    db.commit()

    # Tree-based lexical retrieval (topic/page hierarchy aware)
    context_docs = populate_db.retrieve_tree_based_context(
        query=ask_request.question,
        tag=ask_request.tag,
        top_k=3
    )
    context_text = "\n\n---\n\n".join([doc.page_content for doc in context_docs])
    sources = populate_db.format_sources(context_docs)

    # Get response from Gemini-backed RAG answerer
    formatted_history = populate_db.format_chat_history(chat_history_messages)
    answer = populate_db.query_llm(ask_request.question, context_text, formatted_history)
    # Save the assistant's response
    assistant_message = models.Message(conversation_id=conversation_id, role="assistant", content=answer, sources=sources)
    db.add(assistant_message)
    db.commit()

    return schemas.AskResponse(answer=answer, sources=sources, conversation_id=conversation_id)

@app.post("/users", response_model=schemas.User)
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    FIXED: Handles standard email/password signup.
    Creates user as unverified and sends verification email.
    """
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = auth.get_password_hash(user.password)
    is_admin = user.email == "admin@example.com" # Your original logic

    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        is_admin=is_admin,
        is_verified=False  # FIX: Start as unverified
    )
    
    # FIX: Commit user to DB *before* sending email
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    try:
        print(f"Sending verification mail to user ID {db_user.id} at {db_user.email}")
        send_verification_email(db_user.email, db_user.id)
    except HTTPException as e:
        # FIX: Don't delete the user. Just report the error.
        print(f"Failed to send email, but user {db_user.id} was created.")
        # We don't re-raise the exception, as user creation was successful.
        # We can return a special status in the response body if needed.
        pass

    return db_user

@app.post("/login", response_model=schemas.LoginResponse)
async def login(response: Response, request: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    FIXED: Handles standard email/password login.
    Checks for password, verification status, and OAuth-only users.
    """
    user = db.query(models.User).filter(models.User.email == request.email).first()

    # FIX 1: Check for OAuth-only users
    if user and not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account was created with Google. Please log in using Google.",
        )

    # FIX 2: Standard password check
    if not user or not auth.verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    # FIX 3: CRITICAL - Check for verification
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not verified. Please check your inbox for a verification link.",
        )

    csrf_token = _set_login_cookies(response, user.id)

    return {"message": "Login successful", "csrf_token": csrf_token, "user": user}


@app.get("/auth/verify-email", response_model=schemas.MessageResponse)
async def verify_email(token: str, db: Session = Depends(get_db)):
    """
    FIXED: Endpoint hit by the link in the verification email.
    Does NOT require a logged-in user.
    """
    try:
        user_id = URL_SERIALIZER.loads(token, salt='email-verification', max_age=86400) # 1 day
    except SignatureExpired:
        raise HTTPException(status_code=400, detail="Verification link has expired.")
    except (BadTimeSignature, Exception):
        raise HTTPException(status_code=400, detail="Invalid verification link.")

    # FIX: Get user from ID in token, not from a cookie
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if user.is_verified:
        return {"msg": "Email is already verified."}

    # FIX: Actually update the user's status
    user.is_verified = True
    db.commit()
    
    return {"msg": "Email verified successfully. You can now log in."}

# --------------------------------------------------------------------------
# 7. AUTHENTICATION ENDPOINTS (Google OAuth)
# --------------------------------------------------------------------------

@app.get('/auth/login/google')
async def login_google(request: Request):
    """
    NEW: Redirects the user to Google's login page.
    """
    redirect_uri = request.url_for('auth_google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get('/auth/google/callback')
async def auth_google_callback(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    NEW: Handles the callback from Google. Finds or creates the user,
    then sets the *same* login cookies as the password login.
    """
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=google-auth-failed")

    user_info = token.get('userinfo')
    if not user_info or not user_info.get('email'):
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=google-info-failed")

    user_email = user_info['email']
    user_name = user_info.get('name', 'AutomateU User')

    db_user = db.query(models.User).filter(models.User.email == user_email).first()
    
    if not db_user:
        # User doesn't exist - create them
        db_user = models.User(
            name=user_name,
            email=user_email,
            hashed_password=None,  # No password for OAuth users
            is_admin=False,
            is_verified=True       # Google verifies email for us
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    
    # User exists, log them in using our centralized cookie function
    _set_login_cookies(response, db_user.id)
    
    # Redirect to the frontend, which will now have the auth cookies
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard")


# --------------------------------------------------------------------------
# 8. USER MANAGEMENT ENDPOINTS
# --------------------------------------------------------------------------

@app.put("/users/update", response_model=schemas.User)
async def update_user_profile(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    FIXED: Handles profile updates and email re-verification.
    """
    db_user = current_user 

    # FIX: Handle Email Change & Re-verification
    if user_update.email and user_update.email != db_user.email:
        existing_user = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail="Email already registered by another user."
            )
        db_user.email = user_update.email
        db_user.is_verified = False # CRITICAL: New email must be re-verified
        
        try:
            send_verification_email(db_user.email, db_user.id)
        except HTTPException:
            pass # We still save, but user will be unverified

    # Update other fields
    if user_update.name is not None:
        db_user.name = user_update.name
    if user_update.timezone is not None:
        db_user.timezone = user_update.timezone
    if user_update.language is not None:
        db_user.language = user_update.language

    db.commit()
    db.refresh(db_user)
    return db_user

@app.put("/users/change-password", response_model=schemas.MessageResponse)
async def change_user_password(
    pass_update: schemas.PasswordUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    FIXED: Blocks OAuth-only users from changing password.
    """
    # FIX: Block OAuth-only users
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=400,
            detail="Cannot change password for an account created with Google."
        )

    if not auth.verify_password(pass_update.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400, 
            detail="Incorrect current password."
        )

    current_user.hashed_password = auth.get_password_hash(pass_update.new_password)
    db.commit()
    
    return {"msg": "Password updated successfully"}

@app.get("/auth/refresh", response_model=schemas.LoginResponse)
async def refresh_csrf(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    FIXED: Refreshes both access_token and CSRF token.
    """
    # Note: validate_csrf=False is safe *here* because we are issuing a new token,
    # not performing a state-changing action.
    user = auth.get_current_user_from_cookie(request, csrf_token_from_header=None, db=db, validate_csrf=False)

    new_csrf_token = _set_login_cookies(response, user.id)
    
    return {"message": "Tokens refreshed", "csrf_token": new_csrf_token, "user": user}

@app.post("/tasks", response_model=schemas.Task)
async def create_task(
    task: schemas.TaskCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if task.team_id:
        db_team = db.query(models.UserTeam).filter(
            models.UserTeam.team_id == task.team_id,
            models.UserTeam.user_id == current_user.id
        ).first()
        if not db_team:
            raise HTTPException(status_code=403, detail="Not a member of this team")
    db_task = models.Task(**task.dict(), user_id=current_user.id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


# @app.get("/tasks", response_model=List[schemas.Task])
# async def read_tasks(
#     current_user: models.User = Depends(get_current_active_user),
#     skip: int = 0,
#     limit: int = 60,
#     db: Session = Depends(get_db),
# ):
 
#     user_teams = db.query(models.UserTeam).filter(models.UserTeam.user_id == current_user.id).all()
#     team_ids = [team.team_id for team in user_teams] + [0]
#     tasks = db.query(models.Task).filter(
#         (models.Task.user_id == current_user.id) |
#         (models.Task.team_id.in_(team_ids))
#     ).offset(skip).limit(limit).all()
    
            
#     #tasks = db.query(models.Task).offset(skip).limit(limit).all()
#     return tasks
@app.get("/tasks", response_model=List[schemas.Task])
async def read_tasks(
    current_user: models.User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 60,
    db: Session = Depends(get_db),
):
    user_teams = db.query(models.UserTeam).filter(models.UserTeam.user_id == current_user.id).all()
    team_ids = [team.team_id for team in user_teams] + [0]

    # base filter (user or team)
    base_filter = (models.Task.user_id == current_user.id) | (models.Task.team_id.in_(team_ids))

    # Query all todo and inprogress tasks
    todo_and_inprogress_tasks = db.query(models.Task).filter(
        base_filter,
        models.Task.status.in_(["todo", "in_progress"])
    ).offset(skip).limit(limit).all()

    # Query only 5 most recent done tasks
    done_tasks = db.query(models.Task).filter(
        base_filter,
        models.Task.status == "done"
    ).order_by(models.Task.created_at.desc()).limit(5).all()

    # Combine them (done last if you want order preserved)  
    tasks = todo_and_inprogress_tasks + done_tasks

    return tasks

@app.put("/tasks/{task_id}", response_model=schemas.Task)
async def update_task(
    task_id: int, 
    task: schemas.TaskCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    if db_task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    for key, value in task.dict(exclude_unset=True).items():
        setattr(db_task, key, value)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    if db_task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted"}

@app.delete("/tasks", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_tasks(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    
    # Fetch all documents for the user
    user_tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).all()
    
    if not user_tasks:
        raise HTTPException(status_code=404, detail="No Tasks found for this user")
    
    for task in user_tasks:    
        db.delete(task)
        
    db.commit()
    return {"message": "Tasks are Deleted Successfully"}



@app.get("/tasks/moodle", response_model=schemas.TaskQueueResponse)
async def fetch_moodle_tasks(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
   
):
    if not current_user.moodle_account:
        raise HTTPException(status_code=404, detail="No Moodle account found for this user")
    task = celery_app.send_task("extract_data_task", args=[current_user.id])
    return {"message": "Task queued", "task_id": task.id}
# --- Create Moodle Account ---
@app.post("/moodle/account", response_model=schemas.MoodleAccount)
def create_moodle_account(
    account: schemas.MoodleAccountCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Check if user already has a Moodle account
    existing = db.query(models.MoodleAccount).filter_by(user_id=current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Moodle account already exists")

    # Encrypt password before saving
    moodle_account = models.MoodleAccount(
        username=account.username,
        password=auth.encrypt_password(account.password),  # 🔐 encrypt
        batch=account.batch,
        user_id=current_user.id
    )
    db.add(moodle_account)
    db.commit()
    db.refresh(moodle_account)
    return moodle_account

# --- Update Moodle Account ---
@app.put("/moodle/account", response_model=schemas.MoodleAccount)
def update_moodle_account(
    account: schemas.MoodleAccountCreate,  # can also create a separate Update schema
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    moodle_account = db.query(models.MoodleAccount).filter_by(user_id=current_user.id).first()
    if not moodle_account:
        raise HTTPException(status_code=404, detail="Moodle account not found")

    # Update fields if provided
    moodle_account.username = account.username or moodle_account.username
    if account.password:
        moodle_account.password = auth.encrypt_password(account.password)
    moodle_account.batch = account.batch or moodle_account.batch
    if account.auto_sync is not None:
        moodle_account.auto_sync = account.auto_sync

    db.commit()
    db.refresh(moodle_account)
    return moodle_account

@app.get("/moodle/account", response_model=schemas.MoodleAccount)
def get_moodle_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    moodle_account = db.query(models.MoodleAccount).filter_by(user_id=current_user.id).first()
    if not moodle_account:
        raise HTTPException(status_code=404, detail="Moodle account not found")
    return moodle_account

@app.post("/logout")
async def logout():
    
    
    response = JSONResponse(content={"message": "Logout successful"})
    response.delete_cookie("access_token", httponly=True)
    response.delete_cookie("csrf_token")
    return response

@app.get("/admin/users", response_model=List[schemas.User])
def get_all_users(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins only")

    return db.query(models.User).all()

@app.post("/teams", response_model=schemas.Team)
async def create_team(
    team: schemas.TeamCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_team = db.query(models.Team).filter(models.Team.name == team.name).first()
    if db_team:
        raise HTTPException(status_code=400, detail="Team name already exists")
    db_team = models.Team(name=team.name)
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    # Automatically add creator to the team
    db_user_team = models.UserTeam(user_id=current_user.id, team_id=db_team.id)
    db.add(db_user_team)
    db.commit()
    return db_team



@app.post("/teams/{team_id}/join", response_model=schemas.UserTeam)
async def join_team(
    team_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    db_user_team = db.query(models.UserTeam).filter(
        models.UserTeam.user_id == current_user.id,
        models.UserTeam.team_id == team_id
    ).first()
    if db_user_team:
        raise HTTPException(status_code=400, detail="User already in team")
    db_user_team = models.UserTeam(user_id=current_user.id, team_id=team_id)
    db.add(db_user_team)
    db.commit()
    return db_user_team

@app.get("/teams", response_model=List[schemas.Team])
async def get_user_teams(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves a list of all teams the currently authenticated user is a member of.
    """
    # 1. Find all the links in the UserTeam table that belong to the current user.
    user_team_links = db.query(models.UserTeam).filter(models.UserTeam.user_id == current_user.id).all()

    # 2. Extract just the team IDs from those links.
    team_ids = [link.team_id for link in user_team_links]

    # 3. If the user isn't in any teams, return an empty list immediately.
    if not team_ids:
        return []

    # 4. Query the main Team table to get the full details for each team ID found.
    teams = db.query(models.Team).filter(models.Team.id.in_(team_ids)).all()
    
    return teams

@app.post("/report_item", response_model=schemas.LostAndFoundItem)
async def report_lost_and_found_item(
    title: str = Form(...),
    description: str = Form(...),
    status: str = Form(...),
    item_type: str = Form(...),
    location: str = Form(...),
    reporter_name: str = Form(None),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Handle photo upload if provided
    photo_path = None
    if photo:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        unique_name = f"{uuid.uuid4()}_{current_user.id}_{photo.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(photo.file, f)
        photo_path = file_path

    # Create the DB item
    db_item = models.LostAndFoundItem(
        title=title,
        description=description,
        status=status,
        item_type=item_type,
        location=location,
        reporter_name=reporter_name or current_user.name,
        user_id=current_user.id,
        photo_path=photo_path
    )

    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/lost_and_found_items", response_model=List[schemas.LostAndFoundItem])
async def get_lost_and_found_items(
    status: Optional[str] = None,
    item_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    query = db.query(models.LostAndFoundItem)

    if status:
        query = query.filter(models.LostAndFoundItem.status == status)
    if item_type:
        query = query.filter(models.LostAndFoundItem.item_type == item_type)

    items = query.order_by(desc(models.LostAndFoundItem.reported_at)).all()
    return items

@app.put("/lost_and_found_items/{item_id}", response_model=schemas.LostAndFoundItem)
async def update_lost_and_found_item(
    item_id: int,
    item_update: schemas.LostAndFoundItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_item = db.query(models.LostAndFoundItem).filter(models.LostAndFoundItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if db_item.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to update this item")

    for key, value in item_update.dict(exclude_unset=True).items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/lost_and_found_items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lost_and_found_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_item = db.query(models.LostAndFoundItem).filter(models.LostAndFoundItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if db_item.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")

    # Delete photo file if exists
    if db_item.photo_path and os.path.exists(db_item.photo_path):
        os.remove(db_item.photo_path)

    db.delete(db_item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# Quiz generation endpoint
@app.post("/upload_for_quiz")
async def upload_document_for_quiz(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    tag: str = Form(...)
):
    """
    Handles uploading a new document, checking for duplicates,
    and starting the background processing task.
    """
    if moderation.is_disallowed_image_upload(file.content_type, file.filename):
        raise HTTPException(status_code=400, detail="Image uploads are not allowed for quiz ingestion.")
    if not moderation.is_supported_rag_upload(file.content_type, file.filename):
        raise HTTPException(status_code=400, detail="Unsupported file type for quiz ingestion. Use PDF/TXT/DOCX.")
    if moderation.contains_vulgar_text(tag):
        raise HTTPException(status_code=400, detail="Tag contains disallowed language.")

    file_content = await file.read()
    content_hash = hashlib.sha256(file_content).hexdigest()

    # Check for duplicate
    existing_document = db.query(models.Document).filter(models.Document.content_hash == content_hash).first()
    if existing_document:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This exact document already exists with doc_id: {existing_document.id}"
        )

    doc_id = str(uuid.uuid4())
    db_document = models.Document(
        id=doc_id,
        filename=file.filename,
        tag=tag,
        content_hash=content_hash,
        user_id=current_user.id,
        status=models.DocumentStatus.PROCESSING,
        content_type=file.content_type
    )
    db.add(db_document)
    db.commit()
    
    target_dir = os.path.join(UPLOAD_DOC_DIR, tag)
    unique_name = f"{doc_id}_{file.filename}"
    permanent_file_path = os.path.join(target_dir, unique_name)
    # Use a unique name for the temp file to avoid conflicts
    try:
        with open(permanent_file_path, "wb") as f:
            f.write(file_content)
    except IOError as e:
        # If file saving fails, revert the database entry
        db.delete(db_document)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save the uploaded file: {e}"
        )

    # Start the Celery task
    celery_app.send_task("process_quiz_document", kwargs={"doc_id": doc_id, "file_path": permanent_file_path, "tag": tag, "user_id": str(current_user.id)})
    
    print(f"Dispatched task for doc_id: {doc_id} to Celery.")

    return schemas.Document.model_validate(db_document)


@app.post("/generate_quiz", response_model=schemas.QuizSessionPublic)
async def generate_quiz(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    settings_json: str = Form(...), # Quiz settings as a JSON string
    document_id: Optional[str] = Form(None),
    tag: Optional[str] = Form(None), # <-- Renamed from document_tag
    text_content: Optional[str] = Form(None)
):
    quiz_settings = schemas.QuizSettings(**json.loads(settings_json))
    content_for_llm = ""
    source_document_id = document_id

    if source_document_id:
        # FLOW 1: An existing document ID was provided
        if not tag:
            raise HTTPException(status_code=400, detail="A 'tag' is required when using a 'document_id'.")
            
        # Optional: Check if the doc is done processing
        doc_status = db.query(models.Document.status).filter(models.Document.id == source_document_id).scalar()
        if doc_status != models.DocumentStatus.COMPLETED:
             raise HTTPException(status_code=400, detail="Document is still processing or failed. Cannot generate quiz.")
            
        content_for_llm = quiz.get_representative_chunks_for_quiz(
            tag=tag, 
            source_doc_id=source_document_id
        )
    
    elif text_content:
        # FLOW 2: Raw text was pasted
        content_for_llm = text_content
    
    else:
        raise HTTPException(status_code=400, detail="No content source provided. Please provide a 'document_id' or 'text_content'.")

    # === Step 2: Generate the quiz using the LLM ===
    if not content_for_llm:
        raise HTTPException(status_code=400, detail="Content for quiz generation is empty or could not be found.")

    generated_data = quiz.quiz_generation(content_for_llm, quiz_settings.dict())

    # === Step 3: Save the session and questions to the database ===
    # (Your existing Step 3 logic is perfect and remains unchanged)
    db_session = models.QuizSession(
        user_id=current_user.id,
        quiz_settings=quiz_settings.dict(),
        document_id=source_document_id,
        raw_content=text_content if not source_document_id else None
    )
    db.add(db_session)
    db.flush()  # Flush to get the session ID
    for q_data in generated_data.get("questions", []):
        db_question = models.Question(
            session_id=db_session.id,
            **q_data
        )
        db.add(db_question)

    db.commit()
    db.refresh(db_session)
    
    return db_session


@app.get("/quiz/history", response_model=List[schemas.QuizSessionHistoryItem])
def get_user_quiz_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Retrieves the quiz history for the currently logged-in user.
    This endpoint fetches all quiz sessions, including their score and the
    name of the source document if applicable, ordered by the most recent first.
    """
    
    # 1. Query the database for QuizSession objects.
    # We use 'joinedload' to efficiently fetch the related Document in the same query,
    # which prevents performance issues (the "N+1 problem").
    sessions = (
        db.query(models.QuizSession)
        .options(joinedload(models.QuizSession.source_document))
        .filter(models.QuizSession.user_id == current_user.id)
        .order_by(models.QuizSession.created_at.desc())
        .all()
    )
    
    # 2. Manually construct the response to ensure correct formatting.
    # This gives us full control over the data sent to the frontend.
    response_items = []
    for session in sessions:
        response_items.append(
            schemas.QuizSessionHistoryItem(
                id=session.id,
                created_at=session.created_at,
                status=session.status.value,  # Convert Enum to string
                score=session.score,
                # Safely get the filename only if a source document exists
                source_document_filename=session.source_document.filename if session.source_document else None
            )
        )
        
    return response_items

@app.get("/quiz/session/{session_id}", response_model=schemas.QuizSessionPublic)
def get_quiz_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Fetches a quiz session's questions (without answers).
    Used to resume an "in_progress" quiz.
    """
    db_session = db.query(models.QuizSession).filter(
        models.QuizSession.id == session_id,
        models.QuizSession.user_id == current_user.id
    ).first()

    if not db_session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
        
    if db_session.status == models.QuizStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="This quiz is already completed")

    # We return QuizSessionPublic, which automatically uses QuestionPublic
    # and hides the correct answers.
    return db_session


@app.post("/quiz/submit", response_model=schemas.QuizResult)
def submit_quiz(
    submission: schemas.QuizSubmission,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Submits user's answers for a quiz session, grades it,
    and returns the final results.
    """
    
    # 1. Find the quiz session and its questions
    db_session = db.query(models.QuizSession).options(
        joinedload(models.QuizSession.questions)
    ).filter(
        models.QuizSession.id == submission.session_id,
        models.QuizSession.user_id == current_user.id
    ).first()

    if not db_session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    if db_session.status == models.QuizStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="This quiz has already been completed")

    # 2. Grade the answers
    questions_map = {q.id: q for q in db_session.questions}
    user_answers_map = {a.question_id: a.selected_answer for a in submission.answers}
    
    total_questions = len(db_session.questions)
    correct_count = 0
    question_results = [] # To build the schemas.QuestionResult list

    for q_id, question in questions_map.items():
        user_answer = user_answers_map.get(q_id, "") # Get user's answer, default to ""
        is_correct = (user_answer.lower().strip() == question.correct_answer.lower().strip())
        
        if is_correct:
            correct_count += 1
            
        # Add to the results list
        question_results.append(schemas.QuestionResult(
            question_text=question.question_text,
            your_answer=user_answer,
            correct_answer=question.correct_answer,
            is_correct=is_correct
        ))

    # 3. Calculate score and update session in DB
    final_score = round((correct_count / total_questions) * 100, 2) if total_questions > 0 else 0
    db_session.score = final_score
    db_session.status = models.QuizStatus.COMPLETED
    db_session.results_data = [res.model_dump() for res in question_results]
    
    db.commit()
    db.refresh(db_session)

    # 4. Return the full results
    return schemas.QuizResult(
        id=db_session.id,
        score=db_session.score,
        results=question_results
    )

@app.get("/quiz/results/{session_id}", response_model=schemas.QuizResult)
def get_quiz_results(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Retrieves the full, saved results for a completed quiz.
    """
    db_session = db.query(models.QuizSession).filter(
        models.QuizSession.id == session_id,
        models.QuizSession.user_id == current_user.id
    ).first()

    if not db_session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
        
    if db_session.status != models.QuizStatus.COMPLETED or not db_session.results_data:
        raise HTTPException(status_code=400, 
                            detail="This quiz is not yet completed or results are unavailable.")

    # Pydantic automatically validates the raw JSON from `results_data`
    # against the `List[QuestionResult]` schema in `QuizResult`.
    return schemas.QuizResult(
        id=db_session.id,
        score=db_session.score,
        results=db_session.results_data
    )

@app.delete("/quiz/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Deletes a quiz session and all its associated questions.
    """
    db_session = db.query(models.QuizSession).filter(
        models.QuizSession.id == session_id,
        models.QuizSession.user_id == current_user.id
    ).first()

    if not db_session:
        raise HTTPException(status_code=404, detail="Quiz session not found")

    db.delete(db_session)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.post("/documents/generate", response_model=schemas.DocumentTaskResponse)
async def start_document_generation(
    request_data: schemas.DocumentGenerationRequest,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Starts the document generation task in a Celery worker.
    """
    task_id = f"doc_gen_{uuid.uuid4()}"
    
    # Send the task to Celery
    # We send the user_id and the payload as a dict (Celery requirement)
    output_file_path = os.path.join(DOC_GENERATION_DIR, f"{current_user.name}_{current_user.id}_{task_id}.docx")
    try:
        # 1. Create the DB record with "QUEUED" status
        db_doc = models.GeneratedDocument(
            id=task_id,
            user_id=current_user.id,
            status=models.GenerationStatus.QUEUED,
            basic_details_json=request_data.basicDetails.model_dump_json(),
            selected_sections_json=json.dumps(request_data.selectedSections),
            generated_content=output_file_path # Store the intended path
            
        )
        db.add(db_doc)
        db.commit()
        celery_app.send_task("generate_document_task", kwargs={"output_file_path": output_file_path, "task_id": task_id, "user_id": current_user.id, "payload_dict": request_data.dict()})
        
        return schemas.DocumentTaskResponse(task_id=task_id, status=models.GenerationStatus.QUEUED)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to queue task: {str(e)}")


@app.get("/documents/status/{task_id}", response_model=schemas.DocumentTaskStatus)
async def get_document_status(
    task_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Polls the database for the status of a generation task.
    """
    doc = db.query(models.GeneratedDocument).filter(
        models.GeneratedDocument.id == task_id,
        models.GeneratedDocument.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return schemas.DocumentTaskStatus(
        task_id=doc.id,
        status=doc.status,
        error=doc.error_message
    )


@app.get("/documents/download/{task_id}")
async def download_document(
    task_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Reads the file path from the DB and returns the .docx file.
    """
    doc = db.query(models.GeneratedDocument).filter(
        models.GeneratedDocument.id == task_id,
        models.GeneratedDocument.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if doc.status != models.GenerationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail=f"Document is not ready. Status: {doc.status}")

    file_path = doc.generated_content
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail="Generated file not found on server.")

    # Get user's document count for a nice filename
    doc_count = db.query(models.GeneratedDocument).filter(
        models.GeneratedDocument.user_id == current_user.id,
        models.GeneratedDocument.status == models.GenerationStatus.COMPLETED
    ).count()
    
    user_name_safe = "".join(e for e in current_user.name if e.isalnum()) or "User"
    filename = f"{user_name_safe}_Doc{doc_count or 1}.docx"

    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))

redis_client = aioredis.from_url(
    f"redis://{REDIS_HOST}:{REDIS_PORT}",
    decode_responses=True, # Decode responses from bytes to strings
    health_check_interval=30
)

async def get_redis_client():
    """
    Dependency to provide the Redis client.
    Handles connection errors gracefully.
    """
    try:
        # The client pool handles the connection. We just return the client.
        # A quick ping to check if the connection is alive.
        await redis_client.ping()
        return redis_client
    except Exception as e:
        # This will be caught by FastAPI
        print(f"Could not connect to Redis at {REDIS_HOST}:{REDIS_PORT}: {e}")
        raise HTTPException(
            status_code=503, # 503 Service Unavailable
            detail=f"Could not connect to Redis cache: {e}"
        )
@app.post("/study-assistant/summarize", response_model=schemas.SummarizeResponse)
async def summarize_text(
    request: schemas.SummarizeRequest,
    current_user: models.User = Depends(get_current_active_user),
    redis_client: aioredis.Redis = Depends(get_redis_client)
):
    """
    Summarizes the provided text using the LLM.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text to summarize cannot be empty.")
    key_material = f"{request.text.strip()}:{request.length}"
    cache_key = f"summary:{hashlib.sha256(key_material.encode('utf-8')).hexdigest()}"
    try:
        cached_summary = await redis_client.get(cache_key)
        if cached_summary:
            return schemas.SummarizeResponse(summary=cached_summary)
    except Exception as e:
        # Log the error but don't fail the request.
        # If cache fails, we can still serve from the API.
        print(f"Redis GET failed: {e}")
    summary = summarize.summary_gen(request.text, length=request.length)
    try:
        # Set with a 1-hour expiration (3600 seconds)
        await redis_client.set(cache_key, summary, ex=3600)
    except Exception as e:
        # Log the error, but we can still return the summary
        print(f"Redis SET failed: {e}")
    return schemas.SummarizeResponse(summary=summary)

#--------------------------------- Atttendace Tracker Endpoints ---------------------------------#
@app.post("/api/subjects", response_model=schemas.Subject, tags=["Subjects"])
def create_subject(
    subject: schemas.SubjectCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    # ...
    
    existing = db.query(models.Subject).filter(
        models.Subject.code == subject.code,
        models.Subject.user_id == current_user.id 
    ).first()   
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject code '{subject.code}' already exists for this user."
        )
    
    try:
        db_subject = models.Subject(
            name=subject.name,
            code=subject.code,
            color=subject.color,
            user_id=current_user.id,
            schedules=[
                models.Schedule(day=s.day, time=s.time) for s in subject.schedules
            ]
        )
        
        db.add(db_subject)
        db.commit() # ONE clean, transactional commit
        db.refresh(db_subject)
        return db_subject
        
    except Exception as e:
        # If the error is here, it's a model or database constraint problem
        db.rollback()
        print(f"ERROR during subject creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write to database: {e}"
        )


@app.get("/api/subjects", response_model=List[schemas.Subject], tags=["Subjects"])
def get_subjects_for_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    subjects = db.query(models.Subject).filter(
        models.Subject.user_id == current_user.id
    ).all()
    return subjects

@app.get("/api/subjects/{subject_id}", response_model=schemas.Subject, tags=["Subjects"])
def get_subject(
    subject_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    subject = db.query(models.Subject).filter(
        models.Subject.id == subject_id,
        models.Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found or permission denied")
    return subject

# --- Class & Attendance Endpoints (For "Mark Attendance" Tab) ---

# main.py

@app.get("/api/class-instances", response_model=List[schemas.ClassInstance], tags=["Classes"])
def get_class_instances_for_date(
    target_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Gets all class instances for the current user on a specific date.
    
    *** NEW LOGIC ***
    This endpoint now auto-creates class instances from schedules
    if they don't already exist for the target_date.
    """
    
    # 1. Get the day of the week string (e.g., "monday")
    day_of_week_str = target_date.strftime("%A").lower()

    # 2. Find all schedules for that day of the week for this user
    schedules_for_day = (
        db.query(models.Schedule)
        .join(models.Subject)
        .filter(
            models.Subject.user_id == current_user.id,
            models.Schedule.day == day_of_week_str
        )
    ).all()

    # 3. Find all instances that *already exist* for this user on this date
    existing_instances = (
        db.query(models.ClassInstance)
        .join(models.Subject)
        .filter(
            models.Subject.user_id == current_user.id,
            models.ClassInstance.date == target_date
        )
    ).all()

    # 4. Create a lookup set of (subject_id, time) for fast checking
    # (This prevents us from creating duplicates)
    existing_instance_set = {
        (inst.subject_id, inst.time) for inst in existing_instances
    }

    # 5. Loop through schedules and find what's missing
    instances_to_add = []
    for schedule in schedules_for_day:
        # If this schedule's (subject, time) is NOT in the set, create it
        if (schedule.subject_id, schedule.time) not in existing_instance_set:
            new_instance = models.ClassInstance(
                subject_id=schedule.subject_id,
                date=target_date,
                time=schedule.time
            )
            instances_to_add.append(new_instance)

    # 6. If we have new instances to add, commit them to the DB
    if instances_to_add:
        db.add_all(instances_to_add)
        db.commit()

    # 7. Finally, query AGAIN to get all instances (existing + newly created)
    # This is the same query you had originally, but now it will find the
    # instances we just created.
    all_instances = (
        db.query(models.ClassInstance)
        .join(models.Subject)
        .filter(
            models.Subject.user_id == current_user.id,
            models.ClassInstance.date == target_date
        )
        .order_by(models.ClassInstance.time)
        .all()
    )
    
    return all_instances


@app.post("/api/class-instances", response_model=schemas.CreateClassInstanceResponse, status_code=status.HTTP_201_CREATED, tags=["Classes"])
def create_class_instance(
    class_in: schemas.ClassInstanceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Manually adds a new class instance (the "Add Class" button).
    Returns a job_id for polling.
    """
    # Security Check: Verify this subject belongs to this user
    subject = db.query(models.Subject).filter(
        models.Subject.id == class_in.subject_id,
        models.Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=404, 
            detail="Subject not found or you do not have permission to access it."
        )
    
    db_class = models.ClassInstance(
        subject_id=class_in.subject_id,
        date=class_in.date,
        time=class_in.time
    )
    db.add(db_class)
    
    db_job = models.SubjectStatJob(
        user_id=current_user.id,
        status=models.JobStatusEnum.PENDING
    )
    db.add(db_job)
    db.commit()
    
    # --- Trigger Celery Task ---
    celery_app.send_task("update_subject_stats", args=[subject.id, db_job.id])
    
    db.refresh(db_class)
    db.refresh(db_job) # Refresh to get job ID
    
    # Return the response with the job object
    return schemas.CreateClassInstanceResponse(
        class_instance=db_class,
        job=db_job
    )


@app.put("/api/class-instances/{instance_id}/attendance", response_model=schemas.MarkAttendanceResponse, tags=["Attendance"])
def mark_attendance(
    instance_id: int,
    record_in: schemas.AttendanceRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Marks attendance for a single class instance.
    Returns a job_id for polling.
    """
    
    # Security Check: Verify this instance belongs to this user
    instance = (
        db.query(models.ClassInstance)
        .join(models.Subject)
        .filter(
            models.ClassInstance.id == instance_id,
            models.Subject.user_id == current_user.id
        )
    ).first()

    if not instance:
        raise HTTPException(
            status_code=404,
            detail="Class instance not found or you do not have permission."
        )

    # Check if a record *already exists*
    record = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.class_instance_id == instance_id
    ).first()
    
    if record:
        record.status = record_in.status
        
    else:
        record = models.AttendanceRecord(
            class_instance_id=instance_id,
            status=record_in.status
        )
        db.add(record)
        
    # --- Create the Job Entry ---
    db_job = models.SubjectStatJob(
        user_id=current_user.id,
        status=models.JobStatusEnum.PENDING
    )
    db.add(db_job)
    
    # Commit both the record and the job
    db.commit()
    
    # --- Trigger Celery Task ---
    celery_app.send_task("update_subject_stats", args=[instance.subject_id, db_job.id])
    
    db.refresh(record)
    db.refresh(db_job) # Refresh to get job ID
    
    # Return the response with the job object
    return schemas.MarkAttendanceResponse(
        record=record,
        job=db_job
    )


# --- THIS IS YOUR POLLING ENDPOINT ---
@app.get("/api/attendance/job/status/{job_id}", response_model=schemas.StatJobStatus, tags=["Attendance Jobs"]
)
async def get_stat_job_status(
    job_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Polls the database for the status of a Subject Stat Recalculation Job.
    Your frontend will call this every 2 seconds.
    """
    # Security: We check that the job_id belongs to the current user
    job = db.query(models.SubjectStatJob).filter(
        models.SubjectStatJob.id == job_id,
        models.SubjectStatJob.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or permission denied")
        
    return job

@app.get("/api/calendar-view", response_model=List[schemas.CalendarDay], tags=["Analytics"])
def get_calendar_view(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Gets the "summary" attendance status for each day of a given month
    for the current user.
    
    Prioritizes statuses: absent > present > cancelled
    """
    
    # 1. Get all instances for the user in that month
    instances = (
        db.query(models.ClassInstance)
        .join(models.Subject)
        .filter(
            models.Subject.user_id == current_user.id,
            extract('year', models.ClassInstance.date) == year,
            extract('month', models.ClassInstance.date) == month
        )
        .options(joinedload(models.ClassInstance.attendance_record)) # Eager load record
        .all()
    )
    
    # 2. Process in Python to get one status per day
    # Key: date_obj, Value: {"present": 0, "absent": 0, "cancelled": 0}
    day_statuses = {}
    for inst in instances:
        date_obj = inst.date
        status = inst.attendance_record.status if inst.attendance_record else None
        
        if date_obj not in day_statuses:
            day_statuses[date_obj] = {"present": 0, "absent": 0, "cancelled": 0}
        
        if status:
            day_statuses[date_obj][status.value] += 1
    
    # 3. Determine final summary status for each day
    response_data = []
    for date_obj, counts in day_statuses.items():
        if counts["absent"] > 0:
            final_status = models.AttendanceStatus.absent
        elif counts["present"] > 0:
            final_status = models.AttendanceStatus.present
        elif counts["cancelled"] > 0:
            final_status = models.AttendanceStatus.cancelled
        else:
            continue # Skip if no *marked* classes for this day
        
        response_data.append(schemas.CalendarDay(date=date_obj, status=final_status))
    
    return response_data


# --- NEW ENDPOINT 2: ANALYTICS INSIGHTS ---
@app.get("/api/analytics-insights", response_model=schemas.AnalyticsInsights, tags=["Analytics"])
def get_analytics_insights(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Calculates and returns advanced analytics:
    - Attendance percentage by day of the week.
    - Weekly attendance trend for the last 12 weeks.
    """
    
    # --- Define the consistent case logic ---
    AR = aliased(models.AttendanceRecord)
    
    # Count 1 if status is 'present', 0 otherwise
    attended_case = case(
        (AR.status == models.AttendanceStatus.present, 1),
        else_=0
    )
    
    # Count 1 if status is NOT 'cancelled' (including NULL/unmarked), 0 otherwise
    held_case = case(
        (AR.status == models.AttendanceStatus.cancelled, 0),
        else_=1
    )
    
    # --- 1. Attendance by Day of Week ---
    
    # Use isodow (1=Mon, 7=Sun)
    dow_query = extract('isodow', models.ClassInstance.date).label("dow")
    
    day_stats = (
        db.query(
            dow_query,
            func.sum(held_case).label("total_held"),
            func.sum(attended_case).label("total_attended")
        )
        .select_from(models.ClassInstance)
        .join(models.Subject)
        .outerjoin(AR, models.ClassInstance.attendance_record)
        .filter(models.Subject.user_id == current_user.id)
        .group_by(dow_query)
    ).all()

    day_map = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" }
    attendance_by_day_data = []
    for row in day_stats:
        if row.total_held > 0:
            attendance_by_day_data.append({
                "day": day_map.get(row.dow, "N/A"),
                "percentage": (row.total_attended / row.total_held) * 100
            })
    
    # --- 2. Weekly Trend (Last 12 Weeks) ---
    twelve_weeks_ago = datetime.now(timezone.utc).date() - timedelta(weeks=12)
    
    # Truncate date to the start of the week
    week_trunc = func.date_trunc('week', models.ClassInstance.date).label("week_start")

    week_stats = (
        db.query(
            week_trunc,
            func.sum(held_case).label("total_held"),
            func.sum(attended_case).label("total_attended")
        )
        .select_from(models.ClassInstance)
        .join(models.Subject)
        .outerjoin(AR, models.ClassInstance.attendance_record)
        .filter(
            models.Subject.user_id == current_user.id,
            models.ClassInstance.date >= twelve_weeks_ago
        )
        .group_by(week_trunc)
        .order_by(week_trunc)
    ).all()
    
    weekly_trend_data = []
    for row in week_stats:
        if row.total_held > 0:
            weekly_trend_data.append({
                "week_start_date": row.week_start,
                "week_label": row.week_start.strftime("%m-%d"),
                "percentage": (row.total_attended / row.total_held) * 100
            })

    return schemas.AnalyticsInsights(
        attendance_by_day=attendance_by_day_data,
        weekly_trend=weekly_trend_data
    )

