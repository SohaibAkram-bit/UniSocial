# UniSocial

A social platform for University of Lahore students to post thoughts, rants, questions, and confessions — anonymously or with their name.

---

## The Problem It Solves
UOL students have no dedicated space to speak freely. WhatsApp groups are noisy. Facebook is too public — professors and family are watching. UniSocial gives students a focused, safe space to talk about academic stress, campus life, mental health, and anything else — without fear of judgment.

---

## Current Status
MVP is complete and working locally. Not hosted yet.

### What is built and working
- Student signup restricted to UOL email domains only
- Login with JWT authentication
- Create a post — anonymous or named, with a category
- View all posts in a feed, newest first
- Reply to any post — anonymous or named
- Anonymous posts and replies display as "UOL Student"
- Single Page Application — no page reloads
- XSS protection on all user generated content
- Environment variables for all secrets — nothing hardcoded

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Backend | FastAPI (Python) | Simple, fast, already familiar |
| ORM | SQLAlchemy | Defines tables as Python classes, handles relationships |
| Validation | Pydantic | Controls exactly what comes in and what goes out |
| Database | PostgreSQL | Industry standard, installed locally |
| Auth | JWT + bcrypt | Secure password hashing and stateless tokens |
| Frontend | HTML + CSS + Vanilla JS | No framework overhead, easy to understand |
| Server | Uvicorn | Comes with FastAPI |

---

## Project Structure

```
UNISOCIAL/
├── backend/                         # all server side code lives here
│   ├── core/                        # shared logic used across the whole app
│   │   ├── __init__.py
│   │   ├── auth.py                  # password hashing, JWT creation, get_current_user()
│   │   └── config.py                # loads all environment variables, fails loud if any missing
│   ├── db/                          # database only, nothing else lives here
│   │   ├── __init__.py
│   │   ├── connection.py            # SQLAlchemy engine, session, get_db()
│   │   └── models.py                # User, Post, Reply SQLAlchemy models
│   ├── routes/                      # one file per feature, no route imports another route
│   │   ├── __init__.py
│   │   ├── auth.py                  # POST /auth/signup and POST /auth/login
│   │   ├── posts.py                 # GET /posts and POST /posts
│   │   └── replies.py               # GET and POST /posts/{id}/replies
│   ├── schemas/                     # Pydantic models, separate from database models
│   │   └── __init__.py              # UserCreate, PostCreate, PostResponse, AuthorResponse etc.
│   ├── .env                         # secret config, never commit this
│   ├── main.py                      # entry point, starts the server, registers routers
│   ├── requirements.txt             # backend dependencies with pinned versions
│   └── test_db.py                   # quick script to verify database connection
├── frontend/                        # all UI files
│   ├── app.js                       # single apiRequest() helper, event delegation, DocumentFragment
│   ├── index.html                   # semantic HTML, auth section hidden by default
│   └── style.css                    # sticky navbar, card layout, mobile friendly
├── venv/                            # virtual environment, never touch this
├── .env.example                     # template showing every required variable with placeholders
├── .gitignore                       # venv, pycache, .env, OS and IDE files excluded
├── freeze                           # pip freeze output for reference
├── README.md                        # this file
└── requirements.txt                 # top level requirements
```

---

## Architecture

### Dependency Rule
Routes import from core/ and db/. Core imports from db/. The `db` module imports nothing internal, except for the database URL from `core.config`. No route file ever imports from another route file. This prevents circular dependencies.

### Anonymity Is Enforced Server Side
The backend decides what author name to return in every response. The frontend is never trusted or responsible for privacy decisions. Anonymous posts return "UOL Student" before the response is built — not after.

### Fail Loud Config
Every environment variable is loaded through core/config.py using get_env_var(). If any variable is missing the app crashes immediately with a clear error message. No silent fallbacks, no wrong defaults.

### Schemas Separate From Models
Database models live in db/models.py. API request and response shapes live in schemas/. This separation prevents circular imports and keeps the database shape completely independent from what the API exposes.

