# Imports the main Celery class and the 'os' library for environment variables.
from celery import Celery
import os
from dotenv import load_dotenv
from celery.schedules import crontab

# This command loads all the variables from your .env file into the environment,
# making them accessible via os.getenv().
load_dotenv()

# This line reads the REDIS_URL from your .env file. If it can't find it,
# it uses a default value, which is the standard address for a local Redis server.
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# This is the most important line. It creates the Celery application instance.
celery_app = Celery(
    # "tasks" is the name of this Celery application.
    "tasks",
    
    # broker=REDIS_URL: This tells Celery to use your Redis server as the
    # message broker (the "job board") to send and receive task messages.
    broker=REDIS_URL,
    
    # backend=REDIS_URL: This tells Celery to also use Redis to store the
    # results and status of tasks. This is what allows you to check if a task
    # has succeeded or failed later on.
    backend=REDIS_URL,
    
    # include=["app.celery_worker"]: This is a crucial instruction. It tells Celery
    # to look inside the 'app/celery_worker.py' file to find any functions
    # that have been registered as tasks.
    include=["app.celery_worker"]
)

# This section contains optional, but good-to-have, configurations.
celery_app.conf.update(
    # These lines ensure that tasks and results are serialized using JSON,
    # which is a standard and safe format.
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # These lines configure Celery to work with UTC timezones to avoid
    # any confusion or bugs related to different timezones.
    timezone="UTC",
    enable_utc=True,
)

# Only schedule the extraction task
celery_app.conf.beat_schedule = {
    "extract-task-every-15-mins": {
        "task": "extract_all_users_data_task",  # only this task
        "schedule": crontab(minute="*/15"),
    },
}