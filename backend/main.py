from fastapi import FastAPI
from database import engine, Base
import models  # Import models to register all classes
from routers import products, customers

# Create all tables upon application startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Internal Sales Management API")

# Include routers
app.include_router(products.router)
app.include_router(customers.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}