import os
import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Ticket
from ..schemas import TicketCreate, TicketResponse
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


# CREATE TICKET
@router.post("/", response_model=TicketResponse)
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can create tickets"
        )

    new_ticket = Ticket(
        title=ticket_data.title,
        description=ticket_data.description,
        category=ticket_data.category,
        priority=ticket_data.priority,
        status="open",
        customer_id=current_user.id
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return new_ticket


# GET MY TICKETS
@router.get("/my", response_model=list[TicketResponse])
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tickets = db.query(Ticket).filter(
        Ticket.customer_id == current_user.id
    ).order_by(
        Ticket.created_at.desc()
    ).all()

    return tickets


# GET ALL TICKETS
@router.get("/", response_model=list[TicketResponse])
def get_all_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "customer":
        tickets = db.query(Ticket).filter(
            Ticket.customer_id == current_user.id
        ).order_by(
            Ticket.created_at.desc()
        ).all()

        return tickets

    if current_user.role in ["agent", "admin"]:
        tickets = db.query(Ticket).order_by(
            Ticket.created_at.desc()
        ).all()

        return tickets

    raise HTTPException(
        status_code=403,
        detail="Access denied"
    )


# GET SINGLE TICKET
@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
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

    if current_user.role == "customer":
        if ticket.customer_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this ticket"
            )

    return ticket


# UPDATE TICKET STATUS
@router.put("/{ticket_id}/status", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["agent", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only agents and admins can update ticket status"
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
            detail=f"Status must be one of: {', '.join(allowed_statuses)}"
        )

    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    ticket.status = status

    db.commit()
    db.refresh(ticket)

    return ticket


# UPLOAD TICKET IMAGE
@router.post("/{ticket_id}/image", response_model=TicketResponse)
async def upload_ticket_image(
    ticket_id: int,
    image: UploadFile = File(...),
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

    # Check access
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

    # Check file type
    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp"
    ]

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG, PNG and WEBP images are allowed"
        )

    # Create uploads directory
    os.makedirs("uploads", exist_ok=True)

    # Generate unique filename
    extension = os.path.splitext(
        image.filename
    )[1]

    filename = f"{uuid.uuid4()}{extension}"

    file_path = os.path.join(
        "uploads",
        filename
    )

    # Save image
    with open(file_path, "wb") as buffer:
        buffer.write(await image.read())

    # Save path in database
    ticket.image = f"/uploads/{filename}"

    db.commit()
    db.refresh(ticket)

    return ticket