from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.connection import get_db
from db.models import Post, User
from schemas import PostCreate, PostResponse
from core.auth import get_current_user

router = APIRouter(
    prefix="/posts",
    tags=["Posts"]
)

@router.get("", response_model=List[PostResponse])
def get_posts(db: Session = Depends(get_db)):
    """Get all posts, newest first."""
    # Query all posts and order them by the creation date descending
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    return posts

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(post: PostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new post. Requires the user to be logged in."""
    new_post = Post(
        text=post.text,
        category=post.category,
        is_anonymous=post.is_anonymous,
        user_id=current_user.id
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post