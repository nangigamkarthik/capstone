"""
Emotion Recognition — 7-Class Facial Emotion Classifier

Classifies cropped face ROIs into 7 emotion categories using a
deep learning model (HSEmotion or HuggingFace Transformers).

Classes: happy, neutral, confused, interested, bored, frustrated, surprised

Includes temporal smoothing to avoid jittery per-frame predictions.
"""
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from collections import deque
from loguru import logger

try:
    from transformers import pipeline as hf_pipeline
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False
    logger.warning("transformers not installed. Emotion module will use mock mode.")


EMOTION_CLASSES = ["happy", "neutral", "confused", "interested", "bored", "frustrated", "surprised"]


@dataclass
class EmotionResult:
    """Emotion classification result for one face."""
    probabilities: Dict[str, float]  # emotion → probability
    dominant_emotion: str
    confidence: float                # Probability of dominant emotion
    track_id: int = -1

    def to_dict(self) -> dict:
        return {
            "probabilities": {k: round(v, 4) for k, v in self.probabilities.items()},
            "dominant": self.dominant_emotion,
            "confidence": round(self.confidence, 4),
        }


class EmotionRecognizer:
    """
    7-class facial emotion recognition using HuggingFace Transformers.

    Uses a pre-trained image classification model fine-tuned for facial
    emotion recognition. Falls back to mock predictions without GPU.

    Args:
        model_name: HuggingFace model ID for emotion classification
        device: 'cuda', 'cpu', or -1 for CPU
    """

    # Map FER-2013 standard labels to our custom label set
    LABEL_MAP = {
        "angry": "frustrated",
        "disgust": "frustrated",
        "fear": "confused",
        "happy": "happy",
        "sad": "bored",
        "surprise": "surprised",
        "neutral": "neutral",
    }

    def __init__(
        self,
        model_name: str = "dima806/facial_emotions_image_detection",
        device: int = -1,
    ):
        self.model_name = model_name
        self.classifier: Optional[object] = None
        self._load_model(device)

    def _load_model(self, device: int):
        if not HF_AVAILABLE:
            logger.warning("Running emotion module in MOCK mode.")
            return

        try:
            self.classifier = hf_pipeline(
                "image-classification",
                model=self.model_name,
                device=device,
            )
            logger.info(f"Loaded emotion model: {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to load emotion model: {e}")
            self.classifier = None

    def recognize(self, face_crop: np.ndarray, track_id: int = -1) -> EmotionResult:
        """
        Classify emotion from a face crop.

        Args:
            face_crop: BGR face image (H, W, 3)
            track_id: Associated tracker ID

        Returns:
            EmotionResult with probability distribution over 7 classes
        """
        if self.classifier is None:
            return self._mock_recognize(track_id)

        try:
            from PIL import Image
            # Convert BGR → RGB → PIL
            rgb = face_crop[:, :, ::-1]
            pil_image = Image.fromarray(rgb)

            predictions = self.classifier(pil_image, top_k=7)

            # Map model labels to our emotion classes
            probs: Dict[str, float] = {e: 0.0 for e in EMOTION_CLASSES}
            for pred in predictions:
                label = pred["label"].lower()
                score = pred["score"]
                mapped = self.LABEL_MAP.get(label, "neutral")
                probs[mapped] = max(probs.get(mapped, 0.0), score)

            # Normalize
            total = sum(probs.values())
            if total > 0:
                probs = {k: v / total for k, v in probs.items()}

            dominant = max(probs, key=probs.get)

            return EmotionResult(
                probabilities=probs,
                dominant_emotion=dominant,
                confidence=probs[dominant],
                track_id=track_id,
            )
        except Exception as e:
            logger.error(f"Emotion recognition failed: {e}")
            return self._mock_recognize(track_id)

    def _mock_recognize(self, track_id: int) -> EmotionResult:
        rng = np.random.RandomState(abs(track_id) if track_id >= 0 else 42)
        raw = rng.dirichlet(np.ones(len(EMOTION_CLASSES)))
        probs = dict(zip(EMOTION_CLASSES, raw.tolist()))
        dominant = max(probs, key=probs.get)
        return EmotionResult(
            probabilities=probs, dominant_emotion=dominant,
            confidence=probs[dominant], track_id=track_id,
        )


class EmotionTimeline:
    """
    Temporal emotion smoothing and timeline generation.

    Applies exponential moving average across frames to reduce jitter
    and maintains a history of emotion states per track.
    """

    def __init__(self, window_size: int = 30, alpha: float = 0.2):
        self.window_size = window_size
        self.alpha = alpha
        self._history: Dict[int, deque] = {}
        self._smoothed: Dict[int, Dict[str, float]] = {}

    def update(self, result: EmotionResult) -> EmotionResult:
        """Add new observation and return temporally smoothed result."""
        tid = result.track_id

        if tid not in self._history:
            self._history[tid] = deque(maxlen=self.window_size)
            self._smoothed[tid] = result.probabilities.copy()

        self._history[tid].append(result)

        # EMA update
        smoothed = self._smoothed[tid]
        for emotion in EMOTION_CLASSES:
            current = result.probabilities.get(emotion, 0.0)
            smoothed[emotion] = self.alpha * current + (1 - self.alpha) * smoothed.get(emotion, 0.0)

        self._smoothed[tid] = smoothed
        dominant = max(smoothed, key=smoothed.get)

        return EmotionResult(
            probabilities=smoothed.copy(),
            dominant_emotion=dominant,
            confidence=smoothed[dominant],
            track_id=tid,
        )

    def get_timeline(self, track_id: int) -> List[Tuple[int, str]]:
        """Get emotion history for a track as [(frame_idx, dominant_emotion), ...]."""
        if track_id not in self._history:
            return []
        return [(i, r.dominant_emotion) for i, r in enumerate(self._history[track_id])]

    def cleanup(self, active_ids: set):
        stale = [tid for tid in self._history if tid not in active_ids]
        for tid in stale:
            del self._history[tid]
            self._smoothed.pop(tid, None)
