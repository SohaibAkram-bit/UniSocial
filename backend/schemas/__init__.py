from pydantic import BaseModel, Field, field_validator, EmailStr
from datetime import datetime
from typing import List, Literal, Generic, TypeVar, Optional
from fastapi import Query

T = TypeVar('T')

# --- PAGINATION SCHEMAS ---
class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total_count: int
    page: int
    size: int
    total_pages: int

class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        size: int = Query(20, ge=1, le=50, description="Items per page")
    ):
        self.page = page
        self.size = size

# --- TOKEN SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str


# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(max_length=72)
    first_name: str

    @field_validator('email')
    @classmethod
    def validate_university_email(cls, v: str) -> str:
        """Ensure the email belongs to University of Lahore."""
        if not (v.endswith("@student.uol.edu.pk") or v.endswith("@uol.edu.pk")):
            raise ValueError("Must be a valid University of Lahore email (@student.uol.edu.pk or @uol.edu.pk)")
        return v

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    created_at: datetime

    model_config = {"from_attributes": True}

class AuthorResponse(BaseModel):
    first_name: str

    model_config = {"from_attributes": True}


# --- REPLY SCHEMAS ---
class ReplyCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    is_anonymous: bool = False

    @field_validator('text')
    @classmethod
    def validate_text_not_empty(cls, v: str) -> str:
        """Ensure the text is not just whitespace and strip it."""
        stripped_v = v.strip()
        if not stripped_v:
            raise ValueError("Text cannot be empty or contain only whitespace")
        return stripped_v

class ReplyResponse(BaseModel):
    id: int
    post_id: int
    text: str
    is_anonymous: bool
    created_at: datetime
    author: AuthorResponse

    model_config = {"from_attributes": True}


# --- POST SCHEMAS ---
class PostCreate(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    # Enforce strict category matching as defined in your README
    category: Literal["Academic", "Mental Health", "Social", "Rant", "Advice"]
    is_anonymous: bool = False

    @field_validator('text')
    @classmethod
    def validate_text_not_empty(cls, v: str) -> str:
        """Ensure the text is not just whitespace and strip it."""
        stripped_v = v.strip()
        if not stripped_v:
            raise ValueError("Text cannot be empty or contain only whitespace")
        return stripped_v

class PostResponse(BaseModel):
    id: int
    text: str
    category: str
    is_anonymous: bool
    vibe_count: int = 0
    created_at: datetime
    expires_at: Optional[datetime] = None
    author: AuthorResponse
    has_vibed: bool = False

    model_config = {"from_attributes": True}
