import sys
from pathlib import Path
from loguru import logger

# Add parent dir to sys.path
sys.path.append(str(Path(__file__).parent.parent))

from app.ai.alerts.engine import AlertEngine, AlertSeverity, AlertCategory

def main():
    logger.info("Starting AlertEngine verification...")
    engine = AlertEngine()
    
    passed = 0
    failed = 0
    
    # 1. Test engagement drop
    alert = engine.evaluate_engagement(student_id=1, student_name="Alice", engagement_score=30.0, lecture_id=101)
    if alert and alert.severity == AlertSeverity.WARNING and alert.category == AlertCategory.ENGAGEMENT:
        logger.info("✅ Engagement drop detection: PASS")
        passed += 1
    else:
        logger.error("❌ Engagement drop detection: FAIL")
        failed += 1
        
    # 2. Test confusion spike
    alert = engine.evaluate_confusion(confused_count=10, total_count=20, lecture_id=101)
    if alert and alert.severity == AlertSeverity.CRITICAL and alert.category == AlertCategory.EMOTION:
        logger.info("✅ Confusion spike detection: PASS")
        passed += 1
    else:
        logger.error("❌ Confusion spike detection: FAIL")
        failed += 1
        
    # 3. Test attendance anomaly
    alert = engine.evaluate_attendance(present=5, expected=10, lecture_id=101)
    if alert and alert.severity == AlertSeverity.WARNING and alert.category == AlertCategory.ATTENDANCE:
        logger.info("✅ Attendance anomaly detection: PASS")
        passed += 1
    else:
        logger.error("❌ Attendance anomaly detection: FAIL")
        failed += 1
        
    # 4. Test risk evaluation
    alert = engine.evaluate_risk(student_id=2, student_name="Bob", risk_score=85.0)
    if alert and alert.severity == AlertSeverity.CRITICAL and alert.category == AlertCategory.PREDICTION:
        logger.info("✅ Risk evaluation: PASS")
        passed += 1
    else:
        logger.error("❌ Risk evaluation: FAIL")
        failed += 1
        
    # 5. Test cooldown mechanism
    alert2 = engine.evaluate_engagement(student_id=1, student_name="Alice", engagement_score=25.0, lecture_id=101)
    if alert2 is None:
        logger.info("✅ Cooldown mechanism: PASS")
        passed += 1
    else:
        logger.error("❌ Cooldown mechanism: FAIL")
        failed += 1
        
    # 6. Test flush alerts
    buffered_alerts = engine.flush_alerts()
    if len(buffered_alerts) == 4 and len(engine._alert_buffer) == 0:
        logger.info("✅ Alert buffer flushing: PASS")
        passed += 1
    else:
        logger.error(f"❌ Alert buffer flushing: FAIL (Expected 4 alerts, got {len(buffered_alerts)})")
        failed += 1
        
    print(f"\nVerification Results: {passed} PASS, {failed} FAIL")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
