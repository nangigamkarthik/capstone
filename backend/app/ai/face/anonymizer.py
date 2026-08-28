"""
Face Anonymizer — Privacy-preserving face blurring.

Applies Gaussian blur or pixelation to detected face regions
for students who have not given video consent.
"""
import numpy as np
from typing import List, Tuple, Set
from loguru import logger


class FaceAnonymizer:
    """
    Anonymizes faces in frames by blurring or pixelating face regions.

    Args:
        method: 'blur' for Gaussian blur, 'pixelate' for block pixelation
        blur_kernel: Gaussian kernel size (must be odd)
        pixel_size: Block size for pixelation
    """

    def __init__(self, method: str = "blur", blur_kernel: int = 51, pixel_size: int = 10):
        self.method = method
        self.blur_kernel = blur_kernel
        self.pixel_size = pixel_size
        self._exempt_ids: Set[int] = set()  # Track IDs with consent (no anonymization)

    def set_consent_ids(self, consented_ids: Set[int]):
        """Set track IDs that have given video consent and should NOT be blurred."""
        self._exempt_ids = consented_ids

    def anonymize_frame(
        self,
        frame: np.ndarray,
        face_bboxes: List[Tuple[float, float, float, float]],
        track_ids: List[int],
    ) -> np.ndarray:
        """
        Anonymize faces in a frame for non-consented individuals.

        Args:
            frame: BGR image (H, W, 3)
            face_bboxes: List of (x1, y1, x2, y2) face bounding boxes
            track_ids: Corresponding track IDs for each face

        Returns:
            Frame with non-consented faces anonymized
        """
        result = frame.copy()
        h, w = result.shape[:2]

        for bbox, tid in zip(face_bboxes, track_ids):
            if tid in self._exempt_ids:
                continue  # This person has consent

            x1 = max(0, int(bbox[0]))
            y1 = max(0, int(bbox[1]))
            x2 = min(w, int(bbox[2]))
            y2 = min(h, int(bbox[3]))

            if x2 <= x1 or y2 <= y1:
                continue

            roi = result[y1:y2, x1:x2]

            if self.method == "blur":
                try:
                    import cv2
                    roi = cv2.GaussianBlur(roi, (self.blur_kernel, self.blur_kernel), 0)
                except ImportError:
                    # Fallback: simple averaging via numpy
                    roi = np.full_like(roi, roi.mean(axis=(0, 1), dtype=np.uint8))
            elif self.method == "pixelate":
                ph, pw = roi.shape[:2]
                small = roi[::self.pixel_size, ::self.pixel_size]
                roi = np.repeat(np.repeat(small, self.pixel_size, axis=0), self.pixel_size, axis=1)[:ph, :pw]

            result[y1:y2, x1:x2] = roi

        return result
