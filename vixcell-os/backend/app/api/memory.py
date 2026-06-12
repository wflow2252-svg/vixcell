"""
Assistant memory endpoints — what the assistant knows about the user.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.memory import AssistantMemory
from app.models.user import User

router = APIRouter()

MAX_MEMORIES = 200


class MemoryIn(BaseModel):
    content: str
    source: str = "voice"


@router.get("/")
def list_memories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items = (
        db.query(AssistantMemory)
        .filter(AssistantMemory.tenant_id == current_user.tenant_id)
        .order_by(AssistantMemory.created_at.desc())
        .limit(MAX_MEMORIES)
        .all()
    )
    return {"items": [
        {"id": m.id, "content": m.content, "source": m.source,
         "created_at": m.created_at.isoformat() if m.created_at else None}
        for m in items
    ]}


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_memory(
    body: MemoryIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="content is required")
    m = AssistantMemory(tenant_id=current_user.tenant_id, content=content, source=body.source)
    db.add(m)
    db.commit()
    db.refresh(m)
    return {"id": m.id, "content": m.content}


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(
    memory_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    m = db.query(AssistantMemory).filter(
        AssistantMemory.id == memory_id,
        AssistantMemory.tenant_id == current_user.tenant_id,
    ).first()
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    db.delete(m)
    db.commit()
    return None


def recent_memory_texts(db: Session, tenant_id: str, limit: int = 25) -> list:
    """Newest-first memory contents — fed into the LLM chat context."""
    rows = (
        db.query(AssistantMemory.content)
        .filter(AssistantMemory.tenant_id == tenant_id)
        .order_by(AssistantMemory.created_at.desc())
        .limit(limit)
        .all()
    )
    return [r[0] for r in rows]
