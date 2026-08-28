from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime

class DashboardStats(BaseModel):
    total_students: int
    active_classes: int
    avg_engagement: float
    avg_attention: float
    attendance_rate: float
    alert_count: int

class TeacherAnalyticsResponse(BaseModel):
    teacher_id: int
    lecture_id: int
    timestamp: datetime
    position_json: Dict[str, float]
    is_speaking: bool
    board_usage: bool
    interaction_count: int
    eye_contact_score: float
    teaching_zone: str
    movement_speed: float

    model_config = ConfigDict(from_attributes=True)

class EnvironmentResponse(BaseModel):
    lecture_id: int
    timestamp: datetime
    lighting_score: float
    noise_level: float
    occupancy: int
    capacity: int
    seat_utilization: float
    density_score: float
    overall_score: float

    model_config = ConfigDict(from_attributes=True)

class HeatmapResponse(BaseModel):
    lecture_id: int
    heatmap_type: str
    data_json: Any
    resolution: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class DatasetPoint(BaseModel):
    label: str
    value: float

class TrendData(BaseModel):
    labels: List[str]
    datasets: List[Dict[str, Any]]
