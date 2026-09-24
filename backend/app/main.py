from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models

from .routers import (
    auth,
    tickets,
    admin,
    agent,
    comments,
    ratings,
    ai,
    customer
)


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="SupportAI",
    description="AI-Powered Support Ticket Management System",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://support-ai-2.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(admin.router)
app.include_router(agent.router)
app.include_router(comments.router)
app.include_router(ratings.router)
app.include_router(ai.router)
app.include_router(customer.router)


app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)


@app.get("/")
def home():
    return {
        "message": "Welcome to SupportAI API"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }
