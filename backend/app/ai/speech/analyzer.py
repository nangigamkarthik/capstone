"""
Speech Intelligence — NLP Transcript Analyzer

Extracts key topics, keywords, summaries, and action items from
lecture transcripts to fuel classroom analytics.
"""
import re
from typing import Dict, List, Tuple
from loguru import logger

class TranscriptAnalyzer:
    """
    NLP transcript analyzer implementing rule-based extractors and term frequencies.
    """
    
    def __init__(self):
        # Academic topics keyphrase database
        self.topic_keywords = {
            "backpropagation": ["chain rule", "gradient", "derivative", "delta", "weights"],
            "gradient_descent": ["learning rate", "loss", "optimizer", "sgd", "convergence"],
            "overfitting": ["regularization", "dropout", "test set", "validation", "memorize"],
            "transformers": ["attention", "self-attention", "seq2seq", "query", "key", "value"],
        }
        
        self.stop_words = {"the", "a", "an", "and", "or", "but", "if", "then", "we", "will", "today", "to", "of", "in"}

    def extract_keywords(self, text: str, top_k: int = 5) -> List[str]:
        """Simple TF keyword extraction."""
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        filtered = [w for w in words if w not in self.stop_words]
        
        freqs = {}
        for w in filtered:
            freqs[w] = freqs.get(w, 0) + 1
            
        sorted_freqs = sorted(freqs.items(), key=lambda x: x[1], reverse=True)
        return [w[0] for w in sorted_freqs[:top_k]]

    def extract_topics(self, text: str) -> List[str]:
        """Classifies text segments into curriculum topics."""
        txt_lower = text.lower()
        matched = []
        for topic, keys in self.topic_keywords.items():
            score = sum(1 for key in keys if key in txt_lower)
            if score >= 2:  # Min matches
                matched.append(topic)
        return matched

    def summarize_segments(self, segments: List[Dict]) -> str:
        """Generates summary notes from lecture transcript segments."""
        if not segments:
            return "No lecture content recorded."
            
        topics = []
        for seg in segments:
            t = self.extract_topics(seg.get("text", ""))
            topics.extend(t)
            
        unique_topics = list(set(topics))
        if unique_topics:
            summary = f"The lecture covered core concepts in {', '.join(unique_topics)}. "
        else:
            summary = "The lecture discussed general curriculum topics. "
            
        summary += f"Total discussion length: {len(segments)} segments recorded."
        return summary
