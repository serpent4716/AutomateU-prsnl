# We import the 'celery_app' instance we just created in the config file.
from .celery_config import celery_app

# We import your existing populate_database module, which contains all the
# heavy-lifting logic we want to run in the background.
from app.utils import populate_database as populate_db
from app.utils.tasks import fetch_and_store_moodle_tasks

from app import models
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
# We import the database URL so the worker knows how to connect to your main SQL database.
from dotenv import load_dotenv
load_dotenv()
import os

# --- Standalone DB Session for Background Task ---
# The background task runs in a separate context and needs its own DB connection.
engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_standalone_session():
    return SessionLocal()
# This is a "decorator". It's a special instruction that tells Celery:
# "The function directly below this line is a background task."
# name="process_document_task": This gives the task a unique name. This is how
# your FastAPI app will refer to this specific job.
@celery_app.task(name="process_document_task")
def process_document_task(doc_id: str, file_path: str, tag: str, user_id: str):
    """
    This is the Celery task that wraps your existing ingestion pipeline.
    It takes the same arguments as the original function.
    """
    # The worker prints this message to its own terminal when it picks up a job.
    print(f"CELERY WORKER: Received job for doc_id: {doc_id}")
    
    # The worker gets the database URL from your configuration.
    DATABASE_URL = os.getenv("DATABASE_URL")
    db_url = str(DATABASE_URL)
    
    # This is the key part: the worker calls the exact same robust, self-contained
    # function that you've already built and tested. We are reusing your
    # existing logic, not rewriting it. This function handles everything:
    # opening the file, OCR, cleaning, embedding, and updating the SQL database.
    populate_db.run_ingestion_pipeline(
        db_url=db_url,
        doc_id=doc_id,
        file_path=file_path,
        tag=tag,
        user_id=user_id
    )
    
    # The worker prints this message when the job is complete.
    print(f"CELERY WORKER: Finished job for doc_id: {doc_id}")
    
    
@celery_app.task(name="extract_data_task")
def extract_data_task(user_id: int):
    """Fetch Moodle tasks for a specific user."""

        
    new_tasks = fetch_and_store_moodle_tasks(user_id)
    
    return f"Inserted {len(new_tasks)} tasks for user {user_id}"
    


@celery_app.task(name="extract_all_users_data_task")
def extract_all_users_data_task():
    db = get_standalone_session()
    try:
        users = (
            db.query(models.User)
            .filter(models.User.moodle_account != None)
            .join(models.MoodleAccount)
            .filter(models.MoodleAccount.auto_sync == True)  # 👈 only auto_sync users
            .all()
        )
        for user in users:
            extract_data_task.delay(user.id)
        return f"Queued extraction for {len(users)} users"
    finally:
        db.close()