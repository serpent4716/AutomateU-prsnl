from sqlalchemy import create_engine  # creates connection to database
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


RAW_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://taskuser:taskpass@db:5432/taskdb")
DATABASE_URL = normalize_database_url(RAW_DATABASE_URL)

engine = create_engine(DATABASE_URL, connect_args={}, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
