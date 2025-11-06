# request/response validation and serialization

from pydantic import BaseModel, EmailStr, field_validator, computed_field
from datetime import datetime, date , time
from typing import Optional, List, Dict, Any
# Import the enum from models
from app.models import DocumentStatus, GenerationStatus, DayOfWeek, AttendanceStatus, JobStatusEnum
from pydantic import BaseModel, ConfigDict  # <-- Import ConfigDict
from pydantic.alias_generators import to_camel
from typing import Optional, List
from datetime import datetime
from math import floor, ceil


# LOST and FOUND ITEM SCHEMAS
class LostAndFoundItemBase(BaseModel):
    title: str
    description: str
    status: str
    item_type: str
    location: Optional[str] = None
    reporter_name: str
    photo_path: Optional[str] = None
    

class LostAndFoundItemCreate(LostAndFoundItemBase):
    
    pass
class LostAndFoundItem(LostAndFoundItemBase):
    id: int
    user_id: int 
    reported_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class LostAndFoundItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    item_type: Optional[str] = None
    location: Optional[str] = None
    reporter_name: Optional[str] = None
    photo_path: Optional[str] = None
    resolved_at: Optional[datetime] = None


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
    timezone: Optional[str] = "UTC"
    language: Optional[str] = "en"

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
    is_verified: bool
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
        
class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str
    @field_validator("new_password")
    def validate_new_password(cls, value):
        if len(value) < 8:
            raise ValueError("New password must be at least 8 characters long")
        return value

class MessageResponse(BaseModel):
    msg: str

class LoginResponse(BaseModel):
    message: str
    csrf_token: str
    user: User

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
    filename: str
    tag: str
    content_type: Optional[str] = None

class DocumentCreate(BaseModel):
    id: str
    content_hash: str
    user_id: int

class Document(DocumentBase):
    id: str
    status: DocumentStatus
    created_at: datetime
    user_id: int # Changed to int as per your request
    chroma_ids: Optional[List[str]] = None

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




class QuizSettings(BaseModel):
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    max_questions: int = 20
    question_types: List[str]
    language: str = "English"
    hard_mode: bool = False

# Schema for sending a question TO the frontend (hides the answer)
class QuestionPublic(BaseModel):
    id: int
    question_text: str
    question_type: str
    options: Optional[Dict[str, str]] = None

    class Config:
        orm_mode = True

# Response schema after generating a new quiz
class QuizSessionPublic(BaseModel):
    id: int
    status: str
    questions: List[QuestionPublic] # A list of questions without answers

    class Config:
        orm_mode = True

# --- Schemas for Quiz History ---

class QuizSessionHistoryItem(BaseModel):
    id: int
    created_at: datetime
    status: str
    score: Optional[float] = None
    source_document_filename: Optional[str] = None

    class Config:
        orm_mode = True

    @classmethod
    def from_orm(cls, obj):
        filename = obj.source_document.filename if obj.source_document else "Pasted Content"
        return cls(
            id=obj.id,
            created_at=obj.created_at,
            status=obj.status.value, # Get the string value from Enum
            score=obj.score,
            source_document_filename=filename
        )

# --- Schemas for Quiz Submission & Results (NEW) ---

class UserAnswer(BaseModel):
    """A single answer from the user."""
    question_id: int
    selected_answer: str # The string of the answer the user chose

class QuizSubmission(BaseModel):
    """The complete submission from the frontend."""
    session_id: int
    answers: List[UserAnswer]

class QuestionResult(BaseModel):
    """The result for a single graded question."""
    question_text: str
    your_answer: str
    correct_answer: str
    is_correct: bool

class QuizResult(BaseModel):
    """The final results object sent back to the frontend."""
    id: int
    score: float
    results: List[QuestionResult]

class BasicDetails(BaseModel):
    Name: str
    UID: str
    Class_and_Batch: str
    Experiment_No: str
    Date: str
    Aim: str
    
    class Config:
        from_attributes = True

class DocumentGenerationRequest(BaseModel):
    basicDetails: BasicDetails
    selectedSections: List[str]
    problemStatementCount: str # 'single' or 'multiple'

class DocumentTaskResponse(BaseModel):
    task_id: str
    status: GenerationStatus

class DocumentTaskStatus(BaseModel):
    task_id: str
    status: GenerationStatus
    error: Optional[str] = None

class SummarizeRequest(BaseModel):
    text: str
    length: str = "medium"  

