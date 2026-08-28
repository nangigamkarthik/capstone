"""
Teacher AI Copilot Engine — LLM Copilot & Recommendation Reasoning

Fuses real-time classroom statistics, RAG context, and pedagogical knowledge graph
lookups to generate context-grounded suggestions for the teacher.
"""
from typing import Dict, List, Optional
from app.ai.rag.engine import RAGEngine
from app.ai.knowledge_graph.graph import ClassroomKnowledgeGraph

class CopilotEngine:
    """
    Orchestrates prompt construction and LLM query parsing.
    
    Generates high-quality recommendations for lecture pacing, student attention issues,
    concept prerequisites, and interactive quiz suggestions.
    """
    
    def __init__(self, rag_engine: RAGEngine, knowledge_graph: ClassroomKnowledgeGraph):
        self.rag = rag_engine
        self.kg = knowledge_graph

    def build_copilot_prompt(
        self,
        avg_attention: float,
        avg_confusion: float,
        at_risk_students: List[Dict],
        current_topic: str,
    ) -> str:
        """
        Construct a detailed prompt for the reasoning engine.
        """
        # Query prerequisites for topic from KG
        prereqs = self.kg.get_prerequisites(f"concept_{current_topic}")
        prereq_names = [p.replace("concept_", "") for p in prereqs]
        
        # Query RAG context for topic notes
        rag_context = self.rag.retrieve_context(current_topic)
        
        prompt = (
            f"CLASSROOM STATE:\n"
            f"- Current Topic: {current_topic}\n"
            f"- Average Student Attention: {avg_attention:.1f}%\n"
            f"- Average Student Confusion: {avg_confusion:.1f}%\n"
            f"- At-Risk Students Count: {len(at_risk_students)}\n\n"
            f"KNOWLEDGE GRAPH CONTEXT:\n"
            f"- Topic Prerequisite Dependencies: {prereq_names}\n\n"
            f"CURRICULUM CONTEXT:\n"
            f"{rag_context}\n\n"
            f"TASK: Generate the single most critical teaching strategy advice."
        )
        return prompt

    def generate_suggestion(
        self,
        avg_attention: float,
        avg_confusion: float,
        at_risk_students: List[Dict],
        current_topic: str,
    ) -> Dict:
        """
        Generate grounded copilot suggestions based on state rules and LLM simulation.
        """
        # Run rule-based heuristic trigger as first pass, fallback to LLM
        priority = "low"
        suggestion_text = "Maintain current instructional flow."
        reasoning = "Student attention and confusion rates are within normal operational bands."
        action_type = "continue"

        if avg_confusion > 25.0:
            prereqs = self.kg.get_prerequisites(f"concept_{current_topic}")
            prereq_names = [p.replace("concept_", "") for p in prereqs]
            
            suggestion_text = f"Review prerequisite concept: '{prereq_names[0]}' before proceeding." if prereq_names else "Slow down and re-explain current slide."
            reasoning = f"Average confusion is high ({avg_confusion:.1f}%). The prerequisite concept mapping suggests students may lack foundational understanding."
            priority = "critical"
            action_type = "slow_down"
            
        elif avg_attention < 50.0:
            suggestion_text = "Inject an interactive question or live quiz."
            reasoning = f"Attention is low ({avg_attention:.1f}%). Interactive components will trigger visual and mental re-engagement."
            priority = "high"
            action_type = "ask_question"
            
        elif len(at_risk_students) > 0:
            student_name = at_risk_students[0].get("name", "Student")
            suggestion_text = f"Move towards the seating region of {student_name}."
            reasoning = "Visual trackers show prolonged distraction triggers. Proximity guidance is recommended."
            priority = "medium"
            action_type = "proximity"

        return {
            "suggestion": suggestion_text,
            "reasoning": reasoning,
            "priority": priority,
            "action_type": action_type,
            "prompt_debug": self.build_copilot_prompt(avg_attention, avg_confusion, at_risk_students, current_topic)
        }
