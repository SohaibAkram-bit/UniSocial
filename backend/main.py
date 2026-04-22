from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.connection import engine, Base
import db.models  # Import models so SQLAlchemy knows about them before creating tables
from routes import auth, posts, replies, vibes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Bind the engine and create all tables in the database automatically on startup
    print("Attempting to connect to the database and create tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    yield

# Initialize the FastAPI application
app = FastAPI(
    title="UniSocial API",
    description="A social platform for University of Lahore students",
    lifespan=lifespan
)

# Add CORS middleware so our Vanilla JS frontend can communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development
    allow_credentials=True,
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