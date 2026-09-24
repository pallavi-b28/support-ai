import json
import os
import time

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from google import genai
from google.genai import types

from ..database import get_db
from ..dependencies import get_current_user, require_agent
from ..models import Ticket, User


# =========================================================
# CONFIGURATION
# =========================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

PRIMARY_MODEL = "gemini-2.5-flash"
FALLBACK_MODEL = "gemini-2.5-flash-lite"

MAX_RETRIES = 3

RETRY_DELAYS = [
    1,
    2,
    4
]


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


# =========================================================
# ALLOWED VALUES
# =========================================================

ALLOWED_CATEGORIES = [
    "technical",
    "billing",
    "account",
    "access",
    "hardware",
    "software",
    "other"
]


ALLOWED_PRIORITIES = [
    "low",
    "medium",
    "high",
    "critical"
]


# =========================================================
# CUSTOMER AI REQUEST SCHEMA
# =========================================================

class AIHelpRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=1000
    )


# =========================================================
# LOCAL FALLBACK ANALYSIS
# =========================================================

def local_fallback_analysis(ticket: Ticket):

    text = (
        f"{ticket.title} "
        f"{ticket.description}"
    ).lower()

    # -----------------------------------------------------
    # CATEGORY
    # -----------------------------------------------------

    category = "other"

    if any(
        word in text
        for word in [
            "payment",
            "billing",
            "invoice",
            "refund",
            "charge",
            "transaction",
            "subscription"
        ]
    ):
        category = "billing"

    elif any(
        word in text
        for word in [
            "login",
            "log in",
            "password",
            "sign in",
            "authentication",
            "account"
        ]
    ):
        category = "access"

    elif any(
        word in text
        for word in [
            "account",
            "profile",
            "username",
            "email address"
        ]
    ):
        category = "account"

    elif any(
        word in text
        for word in [
            "laptop",
            "computer",
            "keyboard",
            "mouse",
            "monitor",
            "printer",
            "device"
        ]
    ):
        category = "hardware"

    elif any(
        word in text
        for word in [
            "application",
            "app",
            "software",
            "program",
            "installation"
        ]
    ):
        category = "software"

    elif any(
        word in text
        for word in [
            "error",
            "bug",
            "crash",
            "not working",
            "failed",
            "failure",
            "exception"
        ]
    ):
        category = "technical"

    # -----------------------------------------------------
    # PRIORITY
    # -----------------------------------------------------

    priority = "medium"

    if any(
        word in text
        for word in [
            "critical",
            "production down",
            "system down",
            "completely down",
            "cannot access anything",
            "security breach"
        ]
    ):
        priority = "critical"

    elif any(
        word in text
        for word in [
            "urgent",
            "immediately",
            "blocked",
            "unable",
            "cannot",
            "can't",
            "payment failed"
        ]
    ):
        priority = "high"

    elif any(
        word in text
        for word in [
            "minor",
            "small",
            "occasionally",
            "sometimes"
        ]
    ):
        priority = "low"

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    response = (
        "Thank you for reporting this issue. "
        "Our support team will review the ticket "
        "and get back to you with the appropriate "
        "resolution."
    )

    if category == "billing":

        response = (
            "Thank you for reporting the billing issue. "
            "Please verify the transaction details and "
            "avoid submitting the payment repeatedly. "
            "Our support team will review the transaction "
            "and assist you further."
        )

    elif category == "access":

        response = (
            "Thank you for reporting the access issue. "
            "Please verify your credentials and try "
            "logging in again. If the problem continues, "
            "our support team will investigate the "
            "authentication issue."
        )

    elif category == "technical":

        response = (
            "Thank you for reporting the technical issue. "
            "Please try refreshing the application and "
            "reproducing the problem. If the issue "
            "continues, our support team will investigate "
            "the reported error."
        )

    elif category == "hardware":

        response = (
            "Thank you for reporting the hardware issue. "
            "Please check that the device and its "
            "connections are properly connected. "
            "Our support team will investigate the "
            "hardware problem."
        )

    elif category == "software":

        response = (
            "Thank you for reporting the software issue. "
            "Please restart the application and check "
            "whether the issue persists. Our support team "
            "will investigate further."
        )

    return {
        "category": category,
        "priority": priority,
        "response": response,
        "source": "local_fallback"
    }


