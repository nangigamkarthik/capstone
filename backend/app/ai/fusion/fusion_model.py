"""
Multimodal Fusion Model — Cross-Modal Attention Transformer

Fuses encoded feature embeddings from multiple modalities (face, pose, gaze,
emotion, activity) using self-attention and cross-modal attention blocks
to create a unified 128-d state representation of student behavior.
"""
import numpy as np
from typing import Dict, List, Optional, Tuple

class CrossModalTransformer:
    """
    Self-Attention and Cross-Attention Fusion model.
    
    Fuses representations of 5 modalities:
      [Face, Pose, Gaze, Emotion, Activity]
      
    Dimensions: 5 modalities x d_model (128)
    Uses a simplified multi-head attention mechanism to fuse the features
    into a single output embedding vector.
    """
    
    def __init__(self, d_model: int = 128, n_heads: int = 4):
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_head = d_model // n_heads
        
        # Self-attention parameters
        rng = np.random.RandomState(88)
        self.w_q = rng.randn(d_model, d_model) / np.sqrt(d_model)
        self.w_k = rng.randn(d_model, d_model) / np.sqrt(d_model)
        self.w_v = rng.randn(d_model, d_model) / np.sqrt(d_model)
        
        # Projection layer
        self.w_out = rng.randn(d_model, d_model) / np.sqrt(d_model)

    def softmax(self, x: np.ndarray, axis: int = -1) -> np.ndarray:
        e_x = np.exp(x - np.max(x, axis=axis, keepdims=True))
        return e_x / np.sum(e_x, axis=axis, keepdims=True)

    def fuse(self, modalities: Dict[str, np.ndarray]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Fuse a dictionary of modality embeddings.
        
        Args:
            modalities: dict mapping modality name -> 128-d embedding
            
        Returns:
            Tuple of (fused_embedding, attention_weights)
        """
        # Shape: (5, d_model)
        keys = list(modalities.keys())
        X = np.vstack([modalities[k] for k in keys])
        
        # Linear projections
        Q = np.dot(X, self.w_q)  # (5, d_model)
        K = np.dot(X, self.w_k)  # (5, d_model)
        V = np.dot(X, self.w_v)  # (5, d_model)
        
        # Scaled dot-product self-attention
        scores = np.dot(Q, K.T) / np.sqrt(self.d_model)  # (5, 5)
        attn_weights = self.softmax(scores, axis=-1)     # (5, 5)
        
        # Attention output
        context = np.dot(attn_weights, V)  # (5, d_model)
        output = np.dot(context, self.w_out)
        
        # Pool across modalities (mean pooling)
        fused = output.mean(axis=0)
        
        # Keep track of attention weights for explainability (e.g. board gaze importance vs pose)
        modality_importance = attn_weights.mean(axis=0)
        importance_dict = {keys[i]: float(modality_importance[i]) for i in range(len(keys))}
        
        return fused, importance_dict
