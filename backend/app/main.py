from fastapi import FastAPI

from .database import engine, Base
from . import models
from .routes import router

app = FastAPI(title="Plate Scan & Case Matching Service")

Base.metadata.create_all(bind=engine)

app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "Plate Scan & Case Matching Service is running"
    }