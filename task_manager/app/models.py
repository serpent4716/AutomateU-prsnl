from sqlalchemy import Integer, Column, String, DateTime, ForeignKey, Boolean, Enum, Text, Float, Time, Date, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
import enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableList
from pgvector.sqlalchemy import Vector


# Enum for document status
class DocumentStatus(str, enum.Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class QuizStatus(enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class LostandFoundStatus(str, enum.Enum):
    LOST = "lost"
    FOUND = "found"
    RESOLVED = "resolved"

class LostAndFoundItemType(str, enum.Enum):
    ELECTRONICS = "electronics"
    CLOTHING = "clothing"
    PERSONAL_ITEM = "personal_item"
    BAGS = "bags"
    BOOKS = "books"
    JEWELRY = "jewelry"
    KEYS = "keys"
    OTHERS = "others"

class GenerationStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    cancelled = "cancelled"

class DayOfWeek(str, enum.Enum):
    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"
    saturday = "saturday"
    sunday = "sunday"

# This enum defines the states for your pollable job
class JobStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"

class User(Base):
    __tablename__="users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String,  unique=True, index=True)
    hashed_password = Column(String, nullable=True)  #Stores hashed passwords nullable for google auth
    is_admin = Column(Boolean, default=False)  # <-- Add this
    timezone = Column(String, default="UTC")
    language = Column(String, default="en")
    is_verified = Column(Boolean, default=False, nullable=False)
    
    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="owner", cascade="all, delete-orphan")
    moodle_account = relationship("MoodleAccount", back_populates="user", uselist=False, cascade="all, delete-orphan")
    quiz_sessions = relationship("QuizSession", back_populates="owner", cascade="all, delete-orphan")
    generated_documents = relationship("GeneratedDocument", back_populates="owner", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    stat_jobs = relationship("SubjectStatJob", back_populates="user", cascade="all, delete-orphan")
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
    task_url = Column(String, nullable=True, index=True) 
    
    # Step 2: Add this "table arguments" block at the *end* of your Task class
    __table_args__ = (
        UniqueConstraint('user_id', 'task_url', name='_user_task_url_uc'),
    )
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
    tag = Column(String, index=True) # subject 
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PROCESSING)
    content_hash = Column(String, unique=True, index=True) # SHA256 hash of the file content
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = Column(Integer, ForeignKey("users.id"))
    chroma_ids = Column(JSONB, nullable=True)   # PostgreSQL JSONB is perfect for lists
    owner = relationship("User", back_populates="documents")
    content_type = Column(String, nullable=True)

    quiz_sessions = relationship("QuizSession", back_populates="source_document", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tag = Column(String, nullable=False, index=True)
    source = Column(String, nullable=False)
    page = Column(Integer, nullable=False, default=1)
    chunk_index = Column(Integer, nullable=False, default=0)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(3072), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="chunks")
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

class LostAndFoundItem(Base):
    __tablename__ = "lost_and_found_items"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(Enum(LostandFoundStatus), default=LostandFoundStatus.LOST)
    item_type = Column(Enum(LostAndFoundItemType), default=LostAndFoundItemType.OTHERS)
    location = Column(String, nullable=True)
    photo_path = Column(String, nullable=True)
    reporter_name = Column(String, nullable=False, default="Anonymous")
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", backref="reports")

class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(Enum(QuizStatus), default=QuizStatus.IN_PROGRESS)
    score = Column(Float, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(String, ForeignKey("documents.id"), nullable=True)
    raw_content = Column(Text, nullable=True)
    quiz_settings = Column(JSONB, nullable=False) #Stores the user's choices from the "Customize Quiz" 
    results_data = Column(JSONB, nullable=True)
    owner = relationship("User", back_populates="quiz_sessions")
    source_document = relationship("Document", back_populates="quiz_sessions")
    questions = relationship("Question", back_populates="session", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False)
    options = Column(JSONB, nullable=True) # Stores the possible answers (e.g.{"A": "Paris", "B": "London"}). 
    correct_answer = Column(String, nullable=False)

    session_id = Column(Integer, ForeignKey("quiz_sessions.id"), nullable=False)
    session = relationship("QuizSession", back_populates="questions")

class GeneratedDocument(Base):
    __tablename__ = "generated_documents"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(GenerationStatus), nullable=False, default=GenerationStatus.QUEUED)
    basic_details_json = Column(Text) # Store the basicDetails dict as a JSON string
    selected_sections_json = Column(Text) # Store the selectedSections list as a JSON string
    generated_content = Column(String, nullable=True) 
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    owner = relationship("User", back_populates="generated_documents")

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    color = Column(String, default="#3B82F6")
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # --- Calculated Stats ---
    total_classes_held = Column(Integer, default=0)
    total_classes_attended = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    # --- Relationships ---
    user = relationship("User", back_populates="subjects")
    schedules = relationship("Schedule", back_populates="subject", cascade="all, delete-orphan")
    class_instances = relationship("ClassInstance", back_populates="subject", cascade="all, delete-orphan")


class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)
    day = Column(Enum(DayOfWeek), nullable=False)
    time = Column(Time, nullable=False)
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    subject = relationship("Subject", back_populates="schedules")



class ClassInstance(Base):
    """
    Represents a SINGLE, SPECIFIC class session that occurs or will occur.
    e.g., "Data Structures on 2024-10-28 at 9:00 AM".
    This is the "source of truth" for what classes actually exist.
    """
    __tablename__ = "class_instances"

    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False, index=True)
    time = Column(Time, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    subject = relationship("Subject", back_populates="class_instances")
    attendance_record = relationship("AttendanceRecord", back_populates="class_instance", uselist=False, cascade="all, delete-orphan",)


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    class_instance_id = Column(Integer, ForeignKey("class_instances.id"), nullable=False, unique=True, index=True)
    status = Column(Enum(AttendanceStatus), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    class_instance = relationship("ClassInstance", back_populates="attendance_record")

class SubjectStatJob(Base):
    """
    This table stores the status of your background "stat recalculation" jobs,
    allowing your React app to poll for results.
    """
    __tablename__ = "subject_stat_jobs" 
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    user = relationship("User", back_populates="stat_jobs")
    
    status = Column(Enum(JobStatusEnum), nullable=False, default=JobStatusEnum.PENDING)
    error_message = Column(Text, nullable=True) # Stores the error if it fails  
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
