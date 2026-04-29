import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Safely load SECRET_KEY with your fallback so it never crashes during health checks
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    SECRET_KEY = "super_secret_uol_key_2026!"

# Safely load DATABASE_URL with your exact Neon string as a fallback
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://neondb_owner:npg_C6VuA7qTKzZk@ep-billowing-moon-anunibwt-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"

# SQLAlchemy 1.4+ requires "postgresql://" but Neon/Render provide "postgres://"
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)