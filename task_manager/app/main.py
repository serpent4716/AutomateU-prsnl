from fastapi import FastAPI, Depends, HTTPException, status, Request, Response, Cookie, UploadFile, File, Form, BackgroundTasks, Header, Security
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
import uuid
import hashlib
import os, json
from pydantic import BaseModel, EmailStr
from datetime import timedelta
import app.models as models
import app.schemas as schemas
import app.database as database
import app.auth as auth
from typing import List, Optional
import numpy as np
import app.utils.populate_database as populate_db
from app.utils.populate_database import DATA_DIR, CHROMA_PATH
from app.celery_worker import process_document_task, extract_data_task
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.models import APIKey
import app.utils.tasks as tasks

app = FastAPI()
models.Base.metadata.create_all(bind=database.engine)        # ***only good for development, not production***


def get_db():
    
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CORS settings - adjust as needed for your frontend for react
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        status=models.DocumentStatus.PROCESSING
    )
    db.add(db_document)
    db.commit()

    save_dir = os.path.join(populate_db.DATA_DIR, "temp_uploads")
    os.makedirs(save_dir, exist_ok=True)
    # Use a unique name for the temp file to avoid conflicts
    temp_file_path = os.path.join(save_dir, f"{doc_id}_{file.filename}")
    
    with open(temp_file_path, "wb") as f:
        f.write(file_content)

    # background_tasks.add_task(
    #     populate_db.run_ingestion_pipeline,
    #     db_url=str(database.engine.url), # Pass the database URL as a string
    #     doc_id=doc_id,
    #     file_path=temp_file_path,
    #     tag=tag,
    #     user_id=str(current_user.id)
    # )
    process_document_task.delay(
        doc_id=doc_id,
        file_path=temp_file_path,
        tag=tag,
        user_id=str(current_user.id)
    )
    print(f"Dispatched task for doc_id: {doc_id} to Celery.")

    return schemas.Document.model_validate(db_document)

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
        populate_db.delete_from_chroma(db_doc.chroma_ids, db_doc.tag)

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

    # Perform RAG search
    # 1. Broad Retrieval: Get more documents initially (e.g., k=10)
    print(f"Retrieving documents for tag: '{ask_request.tag}'")
    chroma_db = populate_db.get_chroma_db(ask_request.tag)
    retrieved_docs = chroma_db.similarity_search(ask_request.question, k=10)
    
    # 2. Re-ranking: Use the cross-encoder to find the most relevant documents
    reranked_docs = populate_db.rerank_documents(ask_request.question, retrieved_docs)

    # 3. Final Context Selection: Use the top 3 from the re-ranked list
    top_k_reranked = reranked_docs[:3]
    context_text = "\n\n---\n\n".join([doc.page_content for doc in top_k_reranked])
    sources = populate_db.format_sources(top_k_reranked)

    # Get response from LLM
    formatted_history = populate_db.format_chat_history(chat_history_messages)
    answer = populate_db.query_llm(ask_request.question, context_text, formatted_history)

    # Save the assistant's response
    assistant_message = models.Message(conversation_id=conversation_id, role="assistant", content=answer, sources=sources)
    db.add(assistant_message)
    db.commit()

    return schemas.AskResponse(answer=answer, sources=sources, conversation_id=conversation_id)

@app.post("/users", response_model=schemas.User)
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
     # Only this email gets admin rights
    is_admin = user.email == "admin@example.com"

    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        is_admin=is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login")
async def login(response: Response, request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not auth.verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    csrf_token = auth.create_csrf_token()
    access_token_expire = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    data_for_jwt = {"sub": str(user.id), "csrf": csrf_token}
    access_token = auth.create_access_token(
        data=data_for_jwt, 
        expires_delta=access_token_expire
    )
    
    auth.set_login_cookies(response, access_token, csrf_token)

    return {"message": "Login successful", "csrf_token": csrf_token, "user": user}

@app.get("/auth/refresh")
# --- THE FIX ---
# 1. Inject `response: Response` into the function signature.
async def refresh_csrf(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    This endpoint now correctly generates and SETS a new access_token cookie,
    in addition to returning a new CSRF token.
    """
    user = auth.get_current_user_from_cookie(request, csrf_token_from_header=None, db=db, validate_csrf=False)

    new_csrf_token = auth.create_csrf_token()
    access_token_expire = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    data_for_jwt = {"sub": str(user.id), "csrf": new_csrf_token}
    new_access_token = auth.create_access_token(data=data_for_jwt, expires_delta=access_token_expire)

    # 2. Set the cookies on the *injected* response object.
    auth.set_login_cookies(response, new_access_token, new_csrf_token)
    
    # 3. Return the JSON body. FastAPI will add this to the same response
    #    object that now contains the cookies.
    return {"message": "CSRF refreshed", "csrf_token": new_csrf_token, "user": user}

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


@app.get("/tasks", response_model=List[schemas.Task])
async def read_tasks(
    current_user: models.User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 60,
    db: Session = Depends(get_db),
):
    
    user_teams = db.query(models.UserTeam).filter(models.UserTeam.user_id == current_user.id).all()
    team_ids = [team.team_id for team in user_teams] + [0]
    tasks = db.query(models.Task).filter(
        (models.Task.user_id == current_user.id) |
        (models.Task.team_id.in_(team_ids))
    ).offset(skip).limit(limit).all()
    
            
    #tasks = db.query(models.Task).offset(skip).limit(limit).all()
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
    task = extract_data_task.delay(current_user.id)
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