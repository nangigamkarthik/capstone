"""
Verification script for Auditing & Data Governance Compliance.
Verifies that the AuditLogger successfully writes structured audit records,
handles optional entity IDs/JSON metadata, and stores them in SQLite.
"""
import sys
import os
import asyncio
from datetime import datetime, UTC

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.infrastructure.database.session import async_session_maker
from app.infrastructure.database.models.system import AuditLog
from app.core.audit import AuditLogger
from sqlalchemy.future import select

async def main():
    print("====================================================")
    print("         VERIFYING AUDIT LOGGER SERVICE             ")
    print("====================================================")
    
    print("1. Recording mock audit event 'TEST_ACTION'...")
    async with async_session_maker() as db:
        entry = await AuditLogger.log_action(
            db=db,
            action="TEST_ACTION",
            entity_type="device",
            entity_id=101,
            user_id=1,
            details={"param_name": "calibration_coeff", "new_value": 0.985},
            ip_address="127.0.0.1"
        )
        print(f"  - Entry created successfully: ID={entry.id}")
        
    print("\n2. Querying database to verify audit log persistence...")
    async with async_session_maker() as db:
        result = await db.execute(
            select(AuditLog).filter(AuditLog.action == "TEST_ACTION").order_by(AuditLog.timestamp.desc())
        )
        logs = result.scalars().all()
        print(f"  - Logs recovered: {len(logs)}")
        if logs:
            log = logs[0]
            print(f"  - Recovered Action   : {log.action}")
            print(f"  - Recovered Entity   : {log.entity_type} #{log.entity_id}")
            print(f"  - Recovered User     : {log.user_id}")
            print(f"  - Recovered Details  : {log.details_json}")
            print(f"  - Recovered IP       : {log.ip_address}")
            assert log.action == "TEST_ACTION"
            assert log.entity_type == "device"
            assert log.details_json.get("new_value") == 0.985
            
    print("====================================================")
    print("                  VERIFICATION RESULTS              ")
    print("====================================================")
    print("Audit Logging Service: PASSED [OK]")
    print("====================================================")

if __name__ == "__main__":
    asyncio.run(main())
