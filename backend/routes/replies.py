import math
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.connection import get_db
from db.models import Reply, Post, User
from schemas import ReplyCreate, ReplyResponse, PaginatedResponse, PaginationParams
from core.auth import get_current_user

router = APIRouter(
    prefix="/posts",
    tags=["Replies"]
)

@router.get("/{id}/replies", response_model=PaginatedResponse[ReplyResponse])
def get_replies(id: int, db: Session = Depends(get_db), pagination: PaginationParams = Depends()):
    """Get all replies for a specific post."""
    # Verify the post actually exists first
    post = db.query(Post).filter(Post.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    replies_query = db.query(Reply).filter(Reply.post_id == id)
    total_count = replies_query.count()

    replies = replies_query.order_by(Reply.created_at.asc())\
        .offset((pagination.page - 1) * pagination.size)\
        .limit(pagination.size)\
        .all()
    
    result = []
    for reply in replies:
        display_name = "UOL Student" if reply.is_anonymous else reply.author.first_name
        result.append(ReplyResponse(
            id=reply.id,
            post_id=reply.post_id,
            text=reply.text,
            is_anonymous=reply.is_anonymous,
            created_at=reply.created_at,
            author={"first_name": display_name}
        ))
    return PaginatedResponse(
        items=result,
        total_count=total_count,
        page=pagination.page,
        size=pagination.size,
        total_pages=math.ceil(total_count / pagination.size)
    )

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
    
    display_name = "UOL Student" if new_reply.is_anonymous else current_user.first_name
    return ReplyResponse(
        id=new_reply.id,
        post_id=new_reply.post_id,
        text=new_reply.text,
        is_anonymous=new_reply.is_anonymous,
        created_at=new_reply.created_at,
        author={"first_name": display_name}
    )