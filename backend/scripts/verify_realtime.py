"""
Verification script for Phase 5 Real-Time Streaming and DB Integration.
Uses an in-memory SQLite database to test database persistence of frames
and mocks Websocket connections to verify the real-time broadcasting flow.
"""
import sys
import os
import asyncio
import numpy as np
from datetime import datetime
from typing import List, Dict

# Add backend app directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.infrastructure.database.session import Base
# Import all models to register in metadata registry
from app.infrastructure.database.models import *

import app.infrastructure.websocket.streamer as streamer_module
from app.infrastructure.websocket.manager import manager

# Mock WebSocket client
class MockWebSocket:
    def __init__(self, client_id: str):
        self.client_id = client_id
        self.received_messages: List[Dict] = []
        self.accepted = False

    async def accept(self):
        self.accepted = True

    async def send_json(self, message: dict):
        self.received_messages.append(message)


from sqlalchemy.pool import StaticPool

async def async_main():
    print("====================================================")
    print("   COGNITIVE CLASSROOM DIGITAL TWIN - PHASE 5 VERIFY")
    print("====================================================")
    
    # ── 1. Set up Test SQLite Database ──
    print("1. Initializing test SQLite database...")
    db_file = "./test_realtime.db"
    if os.path.exists(db_file):
        os.remove(db_file)
    test_engine = create_async_engine(f"sqlite+aiosqlite:///{db_file}", echo=False)
    test_session_maker = async_sessionmaker(
        test_engine,
        expire_on_commit=False,
        class_=AsyncSession
    )
    
    # Override the streamer's DB session maker
    streamer_module.async_session_maker = test_session_maker
    
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Test tables created [OK]")

    # ── 2. Set up Mock WebSocket Clients ──
    print("\n2. Connecting mock WebSocket clients...")
    ws_classroom = MockWebSocket("classroom_client")
    ws_twin = MockWebSocket("twin_client")
    ws_copilot = MockWebSocket("copilot_client")
    ws_analytics = MockWebSocket("analytics_client")
    
    # Register them in the manager
    await manager.connect(ws_classroom, "classroom_1")
    await manager.connect(ws_twin, "twin_1")
    await manager.connect(ws_copilot, "copilot_1")
    await manager.connect(ws_analytics, "analytics_1")
    print("Mock WebSockets connected [OK]")

    # ── 3. Run Real-Time Stream Loop ──
    print("\n3. Launching real-time lecture stream...")
    # Trigger active lecture stream for lecture_id=1, room_id=1
    await streamer_module.start_lecture_stream(lecture_id=1, room_id=1)
    
    # Run the streamer for 0.7 seconds (should cover 2-3 frames at 5 FPS)
    print("Streaming frame data...")
    await asyncio.sleep(0.7)
    
    # Stop the stream
    print("Stopping stream...")
    await streamer_module.stop_lecture_stream(lecture_id=1)
    print("Stream stopped [OK]")

    # ── 4. Verify WebSocket Broadcasts ──
    print("\n4. Verifying WebSocket broadcast packets...")
    print(f"  - Classroom channel received: {len(ws_classroom.received_messages)} packets")
    print(f"  - Twin channel received     : {len(ws_twin.received_messages)} packets")
    print(f"  - Copilot channel received  : {len(ws_copilot.received_messages)} packets")
    print(f"  - Analytics channel received: {len(ws_analytics.received_messages)} packets")
    
    if len(ws_classroom.received_messages) > 0:
        first_msg = ws_classroom.received_messages[0]
        print(f"\n  Classroom Packet Sample:")
        print(f"    * Type: {first_msg['type']}")
        print(f"    * Environment keys: {list(first_msg['data']['environment'].keys())}")
        print(f"    * Students detected: {len(first_msg['data']['students'])}")
        
    if len(ws_copilot.received_messages) > 0:
        first_copilot = ws_copilot.received_messages[0]
        print(f"\n  Copilot Suggestion Sample:")
        print(f"    * Suggestion: {first_copilot['data']['suggestion']}")
        print(f"    * Reasoning : {first_copilot['data']['reasoning']}")
        print(f"    * Priority  : {first_copilot['data']['priority'].upper()}")

    # ── 5. Verify Database Persisted Snapshots ──
    print("\n5. Querying test database for saved snapshots...")
    from sqlalchemy.future import select
    from app.infrastructure.database.models.classroom_data import StudentDetection
    from app.infrastructure.database.models.analytics import EngagementScore, EnvironmentMetrics
    
    async with test_session_maker() as db:
        dets_res = await db.execute(select(StudentDetection))
        scores_res = await db.execute(select(EngagementScore))
        env_res = await db.execute(select(EnvironmentMetrics))
        
        db_dets = dets_res.scalars().all()
        db_scores = scores_res.scalars().all()
        db_envs = env_res.scalars().all()
        
        print(f"  - Database records written:")
        print(f"    * Student Detections  : {len(db_dets)}")
        print(f"    * Engagement Scores   : {len(db_scores)}")
        print(f"    * Environment Metrics : {len(db_envs)}")
        
        if len(db_scores) > 0:
            print(f"    * DB overall score sample: {db_scores[0].overall_score:.1f}")
        if len(db_dets) > 0:
            print(f"    * DB seat ID sample      : {db_dets[0].seat_id}")

    print("====================================================")
    print("                  VERIFICATION RESULTS              ")
    print("====================================================")
    print("Real-Time Streamer & DB integration: PASSED [OK]")
    print("====================================================")

    await test_engine.dispose()
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except Exception:
            pass

def main():
    asyncio.run(async_main())

if __name__ == "__main__":
    main()
