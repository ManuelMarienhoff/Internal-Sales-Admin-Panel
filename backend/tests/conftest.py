"""
Test configuration and fixtures for the Internal Sales Management API.

This module provides pytest fixtures for:
1. Database transactions with automatic rollback (no data pollution)
2. AsyncClient for making HTTP requests to the FastAPI app
3. Test database session management
"""

import os
from typing import Generator

import pytest
from sqlalchemy import create_engine, event, Engine, Connection
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient

# Import the FastAPI app and database configuration
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from database import Base, get_db


# ============== DATABASE CONFIGURATION FOR TESTING ==============

# Use SQLite in-memory database for tests (or PostgreSQL if preferred)
# SQLite: Faster, no external dependencies
# PostgreSQL: Uncomment the DATABASE_URL_TEST line below if you prefer PostgreSQL
DATABASE_URL_TEST = "sqlite:///:memory:"
# DATABASE_URL_TEST = "postgresql://admin:admin123@localhost:5432/sales_management_test"

# For in-memory SQLite, use StaticPool to keep connections alive
engine = create_engine(
    DATABASE_URL_TEST,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL_TEST else {},
    poolclass=StaticPool if "sqlite" in DATABASE_URL_TEST else None,
    echo=False,  # Set to True for SQL debugging in tests
)


# ============== TRANSACTION ROLLBACK STRATEGY ==============
@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    Create a test database session with automatic transaction rollback.
    
    Strategy:
    - Creates a new database connection for each test
    - Begins a transaction before the test
    - Yields the session to the test
    - Rolls back all changes after the test completes
    
    Benefits:
    - No data pollution between tests
    - No need to recreate the database for each test
    - Tests run in isolation
    
    Yields:
        Session: SQLAlchemy session with automatic rollback
    """
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Create a connection and start a transaction
    connection = engine.connect()
    transaction = connection.begin()
    
    # Create a sessionmaker bound to the connection (not the engine)
    # This ensures all queries happen within the same transaction
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()
    
    yield session
    
    # Cleanup: Rollback the transaction (undo all changes)
    session.close()
    transaction.rollback()
    connection.close()


# ============== ASYNC CLIENT FIXTURE ==============
@pytest.fixture
async def client(db_session: Session) -> AsyncClient:
    """
    Create an AsyncClient for making HTTP requests to the FastAPI app.
    
    This fixture:
    1. Overrides the get_db dependency with our test db_session
    2. Creates an AsyncClient with the app
    3. Ensures the test database is used for all API requests
    
    Args:
        db_session: The test database session (from db_session fixture)
    
    Returns:
        AsyncClient: Async HTTP client for making requests to the app
    """
    
    def override_get_db() -> Generator[Session, None, None]:
        """Override the get_db dependency with the test session."""
        yield db_session
    
    # Override the dependency
    app.dependency_overrides[get_db] = override_get_db
    
    # Create AsyncClient
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    # Cleanup: Remove the override
    app.dependency_overrides.clear()


# ============== OPTIONAL: PYTEST ASYNCIO CONFIGURATION ==============
@pytest.fixture(scope="session")
def event_loop():
    """
    Provide an event loop for pytest-asyncio.
    
    This fixture ensures that async tests run properly.
    """
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============== OPTIONAL: UTILITY FIXTURES ==============
@pytest.fixture
def clean_db(db_session: Session) -> Session:
    """
    Alias for db_session. Use this if you prefer more explicit naming.
    
    Returns:
        Session: Clean database session for the test
    """
    return db_session
