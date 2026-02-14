# We import the 'celery_app' instance we just created in the config file.
from .celery_config import celery_app

# We import your existing populate_database module, which contains all the
# heavy-lifting logic we want to run in the background.
from app.utils.tasks import fetch_and_store_moodle_tasks
from app import models
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import func, case
from app.utils.basic_1 import run_full_generation_process
from sqlalchemy.orm import aliased
from app.database import DATABASE_URL
import app.storage as storage
# We import the database URL so the worker knows how to connect to your main SQL database.
from dotenv import load_dotenv
load_dotenv()
import os
import importlib

API_ONLY_RAG = os.getenv("API_ONLY_RAG", "false").lower() == "true"
USE_PGVECTOR_RAG = os.getenv("USE_PGVECTOR_RAG", "true").lower() == "true"

# --- Standalone DB Session for Background Task ---
# The background task runs in a separate context and needs its own DB connection.
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_standalone_session():
    return SessionLocal()
# This is a "decorator". It's a special instruction that tells Celery:
# "The function directly below this line is a background task."
# name="process_document_task": This gives the task a unique name. This is how
# your FastAPI app will refer to this specific job.
@celery_app.task(name="process_document_task")
def process_document_task(
    doc_id: str,
    file_path: str | None,
    tag: str,
    user_id: str,
    s3_key: str | None = None,
    source_filename: str | None = None,
):
    """
    This is the Celery task that wraps your existing ingestion pipeline.
    It takes the same arguments as the original function.
    """
    # The worker prints this message to its own terminal when it picks up a job.
    print(f"CELERY WORKER: Received job for doc_id: {doc_id}")
    
    # The worker gets the database URL from your configuration.
    db_url = str(DATABASE_URL)
    
    # This is the key part: the worker calls the exact same robust, self-contained
    # function that you've already built and tested. We are reusing your
    # existing logic, not rewriting it. This function handles everything:
    # opening the file, OCR, cleaning, embedding, and updating the SQL database.
    local_path = file_path
    db = get_standalone_session()
    try:
        if s3_key:
            hint = f"{doc_id}_{source_filename}" if source_filename else f"{doc_id}_document.bin"
            local_path = storage.download_to_temp(s3_key, filename_hint=hint)

        if USE_PGVECTOR_RAG:
            pgvector_rag = importlib.import_module("app.utils.pgvector_rag")
            chunk_count = pgvector_rag.ingest_document_chunks(
                db=db,
                doc_id=doc_id,
                file_path=local_path,
                tag=tag,
                user_id=user_id,
                source_filename=source_filename,
            )
            db.query(models.Document).filter(models.Document.id == doc_id).update(
                {"status": models.DocumentStatus.COMPLETED, "chroma_ids": [f"pgvector_chunks:{chunk_count}"]}
            )
            db.commit()
        elif API_ONLY_RAG:
            # API-only mode without pgvector: no local ingestion.
            db.query(models.Document).filter(models.Document.id == doc_id).update(
                {"status": models.DocumentStatus.COMPLETED, "chroma_ids": []}
            )
            db.commit()
        else:
            populate_db = importlib.import_module("app.utils.populate_database")
            populate_db.run_ingestion_pipeline(
                db_url=db_url,
                doc_id=doc_id,
                file_path=local_path,
                tag=tag,
                user_id=user_id
            )
    except Exception as e:
        print(f"CELERY WORKER ERROR (doc_id={doc_id}): {e}")
        try:
            db.query(models.Document).filter(models.Document.id == doc_id).update(
                {"status": models.DocumentStatus.FAILED}
            )
            db.commit()
        except Exception as db_err:
            print(f"CELERY WORKER ERROR updating failed status (doc_id={doc_id}): {db_err}")
            db.rollback()
        raise
    finally:
        db.close()
        if s3_key and local_path and os.path.exists(local_path):
            try:
                os.remove(local_path)
            except OSError:
                pass
    
    # The worker prints this message when the job is complete.
    print(f"CELERY WORKER: Finished job for doc_id: {doc_id}")
    
@celery_app.task(name="process_quiz_document")
def process_quiz_document(
    doc_id: str,
    file_path: str | None,
    tag: str,
    user_id: str,
    s3_key: str | None = None,
    source_filename: str | None = None,
):
    """
    This is the Celery task that wraps your existing ingestion pipeline.
    It takes the same arguments as the original function.
    """

    print(f"CELERY WORKER: Received job for Quiz doc_id: {doc_id}")
    
    db_url = str(DATABASE_URL)
    
    local_path = file_path
    db = get_standalone_session()
    try:
        if s3_key:
            hint = f"{doc_id}_{source_filename}" if source_filename else f"{doc_id}_document.bin"
            local_path = storage.download_to_temp(s3_key, filename_hint=hint)

        if USE_PGVECTOR_RAG:
            pgvector_rag = importlib.import_module("app.utils.pgvector_rag")
            chunk_count = pgvector_rag.ingest_document_chunks(
                db=db,
                doc_id=doc_id,
                file_path=local_path,
                tag=tag,
                user_id=user_id,
                source_filename=source_filename,
            )
            db.query(models.Document).filter(models.Document.id == doc_id).update(
                {"status": models.DocumentStatus.COMPLETED, "chroma_ids": [f"pgvector_chunks:{chunk_count}"]}
            )
            db.commit()
        elif API_ONLY_RAG:
            # API-only mode without pgvector: no local quiz ingestion.
            db.query(models.Document).filter(models.Document.id == doc_id).update(
                {"status": models.DocumentStatus.COMPLETED, "chroma_ids": []}
            )
            db.commit()
        else:
            quiz = importlib.import_module("app.utils.quiz")
            quiz.run_quiz_ingestion_pipeline(
                db_url=db_url,
                doc_id=doc_id,
                file_path=local_path,
                tag=tag,
                user_id=user_id
            )
    except Exception as e:
        print(f"CELERY WORKER ERROR (quiz doc_id={doc_id}): {e}")
        try:
            db.query(models.Document).filter(models.Document.id == doc_id).update(
                {"status": models.DocumentStatus.FAILED}
            )
            db.commit()
        except Exception as db_err:
            print(f"CELERY WORKER ERROR updating failed quiz status (doc_id={doc_id}): {db_err}")
            db.rollback()
        raise
    finally:
        db.close()
        if s3_key and local_path and os.path.exists(local_path):
            try:
                os.remove(local_path)
            except OSError:
                pass
    
    print(f"CELERY WORKER: Finished job for Quiz doc_id: {doc_id}")

    
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

