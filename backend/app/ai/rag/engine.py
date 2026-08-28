"""
RAG Engine — Vector Retrieval & LLM Context Synthesis

Retrieves relevant curriculum context, transcript segments, and student records
to generate grounded natural language answers for the AI Copilot and query endpoints.
"""
import numpy as np
from typing import Dict, List, Optional, Tuple
from loguru import logger

class VectorDatabase:
    """
    Simulates a localized vector database (equivalent to pgvector / FAISS)
    storing and querying chunked documents.
    """
    
    def __init__(self, dimension: int = 128):
        self.dim = dimension
        self.embeddings: List[np.ndarray] = []
        self.metadata: List[Dict] = []

    def add_document(self, text: str, meta: Dict):
        """Add a text chunk with vector embedding to index."""
        # Simple simulated embedding from text hashing
        rng = np.random.RandomState(hash(text) % (2**32 - 1))
        vector = rng.randn(self.dim)
        vector /= np.linalg.norm(vector)
        
        self.embeddings.append(vector)
        self.metadata.append({"text": text, **meta})

    def query(self, query_text: str, top_k: int = 3) -> List[Tuple[float, Dict]]:
        """Retrieve most similar documents via cosine similarity."""
        if not self.embeddings:
            return []
            
        rng = np.random.RandomState(hash(query_text) % (2**32 - 1))
        q_vector = rng.randn(self.dim)
        q_vector /= np.linalg.norm(q_vector)
        
        scores = []
        for i, doc_vector in enumerate(self.embeddings):
            score = float(np.dot(q_vector, doc_vector))
            scores.append((score, self.metadata[i]))
            
        scores.sort(key=lambda x: x[0], reverse=True)
        return scores[:top_k]


class RAGEngine:
    """
    RAG Engine that coordinates document indexing and context synthesis.
    """

    def __init__(self):
        self.vdb = VectorDatabase()
        self._populate_default_curriculum()

    def _populate_default_curriculum(self):
        """Seeds vector DB with basic curriculum/syllabi guidelines."""
        syllabus = [
            ("CS201 Syllabus: The midterm exam covers backpropagation. Backpropagation computes gradients using chain rule.", "syllabus"),
            ("CS201 Syllabus: Midterm will occur in week 8. Test format is multiple choice.", "syllabus"),
            ("Lecture Note: Deep learning models fail when they overfit. Regularization (L2, dropout) helps reduce overfitting.", "notes"),
            ("Lecture Note: Transformers use self-attention queries, keys, and values to model sequence relationships.", "notes"),
            ("Class Policy: Attendance below eighty percent yields automatic grade deduction.", "policy")
        ]
        for text, category in syllabus:
            self.vdb.add_document(text, {"category": category})

    def ingest_transcript(self, lecture_id: int, segment_text: str):
        """Index a new lecture transcript chunk."""
        self.vdb.add_document(
            text=segment_text,
            meta={"lecture_id": lecture_id, "category": "transcript"}
        )

    def retrieve_context(self, query: str) -> str:
        """Retrieve context matching query for prompt injection."""
        matches = self.vdb.query(query, top_k=2)
        if not matches:
            return "No matching context found."
        return "\n".join([f"[{m[1]['category']}] {m[1]['text']}" for m in matches])

    def answer_query(self, query: str, state_context: Optional[str] = None) -> Dict:
        """
        Generate grounded answer utilizing retrieved context and optional system state.
        """
        context = self.retrieve_context(query)
        
        # Simulated LLM generation (grounded in context)
        answer = f"Based on retrieved sources: "
        if "midterm" in query.lower() or "exam" in query.lower():
            answer += "The CS201 midterm covers backpropagation. It occurs in week 8."
        elif "overfit" in query.lower() or "regularization" in query.lower():
            answer += "Overfitting is addressed by using regularization techniques such as L2 penalty or dropout."
        elif "transformer" in query.lower():
            answer += "Transformers rely on attention mechanisms, specifically mapping queries, keys, and values."
        else:
            answer += "I could not locate specific exam parameters. Please refer to syllabus files."

        if state_context:
            answer += f" Additionally, current state indicates: {state_context}"

        return {
            "query": query,
            "context_retrieved": context,
            "answer": answer,
        }
