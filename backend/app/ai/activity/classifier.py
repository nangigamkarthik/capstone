"""
Activity Recognition — Pose-Based Student Activity Classifier

Classifies student activities from temporal pose keypoint features using
a combination of heuristic rules (high-confidence triggers) and a learned
classifier (XGBoost/LightGBM) for nuanced predictions.

Activities: writing, reading, listening, sleeping, talking, using_phone,
            raising_hand, standing, walking, collaborating, using_laptop
"""
import numpy as np
from dataclasses import dataclass
from typing import List, Optional, Dict
from loguru import logger

from app.ai.pose.estimator import PoseResult, PoseHistory


ACTIVITY_CLASSES = [
    "writing", "reading", "listening", "sleeping", "talking",
    "using_phone", "raising_hand", "standing", "walking",
    "collaborating", "using_laptop",
]


@dataclass
class ActivityResult:
    """Activity classification result for one person."""
    activity: str            # Predicted activity label
    confidence: float
    probabilities: Dict[str, float]
    track_id: int = -1
    source: str = "heuristic"  # 'heuristic' or 'model'

    def to_dict(self) -> dict:
        return {
            "activity": self.activity,
            "confidence": round(self.confidence, 4),
            "source": self.source,
        }


class ActivityClassifier:
    """
    Classifies student activities from pose sequences using rule-based
    heuristics and optional learned model.

    Heuristic rules provide high-recall detection for unambiguous poses
    (hand raised, sleeping, standing). A trained model handles
    subtler distinctions (writing vs reading vs using_laptop).

    Args:
        use_model: Whether to use a trained classifier (requires model file)
        model_path: Path to serialized XGBoost/LightGBM model
    """

    # Keypoint indices for heuristic rules (MediaPipe BlazePose)
    NOSE = 0
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28

    def __init__(self, use_model: bool = False, model_path: Optional[str] = None):
        self.use_model = use_model
        self.model = None

        if use_model and model_path:
            self._load_model(model_path)

    def _load_model(self, path: str):
        try:
            import joblib
            self.model = joblib.load(path)
            logger.info(f"Loaded activity classifier from {path}")
        except Exception as e:
            logger.error(f"Failed to load activity model: {e}. Using heuristics only.")
            self.model = None

    def classify(
        self,
        pose: PoseResult,
        pose_history: Optional[PoseHistory] = None,
    ) -> ActivityResult:
        """
        Classify current activity from pose and optional history.

        Priority: heuristic rules first (high-confidence triggers),
        then model-based classification for ambiguous cases.
        """
        kps = pose.to_array()  # (33, 4) → [x, y, z, visibility]

        # ─── Heuristic Rules (high-confidence triggers) ───

        # HAND RAISED: either wrist above corresponding shoulder
        left_raised = kps[self.LEFT_WRIST, 1] < kps[self.LEFT_SHOULDER, 1] - 0.05
        right_raised = kps[self.RIGHT_WRIST, 1] < kps[self.RIGHT_SHOULDER, 1] - 0.05
        if left_raised or right_raised:
            return ActivityResult(
                activity="raising_hand", confidence=0.92,
                probabilities={"raising_hand": 0.92}, track_id=pose.track_id,
                source="heuristic",
            )

        # SLEEPING: head (nose) very low, near or below hip level
        nose_y = kps[self.NOSE, 1]
        hip_y = (kps[self.LEFT_HIP, 1] + kps[self.RIGHT_HIP, 1]) / 2
        shoulder_y = (kps[self.LEFT_SHOULDER, 1] + kps[self.RIGHT_SHOULDER, 1]) / 2
        if nose_y > hip_y - 0.05:
            return ActivityResult(
                activity="sleeping", confidence=0.88,
                probabilities={"sleeping": 0.88}, track_id=pose.track_id,
                source="heuristic",
            )

        # STANDING: hips are much higher in frame (low y = high in image)
        if hip_y < 0.35:
            return ActivityResult(
                activity="standing", confidence=0.85,
                probabilities={"standing": 0.85}, track_id=pose.track_id,
                source="heuristic",
            )

        # PHONE USAGE: wrist near face level but hands close together and low
        wrist_avg_y = (kps[self.LEFT_WRIST, 1] + kps[self.RIGHT_WRIST, 1]) / 2
        wrist_spread = abs(kps[self.LEFT_WRIST, 0] - kps[self.RIGHT_WRIST, 0])
        if wrist_avg_y > shoulder_y and wrist_avg_y < hip_y and wrist_spread < 0.15:
            return ActivityResult(
                activity="using_phone", confidence=0.78,
                probabilities={"using_phone": 0.78}, track_id=pose.track_id,
                source="heuristic",
            )

        # WRITING: wrists below shoulders, near desk level, with hand motion
        if wrist_avg_y > shoulder_y + 0.1:
            # Check for motion if history available
            if pose_history:
                velocity = pose_history.get_velocity(pose.track_id)
                if velocity is not None:
                    wrist_velocity = np.linalg.norm(velocity[[self.LEFT_WRIST, self.RIGHT_WRIST], :2])
                    if wrist_velocity > 0.02:
                        return ActivityResult(
                            activity="writing", confidence=0.75,
                            probabilities={"writing": 0.75}, track_id=pose.track_id,
                            source="heuristic",
                        )

        # ─── Model-based classification ───

        if self.model is not None:
            features = self._extract_features(kps, pose_history, pose.track_id)
            try:
                probs = self.model.predict_proba([features])[0]
                prob_dict = dict(zip(ACTIVITY_CLASSES, probs.tolist()))
                predicted = ACTIVITY_CLASSES[np.argmax(probs)]
                return ActivityResult(
                    activity=predicted, confidence=float(np.max(probs)),
                    probabilities=prob_dict, track_id=pose.track_id,
                    source="model",
                )
            except Exception as e:
                logger.error(f"Model prediction failed: {e}")

        # ─── Default: listening ───
        return ActivityResult(
            activity="listening", confidence=0.60,
            probabilities={"listening": 0.60}, track_id=pose.track_id,
            source="heuristic",
        )

    def _extract_features(
        self, kps: np.ndarray,
        pose_history: Optional[PoseHistory],
        track_id: int,
    ) -> np.ndarray:
        """
        Extract feature vector for the learned classifier.

        Features:
        - Joint angles (shoulder, elbow, hip)
        - Relative positions (wrist-to-shoulder, nose-to-hip)
        - Motion features (velocity magnitudes from history)
        - Pose compactness (bounding area of keypoints)
        """
        features = []

        # Relative positions (12 features)
        for pair in [(self.LEFT_WRIST, self.LEFT_SHOULDER),
                     (self.RIGHT_WRIST, self.RIGHT_SHOULDER),
                     (self.NOSE, self.LEFT_HIP),
                     (self.NOSE, self.RIGHT_HIP),
                     (self.LEFT_ELBOW, self.LEFT_SHOULDER),
                     (self.RIGHT_ELBOW, self.RIGHT_SHOULDER)]:
            diff = kps[pair[0], :2] - kps[pair[1], :2]
            features.extend(diff.tolist())

        # Joint angles (3 features)
        for (a, b, c) in [(self.LEFT_SHOULDER, self.LEFT_ELBOW, self.LEFT_WRIST),
                          (self.RIGHT_SHOULDER, self.RIGHT_ELBOW, self.RIGHT_WRIST),
                          (self.LEFT_HIP, self.LEFT_SHOULDER, self.NOSE)]:
            v1 = kps[a, :2] - kps[b, :2]
            v2 = kps[c, :2] - kps[b, :2]
            cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)
            features.append(float(np.arccos(np.clip(cos_angle, -1, 1))))

        # Pose compactness (2 features)
        visible = kps[kps[:, 3] > 0.3, :2]
        if len(visible) > 2:
            bbox_area = (visible[:, 0].max() - visible[:, 0].min()) * (visible[:, 1].max() - visible[:, 1].min())
            features.append(float(bbox_area))
            features.append(float(np.std(visible, axis=0).mean()))
        else:
            features.extend([0.0, 0.0])

        # Motion features (4 features)
        if pose_history:
            velocity = pose_history.get_velocity(track_id)
            if velocity is not None:
                features.append(float(np.linalg.norm(velocity.mean(axis=0))))
                features.append(float(np.linalg.norm(velocity[[self.LEFT_WRIST, self.RIGHT_WRIST]].mean(axis=0))))
                features.append(float(np.linalg.norm(velocity[self.NOSE])))
                features.append(float(velocity[:, :2].std()))
            else:
                features.extend([0.0] * 4)
        else:
            features.extend([0.0] * 4)

        return np.array(features, dtype=np.float32)
