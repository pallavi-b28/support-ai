import os
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from google import genai

from ..database import get_db
from ..models import User, Ticket
from ..dependencies import get_current_user


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


@router.post("/tickets/{ticket_id}/analyze")
def analyze_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # =========================================
    # FIND TICKET
    # =========================================

    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )


    # =========================================
    # ROLE CHECK
    # =========================================

    if current_user.role not in [
        "agent",
        "admin"
    ]:
        raise HTTPException(
            status_code=403,
            detail="Only agents and admins can use AI analysis"
        )


    # =========================================
    # AGENT ACCESS CHECK
    # =========================================

    if (
        current_user.role == "agent"
        and ticket.agent_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="This ticket is not assigned to you"
        )


    # =========================================
    # API KEY CHECK
    # =========================================

    if not GEMINI_API_KEY:

        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured"
        )


    # =========================================
    # AI PROMPT
    # =========================================

    prompt = f"""
You are an AI support ticket classification assistant.

Analyze this customer support ticket.

Title:
{ticket.title}

Description:
{ticket.description}

Classify the ticket into exactly one category:

technical
billing
account
access
hardware
software
other

Classify priority as exactly one:

low
medium
high
critical

Then generate a professional response
that a support agent can send to the customer.

Return ONLY valid JSON.

Use exactly this format:

{{
    "category": "technical",
    "priority": "high",
    "suggested_response": "Professional response to the customer"
}}

Do not include markdown.
Do not include ``` symbols.
Do not include explanations outside JSON.
"""


    # =========================================
    # CALL GEMINI
    # =========================================

    try:

        client = genai.Client(
            api_key=GEMINI_API_KEY
        )


        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )


        ai_text = response.text.strip()


        # Remove markdown fences if Gemini
        # accidentally returns them.

        if ai_text.startswith("```"):

            ai_text = ai_text.replace(
                "```json",
                ""
            ).replace(
                "```",
                ""
            ).strip()


        result = json.loads(
            ai_text
        )


    except json.JSONDecodeError:

        raise HTTPException(
            status_code=500,
            detail="AI returned an invalid JSON response"
        )


    except Exception as e:

        error_message = str(e)


        # =====================================
        # GEMINI TEMPORARY UNAVAILABLE
        # =====================================

        if (
            "503" in error_message
            or "UNAVAILABLE" in error_message
            or "high demand" in error_message.lower()
        ):

            raise HTTPException(
                status_code=503,
                detail=(
                    "Gemini AI is temporarily unavailable "
                    "because the model is experiencing high demand. "
                    "Please try again in a few moments."
                )
            )


        # =====================================
        # OTHER GEMINI ERROR
        # =====================================

        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {error_message}"
        )


    # =========================================
    # EXTRACT AI RESULT
    # =========================================

    category = result.get(
        "category",
        "other"
    )


    priority = result.get(
        "priority",
        "medium"
    )


    suggested_response = result.get(
        "suggested_response",
        ""
    )


    # =========================================
    # VALIDATE CATEGORY
    # =========================================

    allowed_categories = [
        "technical",
        "billing",
        "account",
        "access",
        "hardware",
        "software",
        "other"
    ]


    if category not in allowed_categories:

        category = "other"


    # =========================================
    # VALIDATE PRIORITY
    # =========================================

    allowed_priorities = [
        "low",
        "medium",
        "high",
        "critical"
    ]


    if priority not in allowed_priorities:

        priority = "medium"


    # =========================================
    # SAVE AI RESULT
    # =========================================

    ticket.ai_category = category

    ticket.ai_priority = priority

    ticket.ai_response = suggested_response


    db.commit()

    db.refresh(ticket)


    # =========================================
    # RESPONSE
    # =========================================

    return {

        "message":
            "AI analysis completed successfully",

        "ticket_id":
            ticket.id,

        "category":
            category,

        "priority":
            priority,

        "suggested_response":
            suggested_response

    }