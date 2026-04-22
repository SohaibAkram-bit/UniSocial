from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime

from db.models import Post, Vibe

def toggle_vibe(db: Session, post_id: int, user_id: int) -> dict:
    """
    Efficiency: The Toggle Service Pattern
    Concurrency: Atomic SQL Updates
    Checks for existence, then either DELETE or INSERT in a single transaction.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
    existing_vibe = db.query(Vibe).filter(
        Vibe.post_id == post_id,
        Vibe.user_id == user_id
    ).first()

    if existing_vibe:
        # Toggle off: DELETE and atomic decrement
        db.delete(existing_vibe)
        db.query(Post).filter(Post.id == post_id).update({"vibe_count": Post.vibe_count - 1})
        action = "removed"
    else:
        # Toggle on: INSERT and atomic increment
        new_vibe = Vibe(post_id=post_id, user_id=user_id)
        db.add(new_vibe)
        db.query(Post).filter(Post.id == post_id).update({"vibe_count": Post.vibe_count + 1})
        action = "added"

    db.commit()
    db.refresh(post)
    return {"vibe_count": post.vibe_count, "action": action}

def get_trending_score(vibe_count: int, created_at: datetime) -> float:
    """
    Engagement: The Hotness Decay
    Score = Vibes / (Hours + 2)^1.5
    """
    hours_old = (datetime.utcnow() - created_at).total_seconds() / 3600
    return vibe_count / ((max(hours_old, 0) + 2) ** 1.5)