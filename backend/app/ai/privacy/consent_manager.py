"""
Privacy Module — Consent Manager

Manages student consent options (opt-in/opt-out of facial recognition/video storage).
Coordinates with the face anonymizer to blur non-consented student faces.
"""
from typing import Dict, Set
from loguru import logger

class PrivacyConsentManager:
    """
    Tracks and checks privacy consent configurations per student.
    
    A student can:
    - OPT-IN (full analytics + face recognition + video streaming allowed)
    - OPT-OUT (face must be anonymized, no bio data stored, general pose analytics allowed)
    """

    def __init__(self):
        # Maps student_id (int) -> consent status (bool: True = opt-in, False = opt-out)
        self._consents: Dict[int, bool] = {}

    def set_consent(self, student_id: int, consented: bool):
        """Update student consent preference."""
        self._consents[student_id] = consented
        logger.info(f"Student {student_id} privacy consent set to: {'OPT-IN' if consented else 'OPT-OUT'}")

    def has_consent(self, student_id: int) -> bool:
        """Check if student has given video storage consent. Default is False (Privacy-first)."""
        return self._consents.get(student_id, False)

    def get_consented_ids(self) -> Set[int]:
        """Return the set of all track/student IDs who have opted-in."""
        return {sid for sid, consented in self._consents.items() if consented}

    def get_anonymize_ids(self, active_track_ids: Set[int]) -> Set[int]:
        """Return the set of active IDs that MUST be anonymized (opted-out)."""
        return active_track_ids - self.get_consented_ids()
