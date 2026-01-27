import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models  # Import models to register all classes
from routers import products, customers, orders, dashboard

# Create all tables upon application startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Internal Sales Management API")

# ============== CORS CONFIGURATION ==============
# Parse comma-separated origins from environment; default to wildcard or localhost fallback
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
allowed_origins = [
    origin.strip()
    for origin in (allowed_origins_env.split(",") if allowed_origins_env else [])
    if origin.strip()
]

if not allowed_origins:
    # Wildcard avoids boot errors when env is missing; adjust credentials accordingly below
    allowed_origins = ["*"]

allow_credentials = "*" not in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, PATCH, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}