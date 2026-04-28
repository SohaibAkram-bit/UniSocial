from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.limiter import limiter
from sqlalchemy import text

from db.connection import engine, Base
import db.models  # Import models so SQLAlchemy knows about them before creating tables
from routes import auth, posts, replies, vibes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Bind the engine and create all tables in the database automatically on startup
    print("Attempting to connect to the database and create tables...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate: Safely add the expires_at column if it is missing
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE posts ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'"))
            print("Migration successful: added 'expires_at' column to the database.")
        except Exception:
            pass # The column already exists, safe to continue
            
    print("Database tables created successfully!")
    yield

# Initialize the FastAPI application
app = FastAPI(
    title="UniSocial API",
    description="A social platform for University of Lahore students",
    lifespan=lifespan
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware so our Vanilla JS frontend can communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # Safe to allow all origins because we don't use cookies
    allow_credentials=False, # We use Bearer tokens, so browser credentials aren't needed
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Include our routers
app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(replies.router)
app.include_router(vibes.router)

@app.get("/")
def read_root():
    """Root endpoint to check if the server is running."""
    return {"message": "Welcome to the UniSocial API!"}