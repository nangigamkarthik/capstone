from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any
from datetime import datetime
from app.core.constants import PredictionType

class ExplanationFactor(BaseModel):
    factor: str
    weight: float
    description: str

class PredictionResponse(BaseModel):
    id: int
    student_id: int
    lecture_id: int
    timestamp: datetime
    prediction_type: PredictionType
    value: float
    confidence: float
    explanations_json: List[ExplanationFactor]
    model_version: str

    model_config = ConfigDict(from_attributes=True)

class RiskStudentResponse(BaseModel):
    student_id: int
    student_name: str
    risk_score: float
    risk_factors: List[str]
    predicted_grade_drop: float
