from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, Ticket, Rating
from ..schemas import TicketResponse
from ..dependencies import require_agent


router = APIRouter(
    prefix="/agent",
    tags=["Agent"]
)


# =========================
# GET ASSIGNED TICKETS
# =========================

@router.get(
    "/tickets",
    response_model=list[TicketResponse]
)
def get_assigned_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent)
):
    tickets = db.query(Ticket).filter(
        Ticket.agent_id == current_user.id
    ).order_by(
        Ticket.created_at.desc()
    ).all()

    return tickets


# =========================
# GET SPECIFIC ASSIGNED TICKET
# =========================

@router.get(
    "/tickets/{ticket_id}",
    response_model=TicketResponse
)
def get_assigned_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent)
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    if (
        current_user.role == "agent"
        and ticket.agent_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="This ticket is not assigned to you"
        )

    return ticket


# =========================
# UPDATE ASSIGNED TICKET STATUS
# =========================

@router.put(
    "/tickets/{ticket_id}/status",
    response_model=TicketResponse
)
def update_assigned_ticket_status(
    ticket_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent)
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    if (
        current_user.role == "agent"
        and ticket.agent_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="This ticket is not assigned to you"
        )

    allowed_statuses = [
        "open",
        "in_progress",
        "resolved",
        "closed"
    ]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Status must be one of: "
                + ", ".join(allowed_statuses)
            )
        )

    ticket.status = status

    db.commit()
    db.refresh(ticket)

    return ticket


# =========================
# AGENT DASHBOARD
# =========================

@router.get("/dashboard")
def agent_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent)
):
    # -------------------------
    # GET AGENT TICKETS
    # -------------------------

    agent_tickets = db.query(Ticket).filter(
        Ticket.agent_id == current_user.id
    ).all()

    # -------------------------
    # TICKET COUNTS
    # -------------------------

    total_tickets = len(agent_tickets)

    open_tickets = sum(
        1 for ticket in agent_tickets
        if ticket.status == "open"
    )

    in_progress_tickets = sum(
        1 for ticket in agent_tickets
        if ticket.status == "in_progress"
    )

    resolved_tickets = sum(
        1 for ticket in agent_tickets
        if ticket.status == "resolved"
    )

    closed_tickets = sum(
        1 for ticket in agent_tickets
        if ticket.status == "closed"
    )

    # -------------------------
    # AVERAGE RATING
    # -------------------------

    average_rating = db.query(
        func.avg(Rating.rating)
    ).join(
        Ticket,
        Rating.ticket_id == Ticket.id
    ).filter(
        Ticket.agent_id == current_user.id
    ).scalar()

    if average_rating is not None:
        average_rating = round(
            float(average_rating),
            2
        )

    # -------------------------
    # TICKETS BY PRIORITY
    # -------------------------

    priority_results = db.query(
        Ticket.priority,
        func.count(Ticket.id)
    ).filter(
        Ticket.agent_id == current_user.id
    ).group_by(
        Ticket.priority
    ).all()

    tickets_by_priority = {
        priority: count
        for priority, count in priority_results
    }

    # -------------------------
    # TICKETS BY CATEGORY
    # -------------------------

    category_results = db.query(
        Ticket.category,
        func.count(Ticket.id)
    ).filter(
        Ticket.agent_id == current_user.id
    ).group_by(
        Ticket.category
    ).all()

    tickets_by_category = {
        category: count
        for category, count in category_results
    }

    # -------------------------
    # AI ANALYSIS COUNT
    # -------------------------

    ai_analyzed_tickets = db.query(Ticket).filter(
        Ticket.agent_id == current_user.id,
        Ticket.ai_category.isnot(None)
    ).count()

    # -------------------------
    # RESPONSE
    # -------------------------

    return {
        "agent": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email
        },

        "tickets": {
            "total": total_tickets,
            "open": open_tickets,
            "in_progress": in_progress_tickets,
            "resolved": resolved_tickets,
            "closed": closed_tickets
        },

        "average_rating": average_rating,

        "tickets_by_priority": tickets_by_priority,

        "tickets_by_category": tickets_by_category,

        "ai_analyzed_tickets": ai_analyzed_tickets
    }