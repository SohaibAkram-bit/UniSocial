from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from db.models import Post, Vibe

def toggle_vibe(db: Session, post_id: int, user_id: int):
    """Toggles a vibe on a post for a given user."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
    existing_vibe = db.query(Vibe).filter(Vibe.post_id == post_id, Vibe.user_id == user_id).first()
    
    if existing_vibe:
        db.delete(existing_vibe)
        post.vibe_count -= 1
        action = "removed"
    else:
        new_vibe = Vibe(post_id=post_id, user_id=user_id)
        db.add(new_vibe)
        post.vibe_count += 1
        action = "added"
        
    db.commit()
    
    return {"action": action, "vibe_count": post.vibe_count}