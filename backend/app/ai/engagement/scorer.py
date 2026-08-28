"""
Engagement Scorer — Attention, Participation, Collaboration Scores

Calculates multidimensional student engagement metrics from fused embeddings,
head orientation, gaze targets, and activity markers. Incorporates
exponential moving averages (EMA) for historical temporal smoothing.
"""
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from collections import deque

@dataclass
class EngagementMetrics:
    """Engagement metrics for a student at a specific timestamp."""
    attention: float       # 0.0 to 100.0 (visual focus)
    engagement: float      # 0.0 to 100.0 (overall active learning)
    participation: float   # 0.0 to 100.0 (raising hand, writing)
    distraction: float     # 0.0 to 100.0 (phone, lookaway)
    confusion: float       # 0.0 to 100.0 (confused facial expression)
    collaboration: float   # 0.0 to 100.0 (collaboration activity / talking)
    overall_score: float   # 0.0 to 100.0 (composite index)

    def to_dict(self) -> dict:
        return {
            "attention": round(self.attention, 1),
            "engagement": round(self.engagement, 1),
            "participation": round(self.participation, 1),
            "distraction": round(self.distraction, 1),
            "confusion": round(self.confusion, 1),
            "collaboration": round(self.collaboration, 1),
            "overall": round(self.overall_score, 1),
        }


class EngagementScorer:
    """
    Computes multidimensional engagement scores for students.
    
    Incorporates:
    - Gaze targets (looking at teacher/board = +attention, looking away/phone = +distraction)
    - Activities (raising hand = +participation, writing = +engagement, sleeping = +distraction)
    - Emotions (interested/happy = +engagement, confused = +confusion, bored/frustrated = -engagement)
    - Temporal EMA smoothing to reduce frame-by-frame fluctuations.
    """
    
    def __init__(self, alpha: float = 0.15, history_size: int = 150):
        self.alpha = alpha  # EMA factor
        self.history_size = history_size
        self._history: Dict[int, deque] = {}
        self._smoothed: Dict[int, EngagementMetrics] = {}

    def score(
        self,
        track_id: int,
        gaze_target: str,
        activity: str,
        dominant_emotion: str,
        emotion_confidence: float,
        fused_embedding: Optional[np.ndarray] = None,
    ) -> EngagementMetrics:
        """
        Compute real-time engagement scores for a student.
        """
        # ─── Heuristic Baseline Weights ───
        
        # 1. Attention (Visual target)
        gaze_map = {
            "teacher": 95.0,
            "board": 90.0,
            "laptop": 75.0,
            "other_student": 55.0,
            "phone": 10.0,
            "away": 15.0,
            "unknown": 50.0
        }
        raw_attention = gaze_map.get(gaze_target, 50.0)
        
        # 2. Distraction (Phone usage or looking away)
        raw_distraction = 0.0
        if gaze_target in ["phone", "away"] or activity == "using_phone":
            raw_distraction = 85.0
        elif activity == "sleeping":
            raw_distraction = 95.0
        elif gaze_target == "other_student":
            raw_distraction = 40.0
        
        # 3. Participation
        raw_participation = 40.0  # Listening baseline
        if activity == "raising_hand":
            raw_participation = 98.0
        elif activity == "talking" or activity == "collaborating":
            raw_participation = 85.0
        elif activity == "writing":
            raw_participation = 75.0
        elif activity == "sleeping":
            raw_participation = 0.0

        # 4. Collaboration
        raw_collaboration = 0.0
        if activity == "collaborating":
            raw_collaboration = 90.0
        elif activity == "talking" and gaze_target == "other_student":
            raw_collaboration = 75.0

        # 5. Confusion (Confused emotion)
        raw_confusion = 0.0
        if dominant_emotion == "confused":
            raw_confusion = 80.0 * emotion_confidence
        elif dominant_emotion == "frustrated":
            raw_confusion = 60.0 * emotion_confidence

        # 6. Active Engagement (Emotional valence + activity alignment)
        emotion_bonus = {
            "interested": 20.0,
            "happy": 15.0,
            "neutral": 5.0,
            "confused": -5.0,
            "frustrated": -15.0,
            "bored": -25.0,
            "surprised": 5.0
        }
        activity_weights = {
            "listening": 65.0,
            "writing": 85.0,
            "reading": 80.0,
            "using_laptop": 70.0,
            "raising_hand": 90.0,
            "collaborating": 85.0,
            "talking": 60.0,
            "sleeping": 5.0,
            "using_phone": 10.0,
            "standing": 50.0,
            "walking": 40.0
        }
        
        base_eng = activity_weights.get(activity, 50.0)
        bonus = emotion_bonus.get(dominant_emotion, 0.0) * emotion_confidence
        raw_engagement = np.clip(base_eng + bonus, 0.0, 100.0)

        # 7. Composite Overall Score
        raw_overall = (
            0.35 * raw_attention +
            0.30 * raw_engagement +
            0.15 * raw_participation +
            0.20 * (100.0 - raw_distraction)
        )
        raw_overall = np.clip(raw_overall, 0.0, 100.0)

        raw_metrics = EngagementMetrics(
            attention=raw_attention,
            engagement=raw_engagement,
            participation=raw_participation,
            distraction=raw_distraction,
            confusion=raw_confusion,
            collaboration=raw_collaboration,
            overall_score=raw_overall,
        )

        # ─── Temporal EMA Smoothing ───
        if track_id not in self._history:
            self._history[track_id] = deque(maxlen=self.history_size)
            self._smoothed[track_id] = raw_metrics
            
        self._history[track_id].append(raw_metrics)
        smoothed = self._smoothed[track_id]
        
        # Apply smoothing index
        smoothed_metrics = EngagementMetrics(
            attention=self.alpha * raw_metrics.attention + (1 - self.alpha) * smoothed.attention,
            engagement=self.alpha * raw_metrics.engagement + (1 - self.alpha) * smoothed.engagement,
            participation=self.alpha * raw_metrics.participation + (1 - self.alpha) * smoothed.participation,
            distraction=self.alpha * raw_metrics.distraction + (1 - self.alpha) * smoothed.distraction,
            confusion=self.alpha * raw_metrics.confusion + (1 - self.alpha) * smoothed.confusion,
            collaboration=self.alpha * raw_metrics.collaboration + (1 - self.alpha) * smoothed.collaboration,
            overall_score=self.alpha * raw_metrics.overall_score + (1 - self.alpha) * smoothed.overall_score,
        )
        
        self._smoothed[track_id] = smoothed_metrics
        return smoothed_metrics

    def get_student_history(self, track_id: int) -> List[EngagementMetrics]:
        if track_id not in self._history:
            return []
        return list(self._history[track_id])

    def cleanup(self, active_ids: set):
        stale = [tid for tid in self._history if tid not in active_ids]
        for tid in stale:
            del self._history[tid]
            self._smoothed.pop(tid, None)