---

## Database

### Table: users
| Column | Type | Notes |
|---|---|---|
| id | SERIAL | primary key, auto increments |
| email | VARCHAR | unique, must end in @student.uol.edu.pk or @uol.edu.pk |
| password | VARCHAR | bcrypt hashed, max 72 chars enforced at validation layer |
| first_name | VARCHAR | shown when posting publicly, never exposed on anonymous posts |
| created_at | TIMESTAMP | auto generated |

### Table: posts
| Column | Type | Notes |
|---|---|---|
| id | SERIAL | primary key, auto increments |
| user_id | INTEGER | references users.id |
| text | TEXT | whitespace stripped, empty text rejected |
| category | VARCHAR | must be one of the five valid categories |
| is_anonymous | BOOLEAN | if true response returns "UOL Student" as author |
| created_at | TIMESTAMP | auto generated |

### Table: replies
| Column | Type | Notes |
|---|---|---|
| id | SERIAL | primary key, auto increments |
| post_id | INTEGER | references posts.id, reply rejected if post does not exist |
| user_id | INTEGER | references users.id |
| text | TEXT | whitespace stripped, empty text rejected |
| is_anonymous | BOOLEAN | if true response returns "UOL Student" as author |
| created_at | TIMESTAMP | auto generated |

### Valid Categories
Academic, Mental Health, Social, Rant, Advice

---

## API Endpoints

### Auth
| Method | Endpoint | Auth Required | What It Does |
|---|---|---|---|
| POST | /auth/signup | No | Register with UOL email and password |
| POST | /auth/login | No | Login, returns JWT token |

### Posts
| Method | Endpoint | Auth Required | What It Does |
|---|---|---|---|
| GET | /posts | No | Fetch all posts, newest first |
| POST | /posts | Yes | Create a new post |

### Replies
| Method | Endpoint | Auth Required | What It Does |
|---|---|---|---|
| GET | /posts/{id}/replies | No | Fetch all replies for a post |
| POST | /posts/{id}/replies | Yes | Add a reply to a post |

---

## Security Decisions

- Passwords hashed with bcrypt, max length 72 enforced to prevent silent truncation
- JWT stored in localStorage, sent as Bearer token on every protected request
- Email validated with Pydantic field_validator before touching the database
- user_id and email never returned in post or reply responses
- All user content inserted with textContent not innerHTML — XSS prevented at the source
- bcrypt pinned to 3.2.0 in requirements.txt to fix passlib compatibility bug

---

## Environment Variables

Create a `.env` file inside the `backend/` folder. See `.env.example` for the template.

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=unisocial
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
SECRET_KEY=any_long_random_string_for_jwt
```

---

## How To Run Locally

### 1. Activate virtual environment
Windows:
```bash
venv\Scripts\activate
```
Mac/Linux:
```bash
source venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Create the database
```sql
CREATE DATABASE unisocial;
```

### 4. Start the server
```bash
cd backend
uvicorn main:app --reload
```

### 5. Open in browser
```
http://127.0.0.1:8000
```

### 6. Explore all endpoints
```
http://127.0.0.1:8000/docs
```

---

## Planned Features

### Upvotes
- Add upvotes column to posts table
- POST /posts/{id}/upvote — one upvote per user per post
- Show upvote count on each post in the feed

### Trending Section
- Separate feed showing posts with most upvotes or replies in last 24 hours
- No algorithm — just a different query with a time filter

### Category Filter
- Filter the feed by category
- One query parameter added to GET /posts

### Post Expiry
- Posts automatically removed after 7 days
- Keeps the feed fresh, reduces regret for students who overshared

### Post Reporting
- Simple report button on every post
- Flags post for manual review before the platform grows

---

## Coding Rules
- One file does one job — no database code in routes, no auth logic scattered around
- Every function has a short comment above it explaining what it does
- Never hardcode secrets — always use .env via core/config.py
- Keep functions short — if a function exceeds 20 lines it probably does too much
- Run the server after every change to catch errors early
