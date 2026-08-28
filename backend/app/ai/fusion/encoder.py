"""
Multimodal Fusion Encoder — Encodes individual modalities

Converts heterogenous features (pose, face embedding, gaze, emotion, activity)
into fixed-size embedding representations for the transformer fusion network.
"""
import numpy as np
from typing import Dict, Optional, Tuple
from loguru import logger

class ModalityEncoder:
    """
    Encodes various classroom modalities into high-dimensional vectors.
    
    Modalities:
    - Face: 512-d ArcFace embedding -> projection
    - Pose: 33 keypoints (33 * 4 = 132 features) -> projection
    - Gaze: 3D vector + target classification (one-hot) -> projection
    - Emotion: 7 probabilities -> projection
    - Activity: 11 probabilities -> projection
    
    Outputs a unified feature dimension (e.g., d_model = 128) per modality.
    """
    
    def __init__(self, d_model: int = 128):
        self.d_model = d_model
        # Simple projection weights (simulated neural layers) for mock / lightweight execution
        self.rng = np.random.RandomState(42)
        
        # Linear layer projection weights
        self.w_face = self.rng.randn(512, d_model) / np.sqrt(512)
        self.w_pose = self.rng.randn(132, d_model) / np.sqrt(132)
        self.w_gaze = self.rng.randn(9, d_model) / np.sqrt(9)      # 3D gaze vector + 6 targets (one-hot)
        self.w_emotion = self.rng.randn(7, d_model) / np.sqrt(7)    # 7 emotion probabilities
        self.w_activity = self.rng.randn(11, d_model) / np.sqrt(11) # 11 activity probabilities

    def encode_face(self, face_embedding: Optional[np.ndarray]) -> np.ndarray:
        """Encode 512-d face embedding to d_model space."""
        if face_embedding is None:
            return np.zeros(self.d_model, dtype=np.float32)
        # Normalize and project
        x = face_embedding / (np.linalg.norm(face_embedding) + 1e-8)
        return np.dot(x, self.w_face).astype(np.float32)

    def encode_pose(self, pose_keypoints: Optional[np.ndarray]) -> np.ndarray:
        """Encode (33, 4) pose keypoints to d_model space."""
        if pose_keypoints is None or pose_keypoints.shape != (33, 4):
            return np.zeros(self.d_model, dtype=np.float32)
        x = pose_keypoints.flatten()
        return np.dot(x, self.w_pose).astype(np.float32)

    def encode_gaze(self, gaze_vector: Tuple[float, float, float], target: str) -> np.ndarray:
        """Encode gaze direction and classification target."""
        target_map = {"board": 0, "teacher": 1, "laptop": 2, "phone": 3, "away": 4, "other_student": 5}
        target_idx = target_map.get(target, 4)
        
        one_hot = np.zeros(6, dtype=np.float32)
        one_hot[target_idx] = 1.0
        
        x = np.hstack([gaze_vector, one_hot])
        return np.dot(x, self.w_gaze).astype(np.float32)

    def encode_emotion(self, emotion_probs: Dict[str, float]) -> np.ndarray:
        """Encode emotion probability distribution."""
        emotions = ["happy", "neutral", "confused", "interested", "bored", "frustrated", "surprised"]
        x = np.array([emotion_probs.get(e, 0.0) for e in emotions], dtype=np.float32)
        return np.dot(x, self.w_emotion).astype(np.float32)

    def encode_activity(self, activity_probs: Dict[str, float]) -> np.ndarray:
        """Encode activity probability distribution."""
        activities = ["writing", "reading", "listening", "sleeping", "talking",
                      "using_phone", "raising_hand", "standing", "walking",
                      "collaborating", "using_laptop"]
        x = np.array([activity_probs.get(a, 0.0) for a in activities], dtype=np.float32)
        return np.dot(x, self.w_activity).astype(np.float32)
