from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, Ticket, Rating
from ..schemas import AgentCreate, UserResponse
from ..auth import hash_password
from ..dependencies import require_admin


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# =========================
# CREATE AGENT
# =========================

@router.post("/agents", response_model=UserResponse)
def create_agent(
    agent_data: AgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing_user = db.query(User).filter(
        User.email == agent_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_agent = User(
        name=agent_data.name,
        email=agent_data.email,
        password=hash_password(agent_data.password),
        role="agent"
    )

    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)

    return new_agent


# =========================
# GET ALL USERS
# =========================

@router.get("/users", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return db.query(User).order_by(
        User.created_at.desc()
    ).all()


# =========================
# ASSIGN TICKET TO AGENT
# =========================

@router.put("/tickets/{ticket_id}/assign")
def assign_ticket(
    ticket_id: int,
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    agent = db.query(User).filter(
        User.id == agent_id
    ).first()

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found"
        )

    if agent.role != "agent":
        raise HTTPException(
            status_code=400,
            detail="Selected user is not an agent"
        )

    ticket.agent_id = agent.id

    db.commit()
    db.refresh(ticket)

    return {
        "message": "Ticket assigned successfully",
        "ticket_id": ticket.id,
        "agent_id": agent.id,
        "agent_name": agent.name
    }


# =========================
# ADMIN DASHBOARD
# =========================

@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # -------------------------
    # USER STATISTICS
    # -------------------------

    total_users = db.query(User).count()

    total_customers = db.query(User).filter(
        User.role == "customer"
    ).count()

    total_agents = db.query(User).filter(
        User.role == "agent"
    ).count()

    # -------------------------
    # TICKET STATISTICS
    # -------------------------

    total_tickets = db.query(Ticket).count()

    open_tickets = db.query(Ticket).filter(
        Ticket.status == "open"
    ).count()

    in_progress_tickets = db.query(Ticket).filter(
        Ticket.status == "in_progress"
    ).count()

    resolved_tickets = db.query(Ticket).filter(
        Ticket.status == "resolved"
    ).count()

    closed_tickets = db.query(Ticket).filter(
        Ticket.status == "closed"
    ).count()

    # -------------------------
    # RATING STATISTICS
    # -------------------------

    average_rating = db.query(
        func.avg(Rating.rating)
    ).scalar()

    if average_rating is not None:
        average_rating = round(
            float(average_rating),
            2
        )

    # -------------------------
    # TICKETS BY CATEGORY
    # -------------------------

    category_results = db.query(
        Ticket.category,
        func.count(Ticket.id)
    ).group_by(
        Ticket.category
    ).all()

    tickets_by_category = {
        category: count
        for category, count in category_results
    }

    # -------------------------
    # TICKETS BY PRIORITY
    # -------------------------

    priority_results = db.query(
        Ticket.priority,
        func.count(Ticket.id)
    ).group_by(
        Ticket.priority
    ).all()

    tickets_by_priority = {
        priority: count
        for priority, count in priority_results
    }

    # -------------------------
    # AI CATEGORY STATISTICS
    # -------------------------

    ai_category_results = db.query(
        Ticket.ai_category,
        func.count(Ticket.id)
    ).filter(
        Ticket.ai_category.isnot(None)
    ).group_by(
        Ticket.ai_category
    ).all()

    ai_tickets_by_category = {
        category: count
        for category, count in ai_category_results
    }

    # -------------------------
    # AI PRIORITY STATISTICS
    # -------------------------

    ai_priority_results = db.query(
        Ticket.ai_priority,
        func.count(Ticket.id)
    ).filter(
        Ticket.ai_priority.isnot(None)
    ).group_by(
        Ticket.ai_priority
    ).all()

    ai_tickets_by_priority = {
        priority: count
        for priority, count in ai_priority_results
    }

    # -------------------------
    # FINAL RESPONSE
    # -------------------------

    return {
        "users": {
            "total": total_users,
            "customers": total_customers,
            "agents": total_agents
        },

        "tickets": {
            "total": total_tickets,
            "open": open_tickets,
            "in_progress": in_progress_tickets,
            "resolved": resolved_tickets,
            "closed": closed_tickets
        },

        "ratings": {
            "average": average_rating
        },

        "tickets_by_category": tickets_by_category,

        "tickets_by_priority": tickets_by_priority,

        "ai_tickets_by_category": ai_tickets_by_category,

        "ai_tickets_by_priority": ai_tickets_by_priority
    }