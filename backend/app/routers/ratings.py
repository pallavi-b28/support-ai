from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Ticket, Rating
from ..schemas import RatingCreate
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/tickets",
    tags=["Ratings"]
)


# ADD RATING
@router.post("/{ticket_id}/rating")
def add_rating(
    ticket_id: int,
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Only the customer who owns the ticket can rate it
    if ticket.customer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the ticket owner can submit a rating"
        )

    # Ticket must be resolved or closed
    if ticket.status not in ["resolved", "closed"]:
        raise HTTPException(
            status_code=400,
            detail="You can rate the ticket only after it is resolved"
        )

    # Rating must be between 1 and 5
    if rating_data.rating < 1 or rating_data.rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5"
        )

    # Prevent duplicate rating
    existing_rating = db.query(Rating).filter(
        Rating.ticket_id == ticket_id
    ).first()

    if existing_rating:
        raise HTTPException(
            status_code=400,
            detail="This ticket has already been rated"
        )

    new_rating = Rating(
        rating=rating_data.rating,
        feedback=rating_data.feedback,
        ticket_id=ticket.id
    )

    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)

    return {
        "message": "Rating submitted successfully",
        "rating": new_rating.rating,
        "feedback": new_rating.feedback,
        "ticket_id": new_rating.ticket_id
    }


# GET TICKET RATING
@router.get("/{ticket_id}/rating")
def get_rating(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Customer can see their own ticket rating
    # Agent can see rating for assigned ticket
    # Admin can see all ratings
    if current_user.role == "customer":
        if ticket.customer_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this ticket"
            )

    elif current_user.role == "agent":
        if ticket.agent_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="This ticket is not assigned to you"
            )

    rating = db.query(Rating).filter(
        Rating.ticket_id == ticket_id
    ).first()

    if not rating:
        raise HTTPException(
            status_code=404,
            detail="No rating found for this ticket"
        )

    return {
        "ticket_id": ticket.id,
        "rating": rating.rating,
        "feedback": rating.feedback,
        "created_at": rating.created_at
    }