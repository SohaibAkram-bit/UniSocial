from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.connection import get_db
from db.models import User
from core.auth import get_current_user
from core import vibe_service

router = APIRouter(
    prefix="/posts",
    tags=["Vibes"]
)

@router.post("/{id}/vibe", status_code=status.HTTP_200_OK)
def toggle_post_vibe(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Toggle a vibe on a post. Requires authentication."""
    return vibe_service.toggle_vibe(db, id, current_user.id)