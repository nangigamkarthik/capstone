"""
Classroom Environment Analyzer — Lighting, Noise, Occupancy

Estimates environmental conditions from video frames and audio data:
- Lighting level (frame brightness analysis)
- Noise level (audio RMS energy)
- Occupancy and seat utilization
- Overall environmental quality score
"""
import numpy as np
from dataclasses import dataclass
from typing import Optional, Tuple
from loguru import logger


@dataclass
class EnvironmentMetrics:
    """Classroom environment state at a point in time."""
    lighting: float        # 0-100 (brightness level)
    noise: float           # 0-100 (noise level)
    occupancy: int         # Number of people detected
    capacity: int          # Room capacity
    utilization: float     # occupancy / capacity
    temperature: Optional[float] = None  # °C (if sensor available)
    quality_score: float = 0.0  # Overall composite 0-100

    def to_dict(self) -> dict:
        return {
            "lighting": round(self.lighting, 1),
            "noise": round(self.noise, 1),
            "occupancy": self.occupancy,
            "capacity": self.capacity,
            "utilization": round(self.utilization, 3),
            "quality_score": round(self.quality_score, 1),
        }


class EnvironmentAnalyzer:
    """
    Analyzes classroom environmental conditions from video and audio.

    Computes a composite quality score weighted across lighting,
    noise, and occupancy comfort factors.

    Args:
        capacity: Room capacity
        ideal_lighting: Ideal brightness (0-255 mean pixel value)
        ideal_noise: Ideal noise level (RMS threshold)
        weights: (lighting_w, noise_w, occupancy_w) for composite score
    """

    def __init__(
        self,
        capacity: int = 40,
        ideal_lighting: float = 140.0,
        ideal_noise: float = 0.02,
        weights: Tuple[float, float, float] = (0.3, 0.4, 0.3),
    ):
        self.capacity = capacity
        self.ideal_lighting = ideal_lighting
        self.ideal_noise = ideal_noise
        self.weights = weights

    def analyze(
        self,
        frame: Optional[np.ndarray] = None,
        audio_chunk: Optional[np.ndarray] = None,
        occupancy_count: int = 0,
    ) -> EnvironmentMetrics:
        """
        Analyze current environment state.

        Args:
            frame: BGR video frame for lighting analysis
            audio_chunk: Audio samples (float32, [-1, 1]) for noise analysis
            occupancy_count: Number of detected persons

        Returns:
            EnvironmentMetrics with all computed values
        """
        lighting = self._analyze_lighting(frame) if frame is not None else 50.0
        noise = self._analyze_noise(audio_chunk) if audio_chunk is not None else 30.0
        utilization = occupancy_count / self.capacity if self.capacity > 0 else 0.0

        # Composite quality score
        lighting_score = 100 - abs(lighting - 70) * 1.5  # Optimal around 70
        noise_score = max(0, 100 - noise * 1.2)           # Lower noise = better
        occupancy_score = 100 - abs(utilization - 0.7) * 100  # Optimal at ~70% full

        quality = (
            self.weights[0] * max(0, min(100, lighting_score))
            + self.weights[1] * max(0, min(100, noise_score))
            + self.weights[2] * max(0, min(100, occupancy_score))
        )

        return EnvironmentMetrics(
            lighting=lighting,
            noise=noise,
            occupancy=occupancy_count,
            capacity=self.capacity,
            utilization=utilization,
            quality_score=max(0, min(100, quality)),
        )

    def _analyze_lighting(self, frame: np.ndarray) -> float:
        """Compute lighting level from frame brightness (0-100 scale)."""
        try:
            import cv2
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        except ImportError:
            # Fallback: approximate grayscale via channel averaging
            gray = frame.mean(axis=2)

        mean_brightness = float(gray.mean())
        # Map 0-255 → 0-100
        return min(100.0, (mean_brightness / 255.0) * 100.0)

    def _analyze_noise(self, audio_chunk: np.ndarray) -> float:
        """Compute noise level from audio RMS energy (0-100 scale)."""
        if len(audio_chunk) == 0:
            return 0.0

        rms = float(np.sqrt(np.mean(audio_chunk.astype(np.float64) ** 2)))

        # Map RMS (typically 0.0 - 0.5 range) to 0-100
        noise_level = min(100.0, (rms / 0.3) * 100.0)
        return noise_level

    def update_capacity(self, new_capacity: int):
        """Update room capacity."""
        self.capacity = max(1, new_capacity)
        logger.info(f"Updated room capacity to {self.capacity}")
