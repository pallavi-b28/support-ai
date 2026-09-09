from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="customer", nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    tickets = relationship(
        "Ticket",
        back_populates="customer",
        foreign_keys="Ticket.customer_id"
    )

    assigned_tickets = relationship(
        "Ticket",
        back_populates="agent",
        foreign_keys="Ticket.agent_id"
    )

    comments = relationship(
        "Comment",
        back_populates="user"
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)

    category = Column(
        String(50),
        default="other"
    )

    priority = Column(
        String(20),
        default="medium"
    )

    status = Column(
        String(30),
        default="open"
    )

    image = Column(
        String(500),
        nullable=True
    )

    # AI fields
    ai_category = Column(
        String(50),
        nullable=True
    )

    ai_priority = Column(
        String(20),
        nullable=True
    )

    ai_response = Column(
        Text,
        nullable=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    agent_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    customer = relationship(
        "User",
        back_populates="tickets",
        foreign_keys=[customer_id]
    )

    agent = relationship(
        "User",
        back_populates="assigned_tickets",
        foreign_keys=[agent_id]
    )

    comments = relationship(
        "Comment",
        back_populates="ticket",
        cascade="all, delete-orphan"
    )

    rating = relationship(
        "Rating",
        back_populates="ticket",
        uselist=False,
        cascade="all, delete-orphan"
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)

    message = Column(
        Text,
        nullable=False
    )

    ticket_id = Column(
        Integer,
        ForeignKey("tickets.id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    ticket = relationship(
        "Ticket",
        back_populates="comments"
    )

    user = relationship(
        "User",
        back_populates="comments"
    )


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    rating = Column(
        Integer,
        nullable=False
    )

    feedback = Column(
        Text,
        nullable=True
    )

    ticket_id = Column(
        Integer,
        ForeignKey("tickets.id"),
        unique=True,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    ticket = relationship(
        "Ticket",
        back_populates="rating"
    )