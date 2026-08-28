"""
Speech Intelligence — Whisper Lecture Transcriber

Transcribes speech audio streams or chunks using OpenAI's Whisper model.
Supports both streaming (simulated chunk processing) and batch audio transcription.
"""
import numpy as np
from typing import Optional, Dict
from loguru import logger

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    logger.warning("whisper not installed. Speech module will use mock mode.")

class WhisperTranscriber:
    """
    Handles Whisper-based audio transcription.
    
    Args:
        model_size: Size of Whisper model ('tiny', 'base', 'small', 'medium', 'large')
        device: 'cuda', 'cpu', or 'auto'
    """

    def __init__(self, model_size: str = "base", device: str = "auto"):
        self.model_size = model_size
        self.device = device
        self.model = None
        self._load_model()

    def _load_model(self):
        if not WHISPER_AVAILABLE:
            return
        try:
            import torch
            if self.device == "auto":
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model = whisper.load_model(self.model_size, device=self.device)
            logger.info(f"Loaded Whisper model: {self.model_size} on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load Whisper: {e}")
            self.model = None

    def transcribe(self, audio_data: np.ndarray, sampling_rate: int = 16000) -> str:
        """
        Transcribe an audio chunk (float32 numpy array).
        """
        if self.model is None:
            return self._mock_transcribe()
            
        try:
            # Whisper expects 16kHz audio
            if sampling_rate != 16000:
                logger.warning(f"Audio sampling rate is {sampling_rate}Hz. Whisper expects 16000Hz.")
                
            # Run Whisper inference
            result = self.model.transcribe(audio_data.astype(np.float32), fp16=False)
            return result.get("text", "").strip()
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            return self._mock_transcribe()

    def _mock_transcribe(self) -> str:
        # Return simulated transcription texts for testing/demo
        import random
        phrases = [
            "Today we will study gradient descent.",
            "Please turn to page forty two in your textbook.",
            "Does anyone know why we use learning rates?",
            "Remember that overfitting happens when the model memorizes noise.",
            "Let's form groups of three and discuss this problem.",
            "The final exam will cover backpropagation and transformers."
        ]
        return random.choice(phrases)
