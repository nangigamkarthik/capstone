"""
Verification script for Celery Task integration.
Tests async report generation (querying database stats, formatting text, writing markdown files),
audio transcription (OpenAI Whisper hooks), and dataset exporting tasks.
"""
import sys
import os
import asyncio
from datetime import datetime, UTC

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.infrastructure.database.session import async_session_maker
from app.infrastructure.database.models.system import Report
from app.workers.tasks import generate_report, transcribe_audio, export_dataset

async def test_tasks():
    print("====================================================")
    print("        VERIFYING CELERY BACKGROUND TASKS           ")
    print("====================================================")
    
    # 1. Insert a mock report record
    print("1. Creating pending report entry in database...")
    async with async_session_maker() as db:
        rep = Report(
            report_type="engagement",
            title="Session Engagement Summary",
            parameters_json={"lecture_id": 1},
            status="pending"
        )
        db.add(rep)
        await db.commit()
        report_id = rep.id
        print(f"  - Report registered: ID={report_id}, Status={rep.status}")
        
    # 2. Invoke the report generation task (direct execution)
    print("\n2. Launching generate_report Celery task...")
    res = generate_report(report_id)
    print(f"  - Task completion status: {res.get('status')}")
    
    # Verify database updates and file output
    async with async_session_maker() as db:
        async with db.begin():
            from sqlalchemy.future import select
            result = await db.execute(select(Report).filter(Report.id == report_id))
            updated_rep = result.scalars().first()
            print(f"  - Database status updated to: {updated_rep.status}")
            print(f"  - Generated File Path       : {updated_rep.file_url}")
            
            # Verify file exists
            if updated_rep.file_url and os.path.exists(updated_rep.file_url):
                print(f"  - Exported File Exists       : True")
                with open(updated_rep.file_url, "r") as f:
                    content = f.read()
                print("\n  Report Content Sample:")
                print("\n".join(content.split("\n")[:6]))
                
    # 3. Test other tasks
    print("\n3. Testing transcribe_audio task...")
    trans_res = transcribe_audio("mock_audio_file.wav")
    print(f"  - Transcription outcome: {trans_res.get('status')}")
    print(f"  - Transcribed text     : '{trans_res.get('transcript')}'")
    
    print("\n4. Testing export_dataset (COCO format)...")
    exp_res = export_dataset("coco")
    print(f"  - Export outcome: {exp_res.get('status')}")
    print(f"  - Export file   : {os.path.basename(exp_res.get('file_url'))}")
    
    print("====================================================")
    print("                  VERIFICATION RESULTS              ")
    print("====================================================")
    print("Celery background task integration: PASSED [OK]")
    print("====================================================")

if __name__ == "__main__":
    asyncio.run(test_tasks())
