import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from typing import Generator

# ============== ORM BASE CONFIGURATION ==============
Base = declarative_base()

# ============== DATABASE CONFIGURATION ==============
# 1. Try to get the DB URL from the environment (Render/Production)
# 2. If not found, fall back to the local Docker URL (Development)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:admin123@db:5432/sales_management")

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=False,      # Set to False in production to reduce log noise
    pool_pre_ping=True,  # Verify connections before using them to prevent stale connection errors
)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency injection function to get the database session.
    
    Yields:
        Session: The SQLAlchemy session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()