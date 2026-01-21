from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# URL de conexión a PostgreSQL usando el nombre del servicio Docker
DATABASE_URL = "postgresql://admin:admin123@db:5432/sales_management"

# Crear el engine
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Mostrar las queries SQL (cambiar a False en producción)
    pool_pre_ping=True,  # Verificar conexiones antes de usarlas
)

# Crear el sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Función de inyección de dependencias para obtener la sesión de base de datos.
    
    Yields:
        Session: La sesión de SQLAlchemy
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
