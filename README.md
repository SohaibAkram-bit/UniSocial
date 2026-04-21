# UniSocial

A social platform for University of Lahore students to post thoughts, rants, questions, and confessions — anonymously or with their name.

---

## Current Status
- Folder created: unisocial/
- FastAPI installed in virtual environment
- PostgreSQL installed locally
- No code written yet

---

## The Problem It Solves
UOL students have no dedicated space to speak freely. WhatsApp groups are noisy. Facebook is too public — professors and family are watching. UniSocial gives students a focused, safe space to talk about academic stress, campus life, mental health, and anything else — without fear of judgment.

---

## Core Features
- Post anything — text based, no images for now
- Choose to post anonymously or with your first name
- Pick a category for every post
- Reply to any post, also anonymously or named
- Anonymous posts display author as "UOL Student"

---

## Categories
- Academic
- Mental Health
- Social
- Rant
- Advice

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Backend | FastAPI (Python) | Simple, fast, already familiar |
| Database | PostgreSQL (local) | Already installed, industry standard |
| Frontend | HTML + CSS + Vanilla JS | No framework overhead, easy to understand |
| Server | Uvicorn | Comes with FastAPI |

---

## Project Structure

```
unisocial/
├── venv/                        # virtual environment, never touch this
├── main.py                      # entry point, starts the server
├── routes/                      # one file per feature
│   ├── __init__.py
│   ├── posts.py                 # everything related to posts
│   ├── replies.py               # everything related to replies
│   └── auth.py                  # signup and login
├── db/                          # database related code only
│   ├── __init__.py
│   ├── connection.py            # connects to PostgreSQL
│   └── models.py                # table definitions
├── frontend/                    # all UI files
│   ├── index.html               # main page
│   ├── style.css                # all styling
│   └── app.js                   # all frontend logic
├── .env                         # secret config, never commit this
├── .gitignore                   # files git should ignore
├── requirements.txt             # all python dependencies
└── README.md                    # this file
```

---

## Database

### Table: users
Stores every registered student.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | primary key, auto increments |
| email | VARCHAR | unique, must be university email |
| password | VARCHAR | hashed, never store plain text |
| first_name | VARCHAR | shown when posting publicly |
| created_at | TIMESTAMP | auto generated |

### Table: posts
Stores every post made by a student.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | primary key, auto increments |
| user_id | INTEGER | references users.id |
| text | TEXT | the post content |
| category | VARCHAR | Academic, Mental Health, Social, Rant, Advice |
| is_anonymous | BOOLEAN | if true show author as UOL Student |
| created_at | TIMESTAMP | auto generated |

### Table: replies
Stores replies to posts.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL | primary key, auto increments |
| post_id | INTEGER | references posts.id |
| user_id | INTEGER | references users.id |
| text | TEXT | the reply content |
| is_anonymous | BOOLEAN | if true show author as UOL Student |
| created_at | TIMESTAMP | auto generated |

---

## API Endpoints

### Auth
| Method | Endpoint | What It Does |
|---|---|---|
| POST | /auth/signup | Register a new student |
| POST | /auth/login | Login and get a token |

### Posts
| Method | Endpoint | What It Does |
|---|---|---|
| GET | /posts | Get all posts, newest first |
| POST | /posts | Create a new post |

### Replies
| Method | Endpoint | What It Does |
|---|---|---|
| GET | /posts/{id}/replies | Get all replies for a post |
| POST | /posts/{id}/replies | Add a reply to a post |

---

## Environment Variables
Create a file called `.env` in the project root. Never commit this file.

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
Open PostgreSQL and run:
```sql
CREATE DATABASE unisocial;
```

### 4. Start the server
```bash
uvicorn main:app --reload
```

### 5. Open in browser
```
http://127.0.0.1:8000
```

### 6. Explore the API
```
http://127.0.0.1:8000/docs
```

---

## Dependencies
Add these to requirements.txt:
```
fastapi
uvicorn
psycopg2-binary/sqlalchemy
python-dotenv
passlib
python-jose

```

---

## Build Order
Follow this exact order. Do not skip ahead.

1. main.py — get the server running
2. db/connection.py — connect to PostgreSQL
3. db/models.py — create the tables
4. routes/auth.py — signup and login
5. routes/posts.py — create and fetch posts
6. routes/replies.py — create and fetch replies
7. frontend/index.html — basic page structure
8. frontend/style.css — styling
9. frontend/app.js — connect frontend to backend

---

## Rules We Follow
- One file does one job. Never mix database code with route code.
- Every function has a comment above it explaining what it does.
- Never hardcode passwords, URLs, or secret keys — always use .env
- Run the server after every new file to catch errors early
- Keep functions short — if a function is longer than 20 lines it probably does too much

---

## Architecture Updates (Deviations from Original Plan)
While building the project, we made several professional architectural decisions to make the app more secure, scalable, and production-ready:

- **Switched to SQLAlchemy (ORM):** Instead of writing raw SQL with `psycopg2`, we used SQLAlchemy to define our tables as Python classes, enabling powerful relationships and automatic table generation.
- **Added a Dedicated `schemas` Module:** We separated the database shape from the API request/response shape by creating Pydantic models in a `schemas` folder, preventing circular imports.
- **Security & Data Sanitization:**
  - Created an `AuthorResponse` schema to ensure we only send the author's first name, preventing private email leaks.
  - Added a 72-character limit to passwords in Pydantic to prevent Bcrypt crashes.
  - Pinned `bcrypt==3.2.0` in `requirements.txt` to fix a compatibility bug with `passlib`.
- **Strict Domain Validation:** Enforced the UOL email requirement directly at the validation layer using Pydantic's `@field_validator` (rejecting non-UOL emails before they reach the database).
- **Frontend State Management:** Implemented a Single Page Application (SPA) pattern using Vanilla JS, securely storing the JWT in `localStorage` to persist user sessions without needing page reloads.