# =========================================================
# NORMALIZE AI ANALYSIS
# =========================================================

def normalize_analysis(result: dict):

    category = str(
        result.get(
            "category",
            "other"
        )
    ).strip().lower()

    priority = str(
        result.get(
            "priority",
            "medium"
        )
    ).strip().lower()

    response = str(
        result.get(
            "response",
            ""
        )
    ).strip()

    if category not in ALLOWED_CATEGORIES:
        category = "other"

    if priority not in ALLOWED_PRIORITIES:
        priority = "medium"

    if not response:
        response = (
            "Thank you for contacting support. "
            "Our support team will review this issue "
            "and assist you shortly."
        )

    return {
        "category": category,
        "priority": priority,
        "response": response
    }


# =========================================================
# GEMINI TICKET ANALYSIS
# =========================================================

def analyze_with_gemini(ticket: Ticket):

    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    client = genai.Client(
        api_key=GEMINI_API_KEY
    )

    prompt = f"""
You are an AI support-ticket classification assistant.

Analyze the following support ticket.

Ticket title:
{ticket.title}

Ticket description:
{ticket.description}

Current category:
{ticket.category}

Current priority:
{ticket.priority}

Return ONLY valid JSON.

The category MUST be exactly one of:

technical
billing
account
access
hardware
software
other

The priority MUST be exactly one of:

low
medium
high
critical

Generate a concise and professional suggested response
that a support agent can send to the customer.

JSON format:

{{
    "category": "technical",
    "priority": "medium",
    "response": "Professional response to customer"
}}
"""

    schema = types.Schema(
        type=types.Type.OBJECT,

        properties={
            "category": types.Schema(
                type=types.Type.STRING,
                enum=[
                    "technical",
                    "billing",
                    "account",
                    "access",
                    "hardware",
                    "software",
                    "other"
                ]
            ),

            "priority": types.Schema(
                type=types.Type.STRING,
                enum=[
                    "low",
                    "medium",
                    "high",
                    "critical"
                ]
            ),

            "response": types.Schema(
                type=types.Type.STRING
            )
        },

        required=[
            "category",
            "priority",
            "response"
        ]
    )

    last_error = None

    models_to_try = [
        PRIMARY_MODEL,
        FALLBACK_MODEL
    ]

    for model_name in models_to_try:

        for attempt in range(MAX_RETRIES):

            try:

                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        response_mime_type="application/json",
                        response_schema=schema
                    )
                )

                raw_text = (
                    response.text or ""
                ).strip()

                if not raw_text:
                    raise RuntimeError(
                        "Gemini returned an empty response."
                    )

                result = json.loads(
                    raw_text
                )

                normalized = normalize_analysis(
                    result
                )

                return {
                    "category": normalized["category"],
                    "priority": normalized["priority"],
                    "response": normalized["response"],
                    "source": "gemini"
                }

            except Exception as error:

                last_error = error

                print(
                    f"Gemini analysis error "
                    f"(model={model_name}, "
                    f"attempt={attempt + 1}):",
                    error
                )

                if attempt < MAX_RETRIES - 1:

                    time.sleep(
                        RETRY_DELAYS[
                            min(
                                attempt,
                                len(RETRY_DELAYS) - 1
                            )
                        ]
                    )

    raise RuntimeError(
        f"Gemini analysis failed: {last_error}"
    )


# =========================================================
# ANALYZE TICKET
# =========================================================

