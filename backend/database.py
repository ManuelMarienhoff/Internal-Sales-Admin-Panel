from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from typing import Generator

# ============== ORM BASE CONFIGURATION ==============
Base = declarative_base()

# ============== DATABASE CONFIGURATION ==============
# PostgreSQL connection URL using Docker service name
DATABASE_URL = "postgresql://admin:admin123@db:5432/sales_management"
# TODO: Move sensitive credentials to environment variables (.env file) before production

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Show SQL queries (change to False in production)
    pool_pre_ping=True,  # Verify connections before using them
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