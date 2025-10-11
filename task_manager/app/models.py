from sqlalchemy import Integer, Column, String, DateTime, ForeignKey, Boolean, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
import enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableList

# Enum for document status
class DocumentStatus(str, enum.Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    
class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
class User(Base):
    __tablename__="users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String,  unique=True, index=True)
    hashed_password = Column(String)  #Stores hashed passwords
    is_admin = Column(Boolean, default=False)  # <-- Add this
    
    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="owner", cascade="all, delete-orphan")
    moodle_account = relationship("MoodleAccount", back_populates="user", uselist=False, cascade="all, delete-orphan")
class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class UserTeam(Base):
    __tablename__ = "user_teams"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id"), primary_key=True)
class Task(Base):
    __tablename__= "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    desc = Column(String, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    due_date = Column(DateTime, nullable=True)
    tags = Column(MutableList.as_mutable(JSONB), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estimated_hours = Column(Integer, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"))
    is_moodle_task = Column(Boolean, default=False)  # New field to mark Moodle tasks
    task_url = Column(String, nullable=True, unique=True)
class MoodleAccount(Base):
    __tablename__ = "moodle_accounts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)   # ⚠️ Encrypt before saving!
    batch = Column(String, nullable=False)
    auto_sync = Column(Boolean, default=True)
    last_synced_at = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    user = relationship("User", back_populates="moodle_account")
   
# New Document Model to track uploads

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, index=True) # This will be our doc_id (UUID)
    filename = Column(String, index=True)
    tag = Column(String, index=True)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PROCESSING)
    content_hash = Column(String, unique=True, index=True) # SHA256 hash of the file content
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = Column(Integer, ForeignKey("users.id"))
    chroma_ids = Column(JSONB, nullable=True)   # PostgreSQL JSONB is perfect for lists
    owner = relationship("User", back_populates="documents")
    
class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(String, primary_key=True, index=True) # A UUID for the conversation
    title = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False) # Will be 'user' or 'assistant'
    content = Column(Text, nullable=False) # Use Text for potentially long messages
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    sources = Column(JSONB, nullable=True)
    conversation = relationship("Conversation", back_populates="messages")