@router.post(
    "/tickets/{ticket_id}/analyze"
)
def analyze_ticket(
    ticket_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_agent
    )
):

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:

        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    # -----------------------------------------------------
    # AGENT ACCESS
    # -----------------------------------------------------

    if (
        current_user.role == "agent"
        and ticket.agent_id != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You can analyze only tickets "
                "assigned to you."
            )
        )

    # -----------------------------------------------------
    # GEMINI + FALLBACK
    # -----------------------------------------------------

    try:

        result = analyze_with_gemini(
            ticket
        )

    except Exception as error:

        print(
            "Gemini analysis failed:",
            error
        )

        result = local_fallback_analysis(
            ticket
        )

    # -----------------------------------------------------
    # SAVE RESULT
    # -----------------------------------------------------

    ticket.ai_category = result["category"]

    ticket.ai_priority = result["priority"]

    ticket.ai_response = result["response"]

    db.commit()

    db.refresh(
        ticket
    )

    return {
        "message":
            "Ticket analyzed successfully.",

        "ticket_id":
            ticket.id,

        "category":
            ticket.ai_category,

        "priority":
            ticket.ai_priority,

        "response":
            ticket.ai_response,

        "source":
            result.get(
                "source",
                "unknown"
            )
    }


# =========================================================
# CUSTOMER AI FALLBACK
# =========================================================

def get_help_fallback(
    ticket: Ticket,
    question: str
):

    category = (
        ticket.ai_category
        or ticket.category
        or "other"
    ).lower()

    question_lower = (
        question.lower()
    )

    # -----------------------------------------------------
    # BILLING
    # -----------------------------------------------------

    if category == "billing":

        response = (
            "I understand that you are having a billing "
            "or payment-related issue. Please avoid "
            "repeatedly submitting the same payment while "
            "the issue is being investigated. You can "
            "verify your payment details and check whether "
            "the transaction appears in your account. "
            "If the issue continues, our support team "
            "can investigate the transaction."
        )

    # -----------------------------------------------------
    # ACCESS
    # -----------------------------------------------------

    elif category == "access":

        response = (
            "For an account access issue, please verify "
            "your username and password and try signing "
            "in again. If you recently changed your "
            "password, make sure you are using the latest "
            "one. You can also try signing out and back "
            "in or using the password-reset option. "
            "If the problem continues, our support team "
            "can investigate the account access issue."
        )

    # -----------------------------------------------------
    # ACCOUNT
    # -----------------------------------------------------

    elif category == "account":

        response = (
            "For an account-related issue, please verify "
            "that your account information is correct and "
            "try signing out and signing back in. If the "
            "problem continues, our support team can "
            "review your account and help resolve the issue."
        )

    # -----------------------------------------------------
    # TECHNICAL
    # -----------------------------------------------------

    elif category == "technical":

        response = (
            "For this technical issue, please try "
            "refreshing the application and reproducing "
            "the problem. If possible, note the exact "
            "error message and the steps that caused it. "
            "Your screenshot and ticket details can help "
            "our support team investigate the problem."
        )

    # -----------------------------------------------------
    # HARDWARE
    # -----------------------------------------------------

    elif category == "hardware":

        response = (
            "For a hardware-related issue, please check "
            "that the device is powered on and that its "
            "connections are secure. If the problem "
            "continues, please keep the ticket updated "
            "with any error indicators or device details "
            "so our support team can investigate."
        )

    # -----------------------------------------------------
    # SOFTWARE
    # -----------------------------------------------------

    elif category == "software":

        response = (
            "For a software-related issue, try restarting "
            "the application and reproducing the problem. "
            "If the issue continues, please provide the "
            "error message or any additional details you "
            "notice so our support team can investigate."
        )

    # -----------------------------------------------------
    # OTHER
    # -----------------------------------------------------

    else:

        response = (
            "I understand your concern. Based on the "
            "information in this ticket, our support team "
            "will need to review the issue in more detail. "
            "Please keep any error messages, screenshots, "
            "or additional details available so they can "
            "investigate the problem."
        )

    # -----------------------------------------------------
    # STATUS QUESTIONS
    # -----------------------------------------------------

    if any(
        word in question_lower
        for word in [
            "status",
            "update",
            "when",
            "resolved"
        ]
    ):

        if ticket.status == "resolved":

            response += (
                " According to the current ticket status, "
                "this ticket is marked as resolved."
            )

        elif ticket.status == "closed":

            response += (
                " According to the current ticket status, "
                "this ticket is marked as closed."
            )

        elif ticket.status == "in_progress":

            response += (
                " According to the current ticket status, "
                "this ticket is currently being worked on."
            )

        else:

            response += (
                " According to the current ticket status, "
                "this ticket is currently open."
            )

    return response


