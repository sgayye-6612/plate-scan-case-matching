from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from . import models
from .routes import router


app = FastAPI(
    title="Plate Scan & Case Matching Service"
)


# Create database tables
Base.metadata.create_all(bind=engine)


# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API routes
app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "Plate Scan & Case Matching Service is running"
    }