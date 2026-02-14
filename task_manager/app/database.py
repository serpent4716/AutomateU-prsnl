from sqlalchemy import create_engine, text  # creates connection to database
from sqlalchemy.ext.declarative import declarative_base  # for def database models(tables)
from sqlalchemy.orm import sessionmaker  # ensure changes are committed/rolled back properly
import os


def normalize_database_url(raw_url: str) -> str:
    """
    Render/Postgres URLs are often provided as postgres://...
    SQLAlchemy expects postgresql+psycopg2://... for this stack.
    """
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+psycopg2://", 1)
    if raw_url.startswith("postgresql://"):
        return raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return raw_url


APP_ENV = os.getenv("APP_ENV", "development").lower()
RAW_DATABASE_URL = os.getenv("DATABASE_URL")
if not RAW_DATABASE_URL:
    if APP_ENV == "production":
        raise RuntimeError("DATABASE_URL is not set for production.")
    RAW_DATABASE_URL = "postgresql+psycopg2://taskuser:taskpass@db:5432/taskdb"
DATABASE_URL = normalize_database_url(RAW_DATABASE_URL)

connect_args = {}
if DATABASE_URL.startswith("postgresql+psycopg2://"):
    connect_args = {"connect_timeout": 10}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_pgvector_extension() -> None:
    if not DATABASE_URL.startswith("postgresql+psycopg2://"):
        return
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    except Exception as e:
        # Don't crash service boot; emit a clear signal for deployment logs.
        print(f"Warning: could not enable pgvector extension: {e}")
