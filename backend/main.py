from fastapi import FastAPI

app = FastAPI(title="Internal Sales Management API")

@app.get("/health")
def health_check():
    return {"status": "ok"}