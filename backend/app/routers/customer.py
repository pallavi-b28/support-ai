from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, Ticket, Rating
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/customer",
    tags=["Customer"]
)


# =========================
# CUSTOMER DASHBOARD
# =========================

@router.get("/dashboard")
def customer_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only customers can access this dashboard
    if current_user.role != "customer":
        return {
            "message": "Customer dashboard is available only for customers"
        }

    # -------------------------
    # CUSTOMER TICKETS
    # -------------------------

    customer_tickets = db.query(Ticket).filter(
        Ticket.customer_id == current_user.id
    ).all()

    # -------------------------
    # TICKET COUNTS
    # -------------------------

    total_tickets = len(customer_tickets)

    open_tickets = sum(
        1 for ticket in customer_tickets
        if ticket.status == "open"
    )

    in_progress_tickets = sum(
        1 for ticket in customer_tickets
        if ticket.status == "in_progress"
    )

    resolved_tickets = sum(
        1 for ticket in customer_tickets
        if ticket.status == "resolved"
    )

    closed_tickets = sum(
        1 for ticket in customer_tickets
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
        Ticket.customer_id == current_user.id
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
        Ticket.customer_id == current_user.id
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
        Ticket.customer_id == current_user.id
    ).group_by(
        Ticket.category
    ).all()

    tickets_by_category = {
        category: count
        for category, count in category_results
    }

    # -------------------------
    # AI ANALYZED TICKETS
    # -------------------------

    ai_analyzed_tickets = db.query(Ticket).filter(
        Ticket.customer_id == current_user.id,
        Ticket.ai_category.isnot(None)
    ).count()

    # -------------------------
    # RATED TICKETS
    # -------------------------

    rated_tickets = db.query(Rating).join(
        Ticket,
        Rating.ticket_id == Ticket.id
    ).filter(
        Ticket.customer_id == current_user.id
    ).count()

    # -------------------------
    # RESPONSE
    # -------------------------

    return {
        "customer": {
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

        "rated_tickets": rated_tickets,

        "tickets_by_priority": tickets_by_priority,

        "tickets_by_category": tickets_by_category,

        "ai_analyzed_tickets": ai_analyzed_tickets
    }