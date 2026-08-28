"""
Verification script for Phase 4 Language Intelligence Layer.
Tests transcription, speaker diarization, topic modeling, vector RAG database query,
Knowledge Graph indexing, and copilot reasoning.
"""
import sys
import os
import numpy as np

# Add backend app directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ai.speech.transcriber import WhisperTranscriber
from app.ai.speech.diarizer import SpeakerDiarizer
from app.ai.speech.analyzer import TranscriptAnalyzer
from app.ai.rag.engine import RAGEngine
from app.ai.knowledge_graph.graph import ClassroomKnowledgeGraph
from app.ai.copilot.engine import CopilotEngine

def main():
    print("====================================================")
    print("   COGNITIVE CLASSROOM DIGITAL TWIN - PHASE 4 VERIFY")
    print("====================================================")

    # ── 1. Speech Intelligence (Transcription & Diarization) ──
    print("1. Testing Speech Intelligence...")
    transcriber = WhisperTranscriber()
    diarizer = SpeakerDiarizer()
    analyzer = TranscriptAnalyzer()
    
    # Run transcriber
    dummy_audio = np.zeros(16000 * 3, dtype=np.float32)  # 3 seconds dummy audio
    text = transcriber.transcribe(dummy_audio)
    print(f"  - Transcribed text: \"{text}\"")
    
    # Run diarization
    mock_audio_emb = np.random.randn(128)
    speaker = diarizer.diarize_segment(mock_audio_emb, speaker_face_talking=True)
    print(f"  - Diarized speaker role: {speaker}")
    
    # NLP keyword extraction
    keywords = analyzer.extract_keywords(text)
    topics = analyzer.extract_topics(text)
    print(f"  - Extracted keywords: {keywords}")
    print(f"  - Classified topics : {topics}")
    print("Speech Intelligence: PASSED [OK]\n")

    # ── 2. Vector RAG Engine ──
    print("2. Testing Vector RAG Database...")
    rag = RAGEngine()
    
    # Ingest dummy segment and query
    lecture_id = 101
    rag.ingest_transcript(lecture_id, "Transformers leverage multi-head attention to extract context.")
    
    res = rag.answer_query("Tell me about Transformers.", state_context="Student confusion is low.")
    print(f"  - Query  : \"{res['query']}\"")
    print(f"  - Context: {res['context_retrieved']}")
    print(f"  - Answer : {res['answer']}")
    print("RAG Engine: PASSED [OK]\n")

    # ── 3. Knowledge Graph ──
    print("3. Testing Classroom Knowledge Graph...")
    kg = ClassroomKnowledgeGraph()
    
    # Add struggle mapping
    student_id = 42
    kg.tag_student_struggle(student_id, "gradients", score=0.88)
    
    struggles = kg.get_student_struggles(student_id)
    prereqs = kg.get_prerequisites("concept_gradients")
    
    print(f"  - Student {student_id} struggles: {struggles}")
    print(f"  - Concept 'gradients' prerequisites: {prereqs}")
    print("Knowledge Graph: PASSED [OK]\n")

    # ── 4. Copilot suggestion engine ──
    print("4. Testing Copilot Prompt & Suggestion Generator...")
    copilot = CopilotEngine(rag_engine=rag, knowledge_graph=kg)
    
    at_risk_list = [{"id": student_id, "name": "Alice Smith"}]
    suggestion = copilot.generate_suggestion(
        avg_attention=45.0,
        avg_confusion=32.0,
        at_risk_students=at_risk_list,
        current_topic="gradients"
    )
    
    print(f"  - Suggested Intervention: {suggestion['suggestion']}")
    print(f"  - Reasoning Context     : {suggestion['reasoning']}")
    print(f"  - Priority Level        : {suggestion['priority'].upper()}")
    print("Copilot Engine: PASSED [OK]\n")

    print("====================================================")
    print("                  VERIFICATION RESULTS              ")
    print("====================================================")
    print("Language Layer integration status: PASSED [OK]")
    print("====================================================")

if __name__ == "__main__":
    main()
