# auth.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request, Response, Security, Header
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from sqlalchemy.orm import Session
import app.models as models
import app.database as database
import secrets
from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

load_dotenv()

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
fernet = Fernet(ENCRYPTION_KEY.encode())
APP_ENV = os.getenv("APP_ENV")

# Configuration
SECRET_KEY = "your-secret-key-1234567890"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30    
CSRF_COOKIE_NAME = "csrf_token"
#CSRF_HEADER_NAME = "X-CSRF-Token"
csrf_scheme = APIKeyHeader(name="X-CSRF-Token", auto_error=False)
# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Password utilities
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Moodle Password encryption/decryption using Fernet symmetric encryption
def encrypt_password(password: str) -> str:
    return fernet.encrypt(password.encode()).decode()

def decrypt_password(encrypted_password: str) -> str:
    return fernet.decrypt(encrypted_password.encode()).decode()

# JWT Token Creation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# CSRF Token Generation
def create_csrf_token():
    return secrets.token_urlsafe(32)

# Set HttpOnly access token + readable CSRF token
def set_login_cookies(response: Response, access_token: str, csrf_token: str):
    IS_PRODUCTION = (APP_ENV == "production")
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION, 
        # 'samesite' MUST be "None" for cross-domain to work,
        # but "None" *requires* 'secure=True'.
        samesite="None" if IS_PRODUCTION else "Lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False, # <-- THIS IS CRITICAL
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,

        # The security settings for transport MUST match the access token
        secure=IS_PRODUCTION,
        samesite="None" if IS_PRODUCTION else "Lax",
    )

# Extract token from cookie
def get_token_from_cookie(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return token

# Authenticate user using cookie + verify CSRF
def get_current_user_from_cookie(request: Request,csrf_token_from_header: str, db: Session = Depends(get_db), validate_csrf: bool = True):
    token = get_token_from_cookie(request)

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        csrf_from_jwt = payload.get("csrf")
        # if not user_id:
        #     raise HTTPException(status_code=401, detail="Invalid token payload")
        if user_id is None or csrf_from_jwt is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        # try:
        #     user_id = int(user_id)  # Ensure user_id is an integer
        # except ValueError:
        #     raise HTTPException(status_code=401, detail="Invalid user ID in token")
        # CSRF Token Validation
        
        if validate_csrf:
            # 3. Compare the token from the header with the token from the JWT.
            # This eliminates any chance of a stale cookie causing a mismatch.
            if csrf_token_from_header != csrf_from_jwt:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token mismatch"
                )
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials (token invalid)"
        )

    

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user
