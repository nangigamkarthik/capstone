from dataclasses import dataclass, field
from datetime import datetime, UTC
from typing import List, Optional, Dict
from enum import Enum
from loguru import logger
import uuid

class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"
    SUCCESS = "success"

class AlertCategory(str, Enum):
    ENGAGEMENT = "engagement"
    ATTENDANCE = "attendance"
    EMOTION = "emotion"
    SYSTEM = "system"
    COPILOT = "copilot"
    PREDICTION = "prediction"

@dataclass
class Alert:
    id: str
    severity: AlertSeverity
    category: AlertCategory
    title: str
    message: str
    timestamp: datetime
    student_id: Optional[int] = None
    lecture_id: Optional[int] = None
    action_url: Optional[str] = None
    metadata: Dict = field(default_factory=dict)

class AlertEngine:
    def __init__(self):
        self._thresholds = {
            'engagement_drop': 40.0,
            'confusion_spike': 0.3,  # 30% of class confused
            'attention_critical': 30.0,
            'risk_score': 70.0,
            'attendance_anomaly': 0.8,  # below 80%
        }
        self._alert_buffer: List[Alert] = []
        self._cooldowns: Dict[str, datetime] = {}  # prevent alert spam
        logger.info('AlertEngine initialized with thresholds: {}', self._thresholds)
        
    def _check_cooldown(self, key: str, cooldown_seconds: int = 60) -> bool:
        now = datetime.now(UTC)
        if key in self._cooldowns:
            if (now - self._cooldowns[key]).total_seconds() < cooldown_seconds:
                return False
        self._cooldowns[key] = now
        return True

    def evaluate_engagement(self, student_id: int, student_name: str, engagement_score: float, lecture_id: int) -> Optional[Alert]:
        if engagement_score < self._thresholds['engagement_drop']:
            key = f"eng_drop_{student_id}_{lecture_id}"
            if self._check_cooldown(key):
                alert = Alert(
                    id=str(uuid.uuid4()),
                    severity=AlertSeverity.WARNING,
                    category=AlertCategory.ENGAGEMENT,
                    title="Low Engagement",
                    message=f"Student {student_name} engagement dropped to {engagement_score}%.",
                    timestamp=datetime.now(UTC),
                    student_id=student_id,
                    lecture_id=lecture_id
                )
                self._alert_buffer.append(alert)
                logger.warning(f"Engagement alert generated for student {student_id}")
                return alert
        return None

    def evaluate_confusion(self, confused_count: int, total_count: int, lecture_id: int) -> Optional[Alert]:
        if total_count == 0:
            return None
        ratio = confused_count / total_count
        if ratio >= self._thresholds['confusion_spike']:
            key = f"conf_spike_{lecture_id}"
            if self._check_cooldown(key):
                alert = Alert(
                    id=str(uuid.uuid4()),
                    severity=AlertSeverity.CRITICAL,
                    category=AlertCategory.EMOTION,
                    title="High Confusion Spike",
                    message=f"{(ratio*100):.1f}% of class is confused.",
                    timestamp=datetime.now(UTC),
                    lecture_id=lecture_id
                )
                self._alert_buffer.append(alert)
                logger.warning(f"Confusion spike alert generated for lecture {lecture_id}")
                return alert
        return None

    def evaluate_attendance(self, present: int, expected: int, lecture_id: int) -> Optional[Alert]:
        if expected == 0:
            return None
        ratio = present / expected
        if ratio < self._thresholds['attendance_anomaly']:
            key = f"att_anomaly_{lecture_id}"
            if self._check_cooldown(key):
                alert = Alert(
                    id=str(uuid.uuid4()),
                    severity=AlertSeverity.WARNING,
                    category=AlertCategory.ATTENDANCE,
                    title="Low Attendance",
                    message=f"Attendance is below 80% ({present}/{expected} students present).",
                    timestamp=datetime.now(UTC),
                    lecture_id=lecture_id
                )
                self._alert_buffer.append(alert)
                logger.warning(f"Attendance anomaly alert generated for lecture {lecture_id}")
                return alert
        return None

    def evaluate_risk(self, student_id: int, student_name: str, risk_score: float) -> Optional[Alert]:
        if risk_score >= self._thresholds['risk_score']:
            key = f"risk_{student_id}"
            if self._check_cooldown(key):
                alert = Alert(
                    id=str(uuid.uuid4()),
                    severity=AlertSeverity.CRITICAL,
                    category=AlertCategory.PREDICTION,
                    title="High Risk Student",
                    message=f"Student {student_name} has a high risk score of {risk_score}.",
                    timestamp=datetime.now(UTC),
                    student_id=student_id
                )
                self._alert_buffer.append(alert)
                logger.warning(f"Risk alert generated for student {student_id}")
                return alert
        return None

    def evaluate_environment(self, lighting: float, noise: float, lecture_id: int) -> Optional[Alert]:
        if lighting < 200 or noise > 80:
            key = f"env_{lecture_id}"
            if self._check_cooldown(key):
                alert = Alert(
                    id=str(uuid.uuid4()),
                    severity=AlertSeverity.INFO,
                    category=AlertCategory.SYSTEM,
                    title="Suboptimal Environment",
                    message=f"Lighting: {lighting} lux, Noise: {noise} dB.",
                    timestamp=datetime.now(UTC),
                    lecture_id=lecture_id
                )
                self._alert_buffer.append(alert)
                logger.info(f"Environment alert generated for lecture {lecture_id}")
                return alert
        return None

    def system_alert(self, title: str, message: str) -> Alert:
        alert = Alert(
            id=str(uuid.uuid4()),
            severity=AlertSeverity.INFO,
            category=AlertCategory.SYSTEM,
            title=title,
            message=message,
            timestamp=datetime.now(UTC)
        )
        self._alert_buffer.append(alert)
        logger.info(f"System alert generated: {title}")
        return alert

    def success_alert(self, title: str, message: str, lecture_id: int = None) -> Alert:
        alert = Alert(
            id=str(uuid.uuid4()),
            severity=AlertSeverity.SUCCESS,
            category=AlertCategory.SYSTEM,
            title=title,
            message=message,
            timestamp=datetime.now(UTC),
            lecture_id=lecture_id
        )
        self._alert_buffer.append(alert)
        logger.info(f"Success alert generated: {title}")
        return alert

    def flush_alerts(self) -> List[Alert]:
        alerts = self._alert_buffer.copy()
        self._alert_buffer.clear()
        return alerts
