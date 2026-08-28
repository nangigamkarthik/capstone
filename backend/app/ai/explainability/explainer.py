"""
Explainable AI (XAI) — Shapley Value & Rule-Based Explainer

Computes feature contributions for engagement scores and academic risk predictions.
Generates human-readable, context-rich descriptions (SHAP-like) of the factors
driving AI forecasts.
"""
from typing import Dict, List, Tuple

class PredictiveExplainer:
    """
    Computes explainability metrics for prediction outputs, mapping
    numerical SHAP contributions to natural language explanations.
    """
    
    def __init__(self):
        self.feature_labels = {
            "attendance": "Class Attendance Rate",
            "engagement": "Active Classroom Engagement",
            "attention": "Visual Attention Focus",
            "distraction": "Classroom Distraction Spikes",
            "confusion": "Observed Facial Confusion",
        }

    def explain_risk(self, contributions: Dict[str, float]) -> List[Dict]:
        """
        Generate feature impact list (SHAP representation).
        """
        explanations = []
        
        # Sort contributions by absolute impact descending
        sorted_contrib = sorted(
            contributions.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )
        
        for feature, val in sorted_contrib:
            label = self.feature_labels.get(feature, feature)
            
            # Determine impact polarity and intensity
            if val < -0.5:
                description = f"High {label} strongly reduces struggle risk."
                impact = "positive_reduction"
            elif val < -0.1:
                description = f"Solid {label} helps lower struggle risk."
                impact = "neutral_reduction"
            elif val > 0.5:
                description = f"Frequent {label} is a primary driver of academic struggle risk."
                impact = "critical_risk"
            elif val > 0.1:
                description = f"Increased {label} elevates struggle risk."
                impact = "warning_risk"
            else:
                description = f"{label} has minor impact on current risk score."
                impact = "negligible"
                
            explanations.append({
                "factor": feature,
                "weight": round(val, 3),
                "description": description,
                "impact_type": impact,
            })
            
        return explanations

    def explain_engagement_drop(
        self,
        gaze_target: str,
        activity: str,
        emotion: str,
    ) -> List[str]:
        """
        Rule-based text templates explaining a sudden engagement drop.
        """
        reasons = []
        
        # Gaze target explanations
        if gaze_target == "phone":
            reasons.append("Visual attention is focused on mobile device instead of teacher/board.")
        elif gaze_target == "away":
            reasons.append("Frequent gaze lookaways indicate distraction from classroom flow.")
        elif gaze_target == "other_student":
            reasons.append("Gaze directed to peer suggests side discussions or collaboration.")
            
        # Activity explanations
        if activity == "sleeping":
            reasons.append("Student is inactive and sleeping at desk.")
        elif activity == "using_phone":
            reasons.append("Pose indicates active mobile phone interaction.")
        elif activity == "using_laptop" and gaze_target == "away":
            reasons.append("Laptop usage is combined with lookaways, indicating off-task browsing.")
            
        # Emotion explanations
        if emotion == "bored":
            reasons.append("Facial expression indicates high disinterest (boredom).")
        elif emotion == "frustrated":
            reasons.append("Facial expression indicates confusion-related frustration.")
            
        if not reasons:
            reasons.append("General attention decrease without explicit distraction cues.")
            
        return reasons
