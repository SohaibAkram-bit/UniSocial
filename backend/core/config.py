import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

def get_env_var(var_name: str) -> str:
    """Fetch an environment variable or fail loudly if it is missing."""
    value = os.getenv(var_name)
    if value is None:
        raise ValueError(f"CRITICAL ERROR: Missing required environment variable '{var_name}'")
    return value

SECRET_KEY = get_env_var("SECRET_KEY")

# Support unified DATABASE_URL (Standard in Render, Heroku, Railway, etc.)
DATABASE_URL = os.getenv("DATABASE_URL")

# If unified URL is not provided, fall back to constructing it (for local dev)
if not DATABASE_URL:
    DB_HOST = get_env_var("DB_HOST")
    DB_PORT = get_env_var("DB_PORT")
    DB_NAME = get_env_var("DB_NAME")
    DB_USER = get_env_var("DB_USER")
    DB_PASSWORD = get_env_var("DB_PASSWORD")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"