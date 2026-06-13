from app.core.database import Base
from app.models.tenant import Tenant
from app.models.user import User, RefreshToken
from app.models.audit import AuditLog
from app.models.lead import Lead
from app.models.deal import Deal, CRMActivity
from app.models.social import SocialMediaAccount, ScheduledPost
from app.models.knowledge import KnowledgeBase, DocumentChunk
from app.models.workflow import Workflow
from app.models.voice import VoiceLog
from app.models.integration import IntegrationConfig
from app.models.memory import AssistantMemory
from app.models.whatsapp import WaContact, WaMessage
from app.models.core import InteractionLog

# Expose metadata for alembic migrations
metadata = Base.metadata
