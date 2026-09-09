from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# =========================
# USER SCHEMAS
# =========================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# AGENT SCHEMAS
# =========================

class AgentCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


# =========================
# TICKET SCHEMAS
# =========================

class TicketCreate(BaseModel):
    title: str
    description: str
    category: Optional[str] = "other"
    priority: Optional[str] = "medium"


class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    image: Optional[str]

    customer_id: int
    agent_id: Optional[int]

    # AI analysis fields
    ai_category: Optional[str] = None
    ai_priority: Optional[str] = None
    ai_response: Optional[str] = None

    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# COMMENT SCHEMAS
# =========================

class CommentCreate(BaseModel):
    message: str


class CommentResponse(BaseModel):
    id: int
    message: str
    ticket_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# RATING SCHEMAS
# =========================

class RatingCreate(BaseModel):
    rating: int
    feedback: Optional[str] = None