@celery_app.task(name="generate_document_task")
def generate_document_task(output_file_path: str, task_id: str, user_id: int, payload_dict: dict):
    """
    Celery worker task.
    This is now a "thin controller." It finds the existing DB record,
    updates its status, calls the business logic, and updates the final status.
    """
    db= get_standalone_session()
    
    db_doc = None
    try:
        # 1. Find the DB record (created by the router)
        print(f"[Task {task_id}] Worker started. Finding DB record...")
        db_doc = db.query(models.GeneratedDocument).filter(
            models.GeneratedDocument.id == task_id,
            models.GeneratedDocument.user_id == user_id
        ).first()

        if not db_doc:
            raise Exception(f"Task record {task_id} not found in database.")

        # 2. Update status to PROCESSING
        db_doc.status = models.GenerationStatus.PROCESSING
        db.commit()
        
        # 3. Call the main logic function
        # This is the *only* business logic call
        print(f"[Task {task_id}] Calling doc_generator.run_full_generation_process...")
        final_path = run_full_generation_process(output_file_path, payload_dict, task_id)

        # 4. Update DB with success
        print(f"[Task {task_id}] Generation successful. Updating DB status to COMPLETED.")
        db_doc.status = models.GenerationStatus.COMPLETED
        db_doc.generated_content = final_path # Store the *actual* final path
        db.commit()
        
        return {"status": "completed", "task_id": task_id}

    except Exception as e:
        # 5. Update DB with failure
        print(f"[Task {task_id}] Worker failed: {e}")
        
        if db_doc: # If the record was found/created
            print(f"[Task {task_id}] Updating DB status to FAILED.")
            db_doc.status = models.GenerationStatus.FAILED
            db_doc.error_message = str(e)
            db.commit()
        else:
            # Failsafe, in case DB find failed
            print(f"[Task {task_id}] Could not find DB record to update with failure.")
        
        return {"status": "failed", "error": str(e)}
    
    finally:
        if db:
            db.close()

@celery_app.task(name="update_subject_stats")
def update_subject_stats(subject_id: int, job_id: str):
    """
    A Celery task to recalculate stats.
    
    --- UPGRADED LOGIC ---
    - total_classes_held: Now EXCLUDES cancelled classes.
    - total_classes_attended: Only counts 'present' classes.
    """
    db = get_standalone_session()
    
    job = db.query(models.SubjectStatJob).filter(models.SubjectStatJob.id == job_id).first()
    if not job:
        print(f"FATAL: SubjectStatJob {job_id} not found.")
        return

    job.status = models.JobStatusEnum.RUNNING
    db.commit()
    
    try:
        subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
        if not subject:
            raise Exception(f"Subject {subject_id} not found.")

        # --- UPGRADED STATS LOGIC ---
        
        # Alias for the optional relationship
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

        stats = (
            db.query(
                func.sum(held_case).label("total_held"),
                func.sum(attended_case).label("total_attended")
            )
            .select_from(models.ClassInstance) # Start from ClassInstance
            .outerjoin(AR, models.ClassInstance.attendance_record) # Use the alias
            .filter(models.ClassInstance.subject_id == subject_id)
        ).one()
        
        # --- END OF UPGRADED STATS LOGIC ---

        subject.total_classes_held = stats.total_held
        subject.total_classes_attended = stats.total_attended
        
        job.status = models.JobStatusEnum.SUCCESS
        db.commit()
        
        print(f"CELERY TASK SUCCESS (Job ID: {job_id}): Stats updated for Subject {subject_id}")
        return f"Stats updated for Subject {subject_id}: Held={stats.total_held}, Attended={stats.total_attended}"

    except Exception as e:
        print(f"!!!!!!!!!!!!!!! CELERY JOB FAILED (Job ID: {job_id}) !!!!!!!!!!!!!!!")
        # ... (rest of your error handling)
        db.rollback()
        job.status = models.JobStatusEnum.FAILURE
        job.error_message = str(e)
        db.commit()
        return f"Error updating stats for Subject {subject_id}: {e}"
    finally:
        db.close()
