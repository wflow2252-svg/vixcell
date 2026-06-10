import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class SocialMediaAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)  # 'facebook', 'instagram', 'whatsapp', 'linkedin', 'tiktok', 'twitter'
    account_name = Column(String(255), nullable=False)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    profile_picture_url = Column(String(512), nullable=True)
    status = Column(String(50), default="active")  # 'active', 'expired', 'disconnected'
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="social_accounts")
    scheduled_posts = relationship("ScheduledPost", back_populates="account", cascade="all, delete-orphan")


class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(String(36), ForeignKey("social_accounts.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    
    # Store list of image/video URLs as JSON: ["https://...", "https://..."]
    media_urls = Column(JSON, nullable=True)
    
    scheduled_time = Column(DateTime, nullable=False)
    status = Column(String(50), default="pending")  # 'pending', 'published', 'failed'
    post_id = Column(String(255), nullable=True)     # Post ID on the destination platform
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    account = relationship("SocialMediaAccount", back_populates="scheduled_posts")
