"""
Master Verification Script for Cognitive Classroom Digital Twin Platform.
Runs all verification modules sequentially to assert platform stability, database,
privacies, machine learning, camera streaming, federated authentication, and background workers.
"""
import sys
import os
import asyncio
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

# Import verification entrypoints
import scripts.verify_camera as verify_camera
import scripts.verify_oidc as verify_oidc
import scripts.verify_tasks as verify_tasks
import scripts.verify_research as verify_research
import scripts.verify_realtime as verify_realtime
import scripts.verify_audit as verify_audit

async def run_all():
    print("================================================================")
    print("       COGNITIVE CLASSROOM MASTER SYSTEM VERIFICATION SUITE     ")
    print("================================================================")
    
    results = {}
    
    # 1. Verify Camera Streams
    print("\n[TEST 1/6] Testing Physical Camera RTSP / WebRTC Stream Reader...")
    try:
        verify_camera.main()
        results["Camera Streams"] = "PASS [OK]"
    except Exception as e:
        print(f"  - FAILED: {str(e)}")
        results["Camera Streams"] = "FAIL [ERROR]"
        
    # 2. Verify Federated Identity Provider (OIDC)
    print("\n[TEST 2/6] Testing Federated OIDC Identity Provider...")
    try:
        await verify_oidc.main()
        results["OIDC Identity"] = "PASS [OK]"
    except Exception as e:
        print(f"  - FAILED: {str(e)}")
        results["OIDC Identity"] = "FAIL [ERROR]"
        
    # 3. Verify Background Celery Tasks
    print("\n[TEST 3/6] Testing Celery Background Tasks & Exporters...")
    try:
        await verify_tasks.test_tasks()
        results["Celery Workers"] = "PASS [OK]"
    except Exception as e:
        print(f"  - FAILED: {str(e)}")
        results["Celery Workers"] = "FAIL [ERROR]"
        
    # 4. Verify Biometric Privacy & Research Suite
    print("\n[TEST 4/6] Testing Encryption, Consent Manager & plots...")
    try:
        verify_research.main()
        results["Privacy & Research"] = "PASS [OK]"
    except Exception as e:
        print(f"  - FAILED: {str(e)}")
        results["Privacy & Research"] = "FAIL [ERROR]"
        
    # 5. Verify Streamer & WebSocket Live Broadcasting
    print("\n[TEST 5/6] Testing Real-Time Streamer & Live Database snapshot loop...")
    try:
        await verify_realtime.async_main()
        results["Real-Time Streamer"] = "PASS [OK]"
    except Exception as e:
        print(f"  - FAILED: {str(e)}")
        results["Real-Time Streamer"] = "FAIL [ERROR]"

    # 6. Verify System Audit Logging Service
    print("\n[TEST 6/6] Testing System Audit Logger Persistence...")
    try:
        await verify_audit.main()
        results["Audit Logger"] = "PASS [OK]"
    except Exception as e:
        print(f"  - FAILED: {str(e)}")
        results["Audit Logger"] = "FAIL [ERROR]"

    print("\n================================================================")
    print("                    SYSTEM VERIFICATION SUMMARY                 ")
    print("================================================================")
    for component, status in results.items():
        print(f" - {component:<25} : {status}")
    print("================================================================")

if __name__ == "__main__":
    asyncio.run(run_all())
