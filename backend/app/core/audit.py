"""
Unified Audit Logger Service.
Asynchronously logs critical administrative, privacy, and system mutations to the audit log.
Essential for privacy and data governance compliance (GDPR/FERPA).
"""
from datetime import datetime, UTC
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.infrastructure.database.models.system import AuditLog

class AuditLogger:
    """
    Service for writing structured audit logs to the database.
    """

    @staticmethod
    async def log_action(
        db: AsyncSession,
        action: str,
        entity_type: str,
        entity_id: Optional[int] = None,
        user_id: Optional[int] = None,
        details: Optional[dict] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """
        Record a system or user action to the audit logs.
        """
        try:
            audit_entry = AuditLog(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                details_json=details,
                ip_address=ip_address,
                timestamp=datetime.now(UTC)
            )
            db.add(audit_entry)
            await db.commit()
            logger.info(f"Audit Log Recorded: User={user_id} | Action={action} | Entity={entity_type}#{entity_id}")
            return audit_entry
        except Exception as e:
            logger.error(f"Failed to write audit log: {str(e)}")
            raise e
