from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Ticket, Comment
from ..schemas import CommentCreate, CommentResponse
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/tickets",
    tags=["Comments"]
)


def check_ticket_access(
    ticket: Ticket,
    current_user: User
):
    if current_user.role == "admin":
        return

    if current_user.role == "customer":
        if ticket.customer_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this ticket"
            )
        return

    if current_user.role == "agent":
        if ticket.agent_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="This ticket is not assigned to you"
            )
        return


# ADD COMMENT
@router.post(
    "/{ticket_id}/comments",
    response_model=CommentResponse
)
def add_comment(
    ticket_id: int,
    comment_data: CommentCreate,
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

    check_ticket_access(ticket, current_user)

    new_comment = Comment(
        message=comment_data.message,
        ticket_id=ticket.id,
        user_id=current_user.id
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return new_comment


# GET COMMENTS
@router.get(
    "/{ticket_id}/comments",
    response_model=list[CommentResponse]
)
def get_comments(
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

    check_ticket_access(ticket, current_user)

    comments = db.query(Comment).filter(
        Comment.ticket_id == ticket_id
    ).order_by(
        Comment.created_at.asc()
    ).all()

    return comments