from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.connection import get_db
from db.models import Reply, Post, User
from schemas import ReplyCreate, ReplyResponse
from core.auth import get_current_user

router = APIRouter(
    prefix="/posts",
    tags=["Replies"]
)

@router.get("/{id}/replies", response_model=List[ReplyResponse])
def get_replies(id: int, db: Session = Depends(get_db)):
    """Get all replies for a specific post."""
    # Verify the post actually exists first
    post = db.query(Post).filter(Post.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    replies = db.query(Reply).filter(Reply.post_id == id).order_by(Reply.created_at.asc()).all()
    return replies

@router.post("/{id}/replies", response_model=ReplyResponse, status_code=status.HTTP_201_CREATED)
def create_reply(id: int, reply: ReplyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Add a reply to a post. Requires the user to be logged in."""
    post = db.query(Post).filter(Post.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    new_reply = Reply(
        text=reply.text,
        is_anonymous=reply.is_anonymous,
        post_id=id,
        user_id=current_user.id
    )
    db.add(new_reply)
    db.commit()
    db.refresh(new_reply)
    return new_reply