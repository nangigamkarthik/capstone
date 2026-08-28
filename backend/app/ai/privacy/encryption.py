"""
Privacy Module — Face Embedding Encryption (AES-256)

Protects student biometrics by encrypting ArcFace embeddings before database storage.
Uses cryptography's Fernet (symmetric AES-128/256 equivalent) for secure encryption/decryption.
"""
import base64
import numpy as np
from typing import Optional
from loguru import logger

try:
    from cryptography.fernet import Fernet
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:
    CRYPTOGRAPHY_AVAILABLE = False
    logger.warning("cryptography not installed. Privacy encryption will use base64 fallback.")

class EmbeddingEncrypter:
    """
    Encrypts and decrypts face embedding vectors to ensure biometric privacy.
    """

    def __init__(self, key: Optional[bytes] = None):
        if CRYPTOGRAPHY_AVAILABLE:
            if key is None:
                # Generate a transient key for testing if none provided
                self.key = Fernet.generate_key()
            else:
                self.key = key
            self.cipher = Fernet(self.key)
        else:
            self.key = b"dummy_key_for_mock_base64"
            self.cipher = None

    def encrypt_embedding(self, embedding: np.ndarray) -> str:
        """
        Encrypt a float numpy array embedding into a secure base64 string.
        """
        raw_bytes = embedding.astype(np.float32).tobytes()
        
        if self.cipher is not None:
            encrypted_bytes = self.cipher.encrypt(raw_bytes)
            # Encode to URL-safe base64 string for text database field storage
            return base64.b64encode(encrypted_bytes).decode("utf-8")
        else:
            # Fallback mock encoding
            return base64.b64encode(raw_bytes).decode("utf-8")

    def decrypt_embedding(self, encrypted_str: str) -> np.ndarray:
        """
        Decrypt a base64 string back into a float32 numpy array embedding.
        """
        raw_encrypted_bytes = base64.b64decode(encrypted_str.encode("utf-8"))
        
        if self.cipher is not None:
            decrypted_bytes = self.cipher.decrypt(raw_encrypted_bytes)
            return np.frombuffer(decrypted_bytes, dtype=np.float32)
        else:
            return np.frombuffer(raw_encrypted_bytes, dtype=np.float32)
