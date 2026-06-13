import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Project(Base):
    """
    A delivery project. Spec: 'When a deal is won → automatically create a
    project' that stores files, notes, meetings and links. Created either
    automatically from a won Deal or manually.
    """
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    deal_id = Column(String(36), ForeignKey("deals.id", ondelete="SET NULL"), nullable=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(32), default="active")   # active | on_hold | done
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    assets = relationship("ProjectAsset", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")


class ProjectAsset(Base):
    """A file, note, link or meeting attached to a project (spec: Projects store)."""
    __tablename__ = "project_assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String(16), default="note")       # file | note | link | meeting
    title = Column(String(255), nullable=True)
    url = Column(String(1024), nullable=True)        # file path or external link
    body = Column(Text, nullable=True)               # note text
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="assets")
