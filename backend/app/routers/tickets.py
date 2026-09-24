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


# ==========================================
# CREATE TICKET
# ==========================================

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


# ==========================================
# GET MY TICKETS
# ==========================================

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


# ==========================================
# GET ALL TICKETS
# ==========================================

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


# ==========================================
# GET SINGLE TICKET
# ==========================================

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

    # Customer can access only their own tickets
    if current_user.role == "customer":

        if ticket.customer_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this ticket"
            )

    # Agent can access only assigned tickets
    elif current_user.role == "agent":

        if ticket.agent_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="This ticket is not assigned to you"
            )

    return ticket


# ==========================================
# UPDATE TICKET
# ==========================================

@router.put(
    "/{ticket_id}",
    response_model=TicketResponse
)
def update_ticket(
    ticket_id: int,
    ticket_data: TicketCreate,
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

    # ======================================
    # CUSTOMER PERMISSIONS
    # ======================================

    if current_user.role == "customer":

        if ticket.customer_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own tickets"
            )

        if ticket.status in [
            "resolved",
            "closed"
        ]:
            raise HTTPException(
                status_code=400,
                detail="Resolved or closed tickets cannot be edited"
            )

    # ======================================
    # AGENT PERMISSIONS
    # ======================================

    elif current_user.role == "agent":

        if ticket.agent_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="This ticket is not assigned to you"
            )

    # ======================================
    # ADMIN PERMISSIONS
    # ======================================

    elif current_user.role == "admin":

        pass

    # ======================================
    # INVALID ROLE
    # ======================================

    else:

        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    # ======================================
    # UPDATE FIELDS
    # ======================================

    ticket.title = ticket_data.title
    ticket.description = ticket_data.description
    ticket.category = ticket_data.category
    ticket.priority = ticket_data.priority

    db.commit()
    db.refresh(ticket)

    return ticket


# ==========================================
# UPDATE TICKET STATUS
# ==========================================

@router.put(
    "/{ticket_id}/status",
    response_model=TicketResponse
)
def update_ticket_status(
    ticket_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [
        "agent",
        "admin"
    ]:
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
            detail=(
                "Status must be one of: "
                f"{', '.join(allowed_statuses)}"
            )
        )

    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Agents can update only assigned tickets
    if (
        current_user.role == "agent"
        and ticket.agent_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="This ticket is not assigned to you"
        )

    ticket.status = status

    db.commit()
    db.refresh(ticket)

    return ticket


# ==========================================
# DELETE TICKET
# ==========================================

@router.delete("/{ticket_id}")
def delete_ticket(
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

    # ======================================
    # CUSTOMER DELETE
    # ======================================

    if current_user.role == "customer":

        if ticket.customer_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only delete your own tickets"
            )

        if ticket.status != "open":
            raise HTTPException(
                status_code=400,
                detail="Only open tickets can be deleted"
            )

    # ======================================
    # AGENT DELETE
    # ======================================

    elif current_user.role == "agent":

        raise HTTPException(
            status_code=403,
            detail="Agents cannot delete tickets"
        )

    # ======================================
    # ADMIN DELETE
    # ======================================

    elif current_user.role == "admin":

        pass

    # ======================================
    # INVALID ROLE
    # ======================================

    else:

        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    # ======================================
    # DELETE UPLOADED IMAGE
    # ======================================

    if ticket.image:

        image_path = ticket.image.lstrip("/")

        if os.path.exists(image_path):

            try:
                os.remove(image_path)
            except OSError:
                pass

    # ======================================
    # DELETE TICKET
    # ======================================

    db.delete(ticket)

    db.commit()

    return {
        "message": "Ticket deleted successfully",
        "ticket_id": ticket_id
    }


# ==========================================
# UPLOAD TICKET IMAGE
# ==========================================

@router.post(
    "/{ticket_id}/image",
    response_model=TicketResponse
)
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

    # ======================================
    # CUSTOMER ACCESS
    # ======================================

    if current_user.role == "customer":

        if ticket.customer_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this ticket"
            )

    # ======================================
    # AGENT ACCESS
    # ======================================

    elif current_user.role == "agent":

        if ticket.agent_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="This ticket is not assigned to you"
            )

    # Admin can access any ticket

    # ======================================
    # CHECK FILE TYPE
    # ======================================

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp"
    ]

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, JPEG, PNG and WEBP "
                "images are allowed"
            )
        )

    # ======================================
    # CREATE UPLOAD DIRECTORY
    # ======================================

    os.makedirs(
        "uploads",
        exist_ok=True
    )

    # ======================================
    # GENERATE UNIQUE FILENAME
    # ======================================

    extension = os.path.splitext(
        image.filename
    )[1]

    filename = (
        f"{uuid.uuid4()}"
        f"{extension}"
    )

    file_path = os.path.join(
        "uploads",
        filename
    )

    # ======================================
    # SAVE IMAGE
    # ======================================

    with open(
        file_path,
        "wb"
    ) as buffer:

        buffer.write(
            await image.read()
        )

    # ======================================
    # SAVE IMAGE PATH
    # ======================================

    ticket.image = (
        f"/uploads/{filename}"
    )

    db.commit()
    db.refresh(ticket)

    return ticket