from fastapi import FastAPI
from database import engine
from models import Base

# Crear todas las tablas al iniciar la aplicación
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Internal Sales Management API")

@app.get("/health")
def health_check():
    return {"status": "ok"}