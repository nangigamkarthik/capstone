import { useState } from 'react';
import { Network, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: 'concept' | 'student';
  x: number;
  y: number;
  mastery: number; // 0 to 100
  status: 'mastered' | 'learning' | 'confused';
  prerequisites?: string[];
  description?: string;
}

interface Edge {
  from: string;
  to: string;
  label?: string;
}

const mockNodes: Node[] = [
  { id: 'c1', label: 'Recursion', type: 'concept', x: 120, y: 140, mastery: 88, status: 'mastered', description: 'Base cases and recursive call stack execution' },
  { id: 'c2', label: 'Binary Search', type: 'concept', x: 280, y: 80, mastery: 82, status: 'mastered', prerequisites: ['c1'], description: 'Divide-and-conquer search in O(log n) time' },
  { id: 'c3', label: 'BST Operations', type: 'concept', x: 440, y: 140, mastery: 65, status: 'learning', prerequisites: ['c2'], description: 'Insertion, deletion, and in-order traversal' },
  { id: 'c4', label: 'AVL Tree Rotations', type: 'concept', x: 600, y: 220, mastery: 38, status: 'confused', prerequisites: ['c3'], description: 'Self-balancing binary trees via single/double rotations' },
  { id: 'c5', label: 'Graph Traversal', type: 'concept', x: 280, y: 260, mastery: 74, status: 'learning', prerequisites: ['c1'], description: 'BFS queue and DFS stack search algorithms' },
  { id: 'c6', label: 'Dijkstra Algorithm', type: 'concept', x: 460, y: 320, mastery: 45, status: 'confused', prerequisites: ['c5'], description: 'Single-source shortest path using priority queues' },
  { id: 's1', label: 'Alice (STU-001)', type: 'student', x: 580, y: 80, mastery: 92, status: 'mastered', description: 'Mastered AVL Rotations and BST balancing' },
  { id: 's2', label: 'Bob (STU-002)', type: 'student', x: 680, y: 300, mastery: 28, status: 'confused', description: 'Struggling with AVL left-right double rotations' },
];

const mockEdges: Edge[] = [
  { from: 'c1', to: 'c2', label: 'Prereq' },
  { from: 'c2', to: 'c3', label: 'Prereq' },
  { from: 'c3', to: 'c4', label: 'Prereq' },
  { from: 'c1', to: 'c5', label: 'Prereq' },
  { from: 'c5', to: 'c6', label: 'Prereq' },
  { from: 's1', to: 'c4', label: 'Mastered' },
  { from: 's2', to: 'c4', label: 'Struggling' },
];

function getNodeColor(node: Node) {
  if (node.type === 'student') return 'var(--primary-400)';
  if (node.status === 'mastered') return 'var(--success)';
  if (node.status === 'learning') return '#f59e0b';
  return 'var(--danger)';
}

export default function KnowledgeGraph() {
  const [selectedNode, setSelectedNode] = useState<Node>(mockNodes[3]);

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {/* Interactive SVG Network View */}
      <div style={{ flex: 2, minWidth: 320, background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Network size={16} color="var(--primary-400)" />
            Concept Dependency & Mastery Graph
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
            <span style={{ color: 'var(--success)' }}>● Mastered</span>
            <span style={{ color: '#f59e0b' }}>● Learning</span>
            <span style={{ color: 'var(--danger)' }}>● Confused</span>
          </div>
        </div>

        <svg width="100%" height="380" viewBox="0 0 760 380" style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 8 }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
          </defs>

          {/* Render Edges */}
          {mockEdges.map((edge, i) => {
            const fromNode = mockNodes.find(n => n.id === edge.from);
            const toNode = mockNodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const isSelected = selectedNode.id === fromNode.id || selectedNode.id === toNode.id;

            return (
              <g key={i}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isSelected ? 'var(--primary-400)' : '#334155'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  strokeDasharray={edge.label === 'Struggling' ? '4' : undefined}
                  markerEnd="url(#arrow)"
                />
              </g>
            );
          })}

          {/* Render Nodes */}
          {mockNodes.map((node) => {
            const isSelected = selectedNode.id === node.id;
            const color = getNodeColor(node);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow ring if selected */}
                {isSelected && (
                  <circle r="26" fill="none" stroke={color} strokeWidth="2.5" opacity="0.6" />
                )}

                {/* Node Body */}
                <circle
                  r="20"
                  fill={node.type === 'student' ? '#1e1b4b' : 'var(--bg-secondary)'}
                  stroke={color}
                  strokeWidth="2.5"
                />

                {/* Text Label */}
                <text
                  y="34"
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight={isSelected ? '700' : '500'}
                >
                  {node.label}
                </text>
                <text
                  y="-26"
                  textAnchor="middle"
                  fill={color}
                  fontSize="10"
                  fontWeight="600"
                >
                  {node.mastery}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Inspector Sidebar */}
      <div style={{ flex: 1, minWidth: 260, background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} color="var(--primary-400)" />
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedNode.label}</h4>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mastery Index</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: getNodeColor(selectedNode) }}>{selectedNode.mastery}%</span>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {selectedNode.description || 'Core concept node in the Data Structures curriculum map.'}
        </p>

        {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Prerequisite Chain:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedNode.prerequisites.map((pId) => {
                const pNode = mockNodes.find(n => n.id === pId);
                return (
                  <span key={pId} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ArrowRight size={10} /> {pNode?.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {selectedNode.status === 'confused' && (
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Confusion Spike:</strong> 38% of students struggling with rotation balancing logic. Recommended AI review slide.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
