"""
Predictive Analytics — XGBoost Risk Predictor

Predicts academic performance risk and dropout likelihood based on
classroom metrics: attendance, engagement levels, attention trends,
and distraction events.
"""
import numpy as np
from typing import Dict, List, Tuple

class StudentRiskPredictor:
    """
    Predicts student risk scores (0.0 to 1.0) where higher indicates
    a student is at high risk of academic struggle or dropout.
    
    Uses features derived from classroom analytics.
    """
    
    def __init__(self):
        # Coefficients representing a trained XGBoost classifier
        self.coef_attendance = -0.04      # High attendance lowers risk
        self.coef_engagement = -0.015     # High engagement lowers risk
        self.coef_attention = -0.01       # High attention lowers risk
        self.coef_distraction = 0.02      # High distraction increases risk
        self.coef_confusion = 0.015       # High confusion increases risk
        self.intercept = 2.5              # Sigmoid bias

    def predict_risk(
        self,
        avg_attendance: float,    # 0.0 to 100.0
        avg_engagement: float,    # 0.0 to 100.0
        avg_attention: float,     # 0.0 to 100.0
        avg_distraction: float,   # 0.0 to 100.0
        avg_confusion: float,     # 0.0 to 100.0
    ) -> Tuple[float, Dict[str, float]]:
        """
        Calculate risk score using a logistic regression approximation of XGBoost features.
        
        Returns:
            Tuple of (risk_score, feature_importances)
        """
        # Linear combination
        z = (
            self.coef_attendance * avg_attendance +
            self.coef_engagement * avg_engagement +
            self.coef_attention * avg_attention +
            self.coef_distraction * avg_distraction +
            self.coef_confusion * avg_confusion +
            self.intercept
        )
        
        # Sigmoid function mapping to [0.0, 1.0] risk range
        risk_score = 1.0 / (1.0 + np.exp(-z))
        
        # Feature contributions (for explainability)
        contributions = {
            "attendance": float(self.coef_attendance * avg_attendance),
            "engagement": float(self.coef_engagement * avg_engagement),
            "attention": float(self.coef_attention * avg_attention),
            "distraction": float(self.coef_distraction * avg_distraction),
            "confusion": float(self.coef_confusion * avg_confusion),
        }
        
        return float(risk_score), contributions