class SummarizeResponse(BaseModel):
    summary: str

# --- Schedules and Attendance Schemas ------------------------------------------------------------------------------
class StatJobStatus(BaseModel):
    """
    This is what your polling endpoint will return.
    It shows the status of a background job.
    """
    id: int # The Job ID
    status: JobStatusEnum
    error_message: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ScheduleBase(BaseModel):
    day: DayOfWeek
    time: time

class ScheduleCreate(ScheduleBase):
    pass

class Schedule(ScheduleBase):
    id: int
    subject_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Schemas for AttendanceRecord ---
class AttendanceRecordBase(BaseModel):
    status: AttendanceStatus

class AttendanceRecordCreate(AttendanceRecordBase):
    pass

class AttendanceRecord(AttendanceRecordBase):
    id: int
    class_instance_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Schemas for ClassInstance ---
class ClassInstanceCreate(BaseModel):
    subject_id: int
    date: date
    time: time

class SubjectSimple(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    color: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ClassInstance(BaseModel):
    id: int
    date: date
    time: time
    subject: SubjectSimple
    attendance_record: Optional[AttendanceRecord] = None
    model_config = ConfigDict(from_attributes=True)


# --- Schemas for Subject ---
class SubjectCreate(BaseModel):
    name: str
    code: Optional[str] = None
    color: Optional[str] = None
    schedules: List[ScheduleCreate] = []

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    color: Optional[str] = None
    schedules: Optional[List[ScheduleCreate]] = None

class Subject(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    color: Optional[str] = None
    user_id: int
    total_classes_held: int
    total_classes_attended: int
    schedules: List[Schedule] = []
    created_at: datetime # We *show* this in the response
    model_config = ConfigDict(from_attributes=True)

    # --- Computed Fields for Frontend ---
    
    @computed_field
    @property
    def attendance_percentage(self) -> float:
        if self.total_classes_held == 0:
            return 0.0
        return (self.total_classes_attended / self.total_classes_held) * 100

    @computed_field
    @property
    def bunkable_classes_for_75(self) -> int:
        percentage = self.attendance_percentage
        if percentage < 75: return 0
        if self.total_classes_attended == 0: return 0
        bunks = floor((self.total_classes_attended / 0.75) - self.total_classes_held)
        return max(0, bunks)
    
    # Logic: We solve for 'x' (classes to bunk) in the equation:
        # attended / (held + x) = 0.75
        # attended = 0.75 * held + 0.75 * x
        # (attended - 0.75 * held) / 0.75 = x
        # x = (attended / 0.75) - held

    @computed_field
    @property
    def classes_needed_for_75(self) -> int:
        percentage = self.attendance_percentage
        if percentage >= 75: return 0
        if self.total_classes_held == self.total_classes_attended: return 0
        needed = ceil((0.75 * self.total_classes_held - self.total_classes_attended) / 0.25)
        return max(0, needed)
    # Logic: We solve for 'x' (classes to attend) in the equation:
        # (attended + x) / (held + x) = 0.75
        # attended + x = 0.75 * held + 0.75 * x
        # 0.25 * x = 0.75 * held - attended
        # x = (0.75 * held - attended) / 0.25
        # x = 3 * held - 4 * attended

# --- THESE ARE THE RESPONSE SCHEMAS FOR YOUR API ---
# They include the 'job' object so your frontend
# gets the job_id to start polling.

class CreateClassInstanceResponse(BaseModel):
    class_instance: ClassInstance
    job: StatJobStatus

class MarkAttendanceResponse(BaseModel):
    record: AttendanceRecord
    job: StatJobStatus

class CalendarDay(BaseModel):
    """
    Represents the "summary" status for a single day
    in the monthly calendar view.
    """
    date: date
    status: AttendanceStatus
    model_config = ConfigDict(from_attributes=True)


class DayOfWeekStats(BaseModel):
    """
    Data point for the "Attendance by Day" bar chart.
    """
    day: str  # e.g., "Mon", "Tue"
    percentage: float


class WeeklyTrendPoint(BaseModel):
    """
    Data point for the "Weekly Trend" line chart.
    """
    week_start_date: date
    week_label: str  # e.g., "10-20"
    percentage: float


class AnalyticsInsights(BaseModel):
    """
    The complete response model for the analytics-insights endpoint.
    """
    attendance_by_day: List[DayOfWeekStats]
    weekly_trend: List[WeeklyTrendPoint]
