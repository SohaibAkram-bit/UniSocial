from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timedelta, timezone

from db.connection import Base


class User(Base):
    """
    Stores every registered student.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    posts = relationship("Post", back_populates="author")
    replies = relationship("Reply", back_populates="author")


class Post(Base):
    """
    Stores every post made by a student.
    """
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    vibe_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc) + timedelta(days=7))

    # Relationships
    author = relationship("User", back_populates="posts")
    replies = relationship("Reply", back_populates="post")
    vibes = relationship("Vibe", back_populates="post", cascade="all, delete-orphan")


class Vibe(Base):
    """
    Tracks which user vibed (upvoted) which post.
    Uses a composite primary key to ensure a user can only vibe a post once.
    """
    __tablename__ = "vibes"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    post = relationship("Post", back_populates="vibes")


class Reply(Base):
    """
    Stores replies to posts.
    """
    __tablename__ = "replies"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    post = relationship("Post", back_populates="replies")
    author = relationship("User", back_populates="replies")