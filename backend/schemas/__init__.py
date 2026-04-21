from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import List, Literal


# --- TOKEN SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str


# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    email: str
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
    text: str
    is_anonymous: bool = False

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
    text: str
    # Enforce strict category matching as defined in your README
    category: Literal["Academic", "Mental Health", "Social", "Rant", "Advice"]
    is_anonymous: bool = False

class PostResponse(BaseModel):
    id: int
    text: str
    category: str
    is_anonymous: bool
    created_at: datetime
    author: AuthorResponse

    model_config = {"from_attributes": True}
