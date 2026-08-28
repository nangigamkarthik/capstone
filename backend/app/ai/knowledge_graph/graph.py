"""
Knowledge Graph — Relationship & Pedagogical Mapping

Manages classroom entities (students, teachers, concepts, lectures) and their
relationships (enrolled_in, prerequisite_of, struggles_with, teaches) to support
contextual reasoning and deep RAG.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional

@dataclass
class Node:
    id: str           # Unique identifier: e.g. "student_42", "concept_transformers"
    type: str         # student, teacher, course, concept, lecture
    properties: Dict = field(default_factory=dict)

@dataclass
class Edge:
    source: str
    target: str
    relation: str     # enrolled_in, teaches, struggles_with, prerequisite_of
    weight: float = 1.0
    properties: Dict = field(default_factory=dict)


class ClassroomKnowledgeGraph:
    """
    Classroom Knowledge Graph mapping relationships between student analytics,
    pedagogical concepts, and lecture progression.
    """

    def __init__(self):
        self.nodes: Dict[str, Node] = {}
        self.edges: List[Edge] = []
        self._adjacency: Dict[str, Set[str]] = {}
        self._setup_initial_graph()

    def add_node(self, node_id: str, node_type: str, props: Optional[Dict] = None):
        if node_id not in self.nodes:
            self.nodes[node_id] = Node(id=node_id, type=node_type, properties=props or {})
            self._adjacency[node_id] = set()

    def add_edge(self, source: str, target: str, relation: str, weight: float = 1.0, props: Optional[Dict] = None):
        # Ensure nodes exist
        if source not in self.nodes or target not in self.nodes:
            return
            
        edge = Edge(source=source, target=target, relation=relation, weight=weight, properties=props or {})
        self.edges.append(edge)
        self._adjacency[source].add(target)

    def _setup_initial_graph(self):
        """Populate baseline conceptual and student structures."""
        # 1. Add Concepts
        self.add_node("concept_backprop", "concept", {"name": "Backpropagation"})
        self.add_node("concept_gradients", "concept", {"name": "Gradient Descent"})
        self.add_node("concept_transformers", "concept", {"name": "Transformers"})
        
        # Prerequisite links
        self.add_edge("concept_backprop", "concept_gradients", "prerequisite_of")
        self.add_edge("concept_gradients", "concept_transformers", "prerequisite_of")

        # 2. Add Courses
        self.add_node("course_cs201", "course", {"name": "Deep Learning"})
        self.add_edge("course_cs201", "concept_backprop", "teaches")
        self.add_edge("course_cs201", "concept_gradients", "teaches")

    def tag_student_struggle(self, student_id: int, concept_name: str, score: float):
        """Link student struggle node to conceptual graph nodes."""
        s_node = f"student_{student_id}"
        c_node = f"concept_{concept_name}"
        
        self.add_node(s_node, "student")
        self.add_node(c_node, "concept")
        
        # Struggles_with edge created if score falls below threshold
        self.add_edge(s_node, c_node, "struggles_with", weight=score)

    def get_student_struggles(self, student_id: int) -> List[str]:
        """Query struggles for a student."""
        s_node = f"student_{student_id}"
        struggles = []
        for edge in self.edges:
            if edge.source == s_node and edge.relation == "struggles_with":
                struggles.append(edge.target.replace("concept_", ""))
        return struggles

    def get_prerequisites(self, concept_id: str) -> List[str]:
        """Query prerequisites along the pedagogical path."""
        prereqs = []
        for edge in self.edges:
            if edge.target == concept_id and edge.relation == "prerequisite_of":
                prereqs.append(edge.source)
        return prereqs

    def to_dict(self) -> dict:
        return {
            "nodes": [{"id": n.id, "type": n.type, "properties": n.properties} for n in self.nodes.values()],
            "edges": [{"source": e.source, "target": e.target, "relation": e.relation, "weight": e.weight} for e in self.edges]
        }
