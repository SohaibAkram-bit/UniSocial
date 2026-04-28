import math
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import literal

from db.connection import get_db
from db.models import Post, User, Vibe
from schemas import PostCreate, PostResponse, PaginatedResponse, PaginationParams
from core.auth import get_current_user, get_optional_current_user

router = APIRouter(
    prefix="/posts",
    tags=["Posts"]
)

@router.get("", response_model=PaginatedResponse[PostResponse])
def get_posts(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_optional_current_user),
    pagination: PaginationParams = Depends(),
    category: Optional[str] = Query(None, description="Filter by post category"),
    trending: bool = Query(False, description="Sort by highest vibes in the last 24h")
):
    """Get all posts, with optional filtering and sorting."""
    if current_user:
        # For logged-in users, left join with vibes to see if they have vibed a post
        query = db.query(Post, Vibe.user_id).outerjoin(
            Vibe, (Vibe.post_id == Post.id) & (Vibe.user_id == current_user.id)
        )
    else:
        # For guests, we don't need the join. We use a literal None to keep the data structure consistent.
        query = db.query(Post, literal(None).label("user_vibe_id"))

    # 1. Filter out expired posts
    query = query.filter(Post.expires_at > datetime.now(timezone.utc))

    # 2. Category Filter
    if category:
        query = query.filter(Post.category == category)

    # 3. Trending Section (Order by vibes from the last 24 hours)
    if trending:
        time_threshold = datetime.now(timezone.utc) - timedelta(hours=24)
        query = query.filter(Post.created_at >= time_threshold)
        query = query.order_by(Post.vibe_count.desc(), Post.created_at.desc())
    else:
        # Standard Feed
        query = query.order_by(Post.created_at.desc())

    # Get total count AFTER filters are applied
    total_count = query.count()

    # Apply pagination
    posts = query.offset((pagination.page - 1) * pagination.size).limit(pagination.size).all()
    
    result = []
    for post, user_vibe_id in posts:
        display_name = "UOL Student" if post.is_anonymous else post.author.first_name
        # Use model_validate to construct the response from the ORM object
        # This is safer and ensures all fields are correctly populated
        post_response = PostResponse.model_validate(post)
        post_response.author.first_name = display_name
        post_response.has_vibed = user_vibe_id is not None
        result.append(post_response)

    return PaginatedResponse(
        items=result,
        total_count=total_count,
        page=pagination.page,
        size=pagination.size,
        total_pages=math.ceil(total_count / pagination.size)
    )

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(post: PostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new post. Requires the user to be logged in."""
    new_post = Post(**post.model_dump(), user_id=current_user.id)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    # Construct the response, ensuring all fields are included
    display_name = "UOL Student" if new_post.is_anonymous else current_user.first_name
    post_response = PostResponse.model_validate(new_post)
    post_response.author.first_name = display_name
    post_response.has_vibed = False # A user cannot have vibed their own post upon creation
    return post_response
