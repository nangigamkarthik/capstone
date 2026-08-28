"""
Predictive Analytics Forecaster Orchestrator

Integrates the temporal forecaster and risk model to generate cohesive
student prediction profiles with confidence ratings and explanation factors.
"""
from typing import Dict, List, Tuple, Optional
from app.ai.prediction.temporal_model import TemporalForecaster
from app.ai.prediction.risk_model import StudentRiskPredictor

class PredictiveForecaster:
    """
    Orchestrates time-series forecasts and academic risk predictions,
    returning structured schema-aligned output format.
    """
    
    def __init__(self):
        self.temporal_forecaster = TemporalForecaster()
        self.risk_predictor = StudentRiskPredictor()

    def generate_predictions(
        self,
        student_id: int,
        engagement_history: List[float],
        attention_history: List[float],
        distraction_history: List[float],
        confusion_history: List[float],
        attendance_rate: float = 95.0,
    ) -> Dict:
        """
        Generate integrated predictions for a student.
        """
        avg_eng = sum(engagement_history) / len(engagement_history) if engagement_history else 70.0
        avg_att = sum(attention_history) / len(attention_history) if attention_history else 70.0
        avg_dist = sum(distraction_history) / len(distraction_history) if distraction_history else 15.0
        avg_conf = sum(confusion_history) / len(confusion_history) if confusion_history else 5.0
        
        # 1. Compute academic risk
        risk_score, contributions = self.risk_predictor.predict_risk(
            avg_attendance=attendance_rate,
            avg_engagement=avg_eng,
            avg_attention=avg_att,
            avg_distraction=avg_dist,
            avg_confusion=avg_conf,
        )
        
        # 2. Forecast next 15 minutes of engagement
        forecasted_engagement = self.temporal_forecaster.forecast(engagement_history)
        
        # 3. Determine if an attention drop alert is needed
        # Alert if forecasted engagement falls below 50.0 in the next 10 mins
        attention_drop_warning = any(f < 45.0 for f in forecasted_engagement[:10])
        
        return {
            "student_id": student_id,
            "academic_risk": round(risk_score * 100.0, 1),  # Convert to percent
            "risk_level": "high" if risk_score > 0.7 else "medium" if risk_score > 0.4 else "low",
            "forecasted_engagement": forecasted_engagement,
            "attention_drop_alert": attention_drop_warning,
            "contributions": contributions,
        }
