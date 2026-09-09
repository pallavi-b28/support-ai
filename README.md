# SupportAI

## AI-Powered Support Ticket Management System

SupportAI is a full-stack customer support ticket management platform that helps customers create and track support requests while enabling support agents and administrators to efficiently manage, assign, analyze, and resolve tickets.

The system integrates AI-powered ticket analysis to automatically classify support issues, determine their priority, and generate suggested responses for support agents.

---

## 🚀 Features

### 👤 Customer

- Customer registration and login
- JWT-based authentication
- Create support tickets
- Select ticket category and priority
- Upload screenshots/images
- View personal tickets
- Track ticket status
- View ticket details
- Communicate through ticket comments
- Rate resolved tickets
- Provide feedback after resolution

### 🧑‍💻 Support Agent

- Secure agent login
- Agent dashboard
- View assigned tickets
- Search and filter assigned tickets
- View ticket details
- Update ticket status
- Add responses/comments
- View uploaded screenshots
- AI-powered ticket analysis
- AI-generated suggested customer responses

### 👨‍💼 Administrator

- Admin dashboard
- View system statistics
- Manage users
- Manage support agents
- Create support agents
- Assign and reassign tickets
- Monitor ticket workloads
- View ticket analytics
- View ticket status distribution
- View category and priority analytics
- Monitor AI-analyzed tickets

### 🤖 AI Features

SupportAI uses Google's Gemini API to analyze support tickets.

The AI analyzes:

- Ticket category
- Ticket priority
- Suggested response

Example:

