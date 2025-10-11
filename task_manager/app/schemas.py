# request/response validation and serialization

from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional, List
# Import the enum from models
from app.models import DocumentStatus
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Defines the common attributes for a task.
# Fields required only on creation (like team_id) or only on read (like id) are excluded.
class TaskBase(BaseModel):
    title: str
    desc: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    tags: Optional[List[str]] = []
    estimated_hours: Optional[int] = None
    team_id: Optional[int] = None
    is_moodle_task: Optional[bool] = False
    task_url: Optional[str] = None
# Schema for creating a task. Inherits from TaskBase and adds required fields.
# A task cannot be created without being assigned to a team and a user.
class TaskCreate(TaskBase):
    pass

# Schema for reading a task. Inherits from TaskBase and adds database-generated fields.
# This represents a complete task object as it exists in the database.
class Task(TaskBase):
    id: int
    created_at: datetime
    team_id: Optional[int]
    user_id: int 
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: EmailStr
    

class UserCreate(UserBase):
    password: str  #for creating users with pass 
    @field_validator("password")
    def validate_password(cls, value):
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return value
class User(UserBase):
    id: int 
    is_admin: bool
    class Config:
        from_attributes = True
        
class MoodleAccountBase(BaseModel):
    username: str
    batch: str
    auto_sync: bool = True 
    ast_synced_at: datetime | None = None
class MoodleAccountCreate(MoodleAccountBase):
    password: str   # raw password, will encrypt before saving
    auto_sync: Optional[bool] = None

class MoodleAccount(MoodleAccountBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True
class Token(BaseModel):
    access_token: str
    token_type: str
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
class TeamBase(BaseModel):
    name: str

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    id: int
    class Config:
        from_attributes = True

class UserTeam(BaseModel):
    user_id: int
    team_id: int
    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    id: str
    filename: str
    tag: str
    status: DocumentStatus
    created_at: datetime
    user_id: int
    chroma_ids: Optional[List[str]] = None

class DocumentCreate(BaseModel):
    id: str
    filename: str
    tag: str
    content_hash: str
    user_id: int
    chroma_ids: Optional[List[str]] = None

class Document(DocumentBase):
    class Config:
        from_attributes = True
        
class Message(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    sources: Optional[List[str]] = None
    class Config:
        from_attributes = True

class Conversation(BaseModel):
    id: str
    title: str
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class ConversationWithMessages(Conversation):
    messages: List[Message] = []
    
class AskRequest(BaseModel):
    question: str
    tag: str = "central"
    conversation_id: Optional[str] = None

class AskResponse(BaseModel):
    answer: str
    sources: List[str]
    conversation_id: str
    

# Just for the response when queuing a moodle task
class TaskQueueResponse(BaseModel):
    message: str
    task_id: str
