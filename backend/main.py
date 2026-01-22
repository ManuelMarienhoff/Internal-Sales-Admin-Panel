from fastapi import FastAPI
from database import engine, Base
import models  # Importar models para que se registren todas las clases
from routers import products, customers

# Crear todas las tablas al iniciar la aplicación
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Internal Sales Management API")

# Incluir routers
app.include_router(products.router)
app.include_router(customers.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}