```text
Customer Issue:
"I cannot login to my account even though my password is correct."

AI Analysis:

Category:
Access

Priority:
High

Suggested Response:
A professional response that the support agent
can send to the customer.

🏗️ System Architecture

                    ┌─────────────────────┐
                    │      Customer       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     HTML / CSS / JS │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │       FastAPI       │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │ PostgreSQL  │  │  Gemini AI  │  │ File Upload │
       │  Database   │  │     API     │  │   Storage   │
       └─────────────┘  └─────────────┘  └─────────────┘

🛠️ Tech Stack
Frontend
HTML5
CSS3
JavaScript
Fetch API
Responsive UI
Backend
Python
FastAPI
SQLAlchemy
JWT Authentication
Pydantic
Uvicorn
Database
PostgreSQL
AI
Google Gemini API
Gemini 2.5 Flash
Security
JWT authentication
Password hashing using bcrypt
Role-based access control
Protected API endpoints
Development & Deployment
Git
GitHub
Docker
Docker Compose

📁 Project Structure
support-ai/
│
├── backend/
│   │
│   ├── app/
│   │   ├── routers/
│   │   │   ├── admin.py
│   │   │   ├── agent.py
│   │   │   ├── ai.py
│   │   │   ├── auth.py
│   │   │   ├── comments.py
│   │   │   ├── customer.py
│   │   │   ├── ratings.py
│   │   │   └── tickets.py
│   │   │
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   │
│   ├── css/
│   │   ├── style.css
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   ├── tickets.css
│   │   ├── create-ticket.css
│   │   ├── ticket-details.css
│   │   ├── agent-dashboard.css
│   │   ├── agent-tickets.css
│   │   ├── agent-ticket-details.css
│   │   ├── admin-dashboard.css
│   │   ├── admin-tickets.css
│   │   ├── admin-users.css
│   │   └── admin-agents.css
│   │
│   ├── js/
│   │   ├── auth.js
│   │   ├── route-guard.js
│   │   ├── dashboard.js
│   │   ├── tickets.js
│   │   ├── create-ticket.js
│   │   ├── ticket-details.js
│   │   ├── agent-dashboard.js
│   │   ├── agent-tickets.js
│   │   ├── agent-ticket-details.js
│   │   ├── admin-dashboard.js
│   │   ├── admin-tickets.js
│   │   ├── admin-users.js
│   │   └── admin-agents.js
│   │
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── tickets.html
│   ├── create-ticket.html
│   ├── ticket-details.html
│   ├── agent-dashboard.html
│   ├── agent-tickets.html
│   ├── agent-ticket-details.html
│   ├── admin-dashboard.html
│   ├── admin-tickets.html
│   ├── admin-users.html
│   └── admin-agents.html
│
├── .gitignore
└── README.md

User Login
     ↓
FastAPI verifies credentials
     ↓
Password verification
     ↓
JWT token generated
     ↓
Token stored on frontend
     ↓
Token sent with API requests
     ↓
FastAPI validates token
     ↓
User identity retrieved

#Each role has different permissions.
Customer
   ├── Create tickets
   ├── View own tickets
   ├── Comment
   └── Rate tickets

Agent
   ├── View assigned tickets
   ├── Update status
   ├── Comment/respond
   └── Use AI analysis

Admin
   ├── Manage users
   ├── Manage agents
   ├── Assign tickets
   ├── View analytics
   └── Administrative operations

🎫 Ticket Lifecycle
Customer creates ticket
        ↓
      Open
        ↓
   Admin assigns
        ↓
    Agent works
        ↓
   In Progress
        ↓
     Resolved
        ↓
Customer provides rating
        ↓
      Closed

🤖 AI Ticket Analysis
When an authorized support agent analyzes a ticket, the ticket information is sent to Gemini.
   Ticket
  │
  ├── Title
  └── Description
          │
          ▼
     Gemini API
          │
          ▼
   AI Classification
          │
     ┌────┼──────────────┐
     ▼    ▼              ▼
 Category Priority  Suggested Response
     │    │              │
     └────┴──────────────┘
              │
              ▼
       PostgreSQL


 🗄️ Database Design

Users
  │
  ├───────────────┐
  │               │
  ▼               ▼
Tickets        Comments
  │
  └──────► Ratings
 🔌 API Endpoints
 Authentication:
 POST /auth/register
POST /auth/login
GET  /auth/me
 
 Tickets:
 POST /tickets/
GET  /tickets/
GET  /tickets/my
GET  /tickets/{ticket_id}
PUT  /tickets/{ticket_id}/status
POST /tickets/{ticket_id}/image

Comments:
POST /tickets/{ticket_id}/comments
GET  /tickets/{ticket_id}/comments

Ratings:
POST /tickets/{ticket_id}/rating
GET  /tickets/{ticket_id}/rating

Agent
GET /agent/tickets
GET /agent/tickets/{ticket_id}
PUT /agent/tickets/{ticket_id}/status
GET /agent/dashboard

Admin:
POST /admin/agents
GET  /admin/users
PUT  /admin/tickets/{ticket_id}/assign
GET  /admin/dashboard

AI:
POST /ai/tickets/{ticket_id}/analyze

⚙️ Local Setup
Clone the repository
git clone https://github.com/pallavi-b28/support-ai.git
cd support-ai

Create a Python virtual environment
cd backend
python -m venv venv

Windows
.\venv\Scripts\Activate.ps1

Install dependencies
pip install -r requirements.txt

Configure environment variables
Create:
backend/.env
Add:
DATABASE_URL=postgresql://username:password@localhost:5432/supportai_db

SECRET_KEY=your_secret_key

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=60

GEMINI_API_KEY=your_gemini_api_key

🗃️ PostgreSQL Setup
Create the database:
CREATE DATABASE supportai_db;
Make sure PostgreSQL is running before starting the backend.

▶️ Run the Backend
From the backend directory:
uvicorn app.main:app --reload
Backend:
http://127.0.0.1:8000
Swagger API documentation:
http://127.0.0.1:8000/docs

🌐 Run the Frontend
Open another terminal:
cd frontend
python -m http.server 5500
Open:
http://127.0.0.1:5500/

🧪 Testing the Application
Customer

Register a new account and:

Login
Create a ticket
Upload a screenshot
View ticket
Add comments
Track status
Rate resolved ticket
Agent

Login as an agent and:

Open Agent Dashboard
View Assigned Tickets
Open a ticket
Analyze ticket using AI
Review AI response
Send a response
Update ticket status
Admin

Login as an administrator and:

Open Admin Dashboard
View system statistics
Manage users
Manage agents
Assign tickets
Review ticket analytics

📊 Key Project Highlights
Full-stack application architecture
RESTful API development using FastAPI
PostgreSQL relational database
SQLAlchemy ORM
JWT authentication
Role-based authorization
Secure password hashing
AI-powered ticket classification
AI-generated support responses
Ticket assignment workflow
Image upload functionality
Customer feedback and rating system
Admin analytics dashboard
Responsive frontend
Git/GitHub version control
Docker-ready architecture

🔮 Future Enhancements

Potential future improvements include:

Email notifications
Real-time chat using WebSockets
Advanced AI-powered ticket summarization
Knowledge-base integration
Retrieval-Augmented Generation (RAG)
Automated ticket assignment
Agent performance analytics
Redis caching
Background task processing
Cloud deployment
CI/CD pipeline
Automated unit and integration testing

👩‍💻 Author

Pallavi Bhat

Computer Science and Business Systems Engineering Student

Project

SupportAI – AI-Powered Support Ticket Management System

Built using:
Python
FastAPI
PostgreSQL
SQLAlchemy
JavaScript
HTML
CSS
Gemini AI

⭐ Project Goal
SupportAI aims to improve traditional customer support workflows by combining ticket management, role-based collaboration, analytics, and generative AI assistance into a single platform.


