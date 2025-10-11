from sqlalchemy import create_engine     # creates connection to database
from sqlalchemy.ext.declarative import declarative_base # for def database models(tables)
from sqlalchemy.orm import sessionmaker   #ensure that changes are commited or rolled back properly
import os
#DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tasks.db")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://taskuser:taskpass@db:5432/taskdb")
# Only sqlite needs check_same_thread
#connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
connect_args = {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
