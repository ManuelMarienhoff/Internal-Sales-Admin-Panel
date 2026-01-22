from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models  # Import models to register all classes
from routers import products, customers, orders

# Create all tables upon application startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Internal Sales Management API")

# ============== CORS CONFIGURATION ==============
# Allow requests from standard frontend development ports
allowed_origins = [
    "http://localhost:3000",      # React default port
    "http://localhost:5173",      # Vite default port
    "http://127.0.0.1:3000",      # React (localhost alias)
    "http://127.0.0.1:5173",      # Vite (localhost alias)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, PATCH, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}