# =========================================================
# GEMINI CUSTOMER AI ASSISTANT
# =========================================================

def generate_help_with_gemini(
    ticket: Ticket,
    question: str
):

    if not GEMINI_API_KEY:

        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    client = genai.Client(
        api_key=GEMINI_API_KEY
    )

    prompt = f"""
You are SupportAI, a customer support assistant.

Help the customer understand or troubleshoot
their existing support ticket.

Use only the information contained in the ticket
and general safe troubleshooting advice.

Do NOT claim that you:

- contacted an employee
- changed the ticket
- issued a refund
- changed an account
- performed a backend action
- fixed the customer's system
- accessed private systems

unless the ticket information explicitly says
that it happened.

If the customer asks for something that requires
a support agent or administrator, explain that
a support agent needs to handle it.

Keep the response professional, concise and helpful.

TICKET INFORMATION

Ticket ID:
{ticket.id}

Title:
{ticket.title}

Description:
{ticket.description}

Category:
{ticket.category}

AI Category:
{ticket.ai_category or "Not available"}

Priority:
{ticket.priority}

AI Priority:
{ticket.ai_priority or "Not available"}

Status:
{ticket.status}

Customer question:
{question}

Return only the response to the customer.
Do not return JSON.
"""

    last_error = None

    models_to_try = [
        PRIMARY_MODEL,
        FALLBACK_MODEL
    ]

    for model_name in models_to_try:

        for attempt in range(MAX_RETRIES):

            try:

                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                        max_output_tokens=500
                    )
                )

                text = (
                    response.text or ""
                ).strip()

                if not text:

                    raise RuntimeError(
                        "Gemini returned an empty response."
                    )

                return text

            except Exception as error:

                last_error = error

                print(
                    f"Gemini help error "
                    f"(model={model_name}, "
                    f"attempt={attempt + 1}):",
                    error
                )

                if attempt < MAX_RETRIES - 1:

                    time.sleep(
                        RETRY_DELAYS[
                            min(
                                attempt,
                                len(RETRY_DELAYS) - 1
                            )
                        ]
                    )

    raise RuntimeError(
        f"Gemini customer assistant failed: "
        f"{last_error}"
    )


# =========================================================
# CUSTOMER AI ASSISTANT ENDPOINT
# =========================================================

@router.post(
    "/tickets/{ticket_id}/help"
)
def customer_ai_help(
    ticket_id: int,

    request: AIHelpRequest,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    # -----------------------------------------------------
    # FIND TICKET
    # -----------------------------------------------------

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:

        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    # -----------------------------------------------------
    # AUTHORIZATION
    # -----------------------------------------------------

    is_customer_owner = (
        current_user.role == "customer"
        and ticket.customer_id == current_user.id
    )

    is_assigned_agent = (
        current_user.role == "agent"
        and ticket.agent_id == current_user.id
    )

    is_admin = (
        current_user.role == "admin"
    )

    if not (
        is_customer_owner
        or is_assigned_agent
        or is_admin
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission "
                "to use the AI assistant for "
                "this ticket."
            )
        )

    # -----------------------------------------------------
    # CLEAN MESSAGE
    # -----------------------------------------------------

    question = request.message.strip()

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    # -----------------------------------------------------
    # TRY GEMINI
    # -----------------------------------------------------

    try:

        response = generate_help_with_gemini(
            ticket,
            question
        )

        source = "gemini"

    except Exception as error:

        print(
            "Customer AI assistant "
            "falling back to local response:",
            error
        )

        response = get_help_fallback(
            ticket,
            question
        )

        source = "local_fallback"

    # -----------------------------------------------------
    # RETURN
    # -----------------------------------------------------

    return {
        "ticket_id": ticket.id,
        "response": response,
        "source": source
    }