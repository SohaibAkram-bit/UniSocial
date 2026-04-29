import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Safely load SECRET_KEY (Never hardcode real secrets here!)
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key_change_in_production")

# Safely load DATABASE_URL. Use a dummy sqlite DB if missing to prevent startup crashes.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./local_fallback.db")

# SQLAlchemy 1.4+ requires "postgresql://" but Neon/Render provide "postgres://"
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)