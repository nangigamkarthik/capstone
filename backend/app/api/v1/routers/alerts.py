from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

from app.ai.alerts.engine import AlertSeverity, AlertCategory, Alert

router = APIRouter()

class AlertResponse(BaseModel):
    id: str
    severity: AlertSeverity
    category: AlertCategory
    title: str
    message: str
    timestamp: datetime
    student_id: Optional[int] = None
    lecture_id: Optional[int] = None
    action_url: Optional[str] = None
    metadata: dict = {}
    is_read: bool = False

_stored_alerts: Dict[str, AlertResponse] = {}

def add_alert(alert: Alert):
    resp = AlertResponse(
        id=alert.id,
        severity=alert.severity,
        category=alert.category,
        title=alert.title,
        message=alert.message,
        timestamp=alert.timestamp,
        student_id=alert.student_id,
        lecture_id=alert.lecture_id,
        action_url=alert.action_url,
        metadata=alert.metadata,
        is_read=False
    )
    _stored_alerts[alert.id] = resp

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    severity: Optional[AlertSeverity] = None,
    category: Optional[AlertCategory] = None,
    limit: int = Query(50, ge=1),
    offset: int = Query(0, ge=0)
):
    results = list(_stored_alerts.values())
    
    if severity:
        results = [a for a in results if a.severity == severity]
    if category:
        results = [a for a in results if a.category == category]
        
    results.sort(key=lambda a: a.timestamp, reverse=True)
    return results[offset:offset+limit]

@router.get("/stats")
def get_alert_stats():
    stats = {
        "total": len(_stored_alerts),
        "by_severity": {s.value: 0 for s in AlertSeverity},
        "by_category": {c.value: 0 for c in AlertCategory},
        "unread": 0
    }
    
    for a in _stored_alerts.values():
        stats["by_severity"][a.severity.value] += 1
        stats["by_category"][a.category.value] += 1
        if not a.is_read:
            stats["unread"] += 1
            
    return stats

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: str):
    if alert_id not in _stored_alerts:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _stored_alerts[alert_id]

@router.post("/{alert_id}/read")
def mark_alert_read(alert_id: str):
    if alert_id not in _stored_alerts:
        raise HTTPException(status_code=404, detail="Alert not found")
    _stored_alerts[alert_id].is_read = True
    return {"status": "ok"}

@router.post("/read-all")
def mark_all_read():
    for a in _stored_alerts.values():
        a.is_read = True
    return {"status": "ok"}

@router.delete("/{alert_id}")
def delete_alert(alert_id: str):
    if alert_id not in _stored_alerts:
        raise HTTPException(status_code=404, detail="Alert not found")
    del _stored_alerts[alert_id]
    return {"status": "ok"}
