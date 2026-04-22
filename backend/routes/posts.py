from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.connection import get_db
from db.models import Post, User, Vibe
from schemas import PostCreate, PostResponse
from core.auth import get_current_user, get_optional_current_user

router = APIRouter(
    prefix="/posts",
    tags=["Posts"]
)

@router.get("", response_model=List[PostResponse])
def get_posts(db: Session = Depends(get_db), current_user: User = Depends(get_optional_current_user)):
    """Get all posts, newest first."""
    if current_user:
        # For logged-in users, left join with vibes to see if they have vibed a post
        posts_query = db.query(Post, Vibe.user_id).outerjoin(
            Vibe, (Vibe.post_id == Post.id) & (Vibe.user_id == current_user.id)
        )
    else:
        # For guests, we don't need the join. We add a `None` to keep the data structure consistent.
        posts_query = db.query(Post, None)

    posts = posts_query.order_by(Post.created_at.desc()).all()
    
    result = []
    for post, user_vibe_id in posts:
        display_name = "UOL Student" if post.is_anonymous else post.author.first_name
        result.append(PostResponse(
            id=post.id,
            text=post.text,
            category=post.category,
            is_anonymous=post.is_anonymous,
            created_at=post.created_at,
            author={"first_name": display_name},
            vibe_count=post.vibe_count,
            has_vibed=(user_vibe_id is not None)
        ))
    return result

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(post: PostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new post. Requires the user to be logged in."""
    new_post = Post(**post.model_dump(), user_id=current_user.id)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    display_name = "UOL Student" if new_post.is_anonymous else current_user.first_name
    return PostResponse(
        id=new_post.id,
        text=new_post.text,
        category=new_post.category,
        is_anonymous=new_post.is_anonymous,
        created_at=new_post.created_at,
        author={"first_name": display_name},
        vibe_count=new_post.vibe_count,
        has_vibed=False # A user cannot have vibed their own post upon creation
    )
