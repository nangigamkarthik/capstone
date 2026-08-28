import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Grid, Box, Sphere, Cylinder } from '@react-three/drei';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, FastForward, User, Sparkles } from 'lucide-react';
import { useCopilotStore } from '../stores/copilotStore';
import type { StudentState } from '../types';
import * as THREE from 'three';

interface ExtendedStudentState extends StudentState {
  riskScore: number;
}

const initialStudents: ExtendedStudentState[] = [
  { id: 1, name: 'Alice Smith', position: { x: -3, y: 0, z: 2 }, rotation: { yaw: 0, pitch: 0, roll: 0 }, engagement: 85, emotion: 'interested', activity: 'listening', gazeTarget: 'teacher', riskScore: 22 },
  { id: 2, name: 'Bob Jones', position: { x: -1, y: 0, z: 2 }, rotation: { yaw: 0, pitch: 0, roll: 0 }, engagement: 42, emotion: 'bored', activity: 'using_phone', gazeTarget: 'phone', riskScore: 82.5 },
  { id: 3, name: 'Carol Williams', position: { x: 1, y: 0, z: 2 }, rotation: { yaw: 0, pitch: 0, roll: 0 }, engagement: 78, emotion: 'neutral', activity: 'writing', gazeTarget: 'board', riskScore: 45 },
  { id: 4, name: 'David Miller', position: { x: 3, y: 0, z: 2 }, rotation: { yaw: 0, pitch: 0, roll: 0 }, engagement: 91, emotion: 'happy', activity: 'listening', gazeTarget: 'teacher', riskScore: 12 },
  { id: 5, name: 'Eve Davis', position: { x: -3, y: 0, z: 4 }, rotation: { yaw: 0, pitch: 0, roll: 0 }, engagement: 35, emotion: 'confused', activity: 'reading', gazeTarget: 'laptop', riskScore: 68 },
  { id: 6, name: 'Frank Wilson', position: { x: -1, y: 0, z: 4 }, rotation: { yaw: 0, pitch: 0, roll: 0 }, engagement: 65, emotion: 'neutral', activity: 'listening', gazeTarget: 'teacher', riskScore: 30 },
  { id: 7, name: 'Grace Taylor', position: { x: 1, y: 0, z: 4 }, rotation: { yaw: 0, pitch: 0, roll: 0 }, engagement: 72, emotion: 'interested', activity: 'collaborating', gazeTarget: 'other_student', riskScore: 25 },
  { id: 8, name: 'Hank Anderson', position: { x: 3, y: 0, z: 4 }, rotation: { yaw: 0, pitch: 0, roll: 0 }, engagement: 20, emotion: 'bored', activity: 'sleeping', gazeTarget: 'away', riskScore: 88 },
];

function engagementColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function gazeTargetPosition(target: string): [number, number, number] {
  switch (target) {
    case 'teacher': return [0, 1.2, 0];
    case 'board': return [0, 1.5, -1];
    case 'phone': return [-1, 0.4, 2.2];
    case 'laptop': return [-3, 0.5, 3.8];
    case 'other_student': return [0.5, 0.8, 3.8];
    default: return [4, 0.5, 5];
  }
}

function StudentNode({ student, viewMode, onClick }: { student: ExtendedStudentState; viewMode: string; onClick: () => void }) {
  const color = viewMode === 'risk'
    ? (student.riskScore > 70 ? '#ef4444' : student.riskScore > 40 ? '#f59e0b' : '#22c55e')
    : engagementColor(student.engagement);

  const gazePos = gazeTargetPosition(student.gazeTarget);

  return (
    <group position={[student.position.x, student.position.y + 0.8, student.position.z]} onClick={onClick}>
      {/* Body */}
      <Box args={[0.5, 0.8, 0.3]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#334155" />
      </Box>

      {/* Head */}
      <Sphere args={[0.25, 16, 16]} position={[0, 0.65, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </Sphere>

      {/* Heatmap Ring on Floor */}
      {(viewMode === 'heatmap' || viewMode === 'risk') && (
        <Cylinder args={[0.9, 0.9, 0.02, 32]} position={[0, -0.78, 0]}>
          <meshStandardMaterial color={color} transparent opacity={0.5} emissive={color} emissiveIntensity={0.6} />
        </Cylinder>
      )}

      {/* Gaze Rays */}
      {viewMode === 'gaze' && (
        <line>
          <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0.65, 0),
            new THREE.Vector3(gazePos[0] - student.position.x, gazePos[1] - (student.position.y + 0.8), gazePos[2] - student.position.z),
          ])} />
          <lineBasicMaterial attach="material" color="#818cf8" linewidth={2} />
        </line>
      )}

      {/* Name Label */}
      <Text position={[0, 1.25, 0]} fontSize={0.18} color="#e2e8f0" anchorX="center">
        {student.name.split(' ')[0]}
      </Text>
      <Text position={[0, 1.05, 0]} fontSize={0.13} color={color} anchorX="center">
        {viewMode === 'risk' ? `Risk: ${student.riskScore}` : `${student.engagement}%`}
      </Text>
    </group>
  );
}

function Classroom({ viewMode }: { viewMode: string }) {
  return (
    <group>
      {/* Floor Grid */}
      <Grid args={[16, 12]} cellSize={1} cellColor="#334155" sectionColor="#475569" position={[0, 0, 3]} />

      {/* Whiteboard */}
      <Box args={[6, 2, 0.1]} position={[0, 1.5, -1]}>
        <meshStandardMaterial color={viewMode === 'gaze' ? '#818cf8' : '#e2e8f0'} emissive={viewMode === 'gaze' ? '#4f46e5' : '#000'} emissiveIntensity={0.2} />
      </Box>

      {/* Teacher desk */}
      <Box args={[2.5, 0.8, 0.8]} position={[0, 0.4, 0]}>
        <meshStandardMaterial color="#1e293b" />
      </Box>

      {/* Teacher avatar */}
      <group position={[0, 0.8, 0]}>
        <Box args={[0.5, 0.9, 0.3]}>
          <meshStandardMaterial color="#312e81" />
        </Box>
        <Sphere args={[0.28, 16, 16]} position={[0, 0.7, 0]}>
          <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} />
        </Sphere>
        <Text position={[0, 1.3, 0]} fontSize={0.2} color="#a5b4fc" anchorX="center">Teacher</Text>
      </group>

      {/* Student desks */}
      {initialStudents.map(s => (
        <Box key={`desk-${s.id}`} args={[0.7, 0.05, 0.5]} position={[s.position.x, 0.5, s.position.z]}>
          <meshStandardMaterial color="#1e293b" />
        </Box>
      ))}
    </group>
  );
}

export default function DigitalTwinPage() {
  const [students, setStudents] = useState<ExtendedStudentState[]>(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState<ExtendedStudentState | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'heatmap' | 'gaze' | 'risk'>('3d');
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeIndex, setTimeIndex] = useState(15);
  const navigate = useNavigate();
  const { toggleCopilot, sendMessage } = useCopilotStore();

  // Playback timer simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeIndex(prev => {
          const nextTime = (prev + 1) % 60;
          setStudents(current => current.map(s => ({
            ...s,
            engagement: Math.max(10, Math.min(99, s.engagement + Math.floor(Math.random() * 5 - 2))),
          })));
          return nextTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 16, height: 'calc(100vh - 120px)' }}>
      {/* 3D Canvas Container */}
      <div className="glass-card" style={{ flex: 2, padding: 0, overflow: 'hidden', borderRadius: 16, position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {/* Floating View Controls Header */}
        <div style={{
          position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none',
        }}>
          {/* Mode Switcher */}
          <div style={{
            display: 'flex', gap: 4, background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(16px)', padding: 4, borderRadius: 10,
            border: '1px solid var(--border-color)', pointerEvents: 'auto',
          }}>
            {[
              { id: '3d', label: '3D View', icon: '🧊' },
              { id: 'heatmap', label: 'Heatmap Overlay', icon: '🔥' },
              { id: 'gaze', label: 'Gaze Vectors', icon: '👁️' },
              { id: 'risk', label: 'Risk Map', icon: '⚠️' },
            ].map(mode => (
              <button
                key={mode.id}
                id={`btn-view-${mode.id}`}
                onClick={() => setViewMode(mode.id as '3d' | 'heatmap' | 'gaze' | 'risk')}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none',
                  background: viewMode === mode.id ? 'var(--primary-500)' : 'transparent',
                  color: viewMode === mode.id ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                }}
              >
                <span>{mode.icon}</span> {mode.label}
              </button>
            ))}
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)',
            padding: '6px 14px', borderRadius: 10, border: '1px solid var(--border-color)',
            display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', pointerEvents: 'auto',
          }}>
            <div>Avg Engagement: <strong style={{ color: 'var(--success)' }}>65.8%</strong></div>
            <div>Gaze on Board: <strong style={{ color: 'var(--primary-400)' }}>62.5%</strong></div>
          </div>
        </div>

        {/* 3D Canvas */}
        <div style={{ flex: 1 }}>
          <Canvas camera={{ position: [0, 8, 10], fov: 50 }} shadows>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <pointLight position={[-5, 5, 5]} intensity={0.5} color="#6366f1" />
            <Classroom viewMode={viewMode} />
            {students.map(s => (
              <StudentNode key={s.id} student={s} viewMode={viewMode} onClick={() => setSelectedStudent(s)} />
            ))}
            <OrbitControls enablePan enableZoom enableRotate maxPolarAngle={Math.PI / 2.2} />
            <Environment preset="city" />
          </Canvas>
        </div>

        {/* Time Playback Control Bar */}
        <div style={{
          padding: '12px 20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: 16, zIndex: 10,
        }}>
          <button
            id="btn-play-pause-simulation"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'var(--primary-500)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
          </button>

          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', width: 70, flexShrink: 0 }}>
            10:{String(timeIndex).padStart(2, '0')} AM
          </div>

          <input
            id="slider-simulation-time"
            type="range"
            min="0"
            max="59"
            value={timeIndex}
            onChange={(e) => setTimeIndex(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--primary-500)', cursor: 'pointer' }}
          />

          <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <FastForward size={14} /> Live Stream Active
          </div>
        </div>
      </div>

      {/* Student Inspector Panel */}
      <div className="glass-card" style={{ width: 340, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Student Telemetry Inspector</h3>

        {selectedStudent ? (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `linear-gradient(135deg, ${engagementColor(selectedStudent.engagement)}, #312e81)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 18,
              }}>
                {selectedStudent.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedStudent.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ID: STU-{String(selectedStudent.id).padStart(3, '0')}</div>
              </div>
            </div>

            {/* Quick Metrics */}
            {[
              ['Engagement Score', `${selectedStudent.engagement}%`],
              ['Dropout Risk', `${selectedStudent.riskScore}%`],
              ['Dominant Emotion', selectedStudent.emotion],
              ['Detected Activity', selectedStudent.activity.replace('_', ' ')],
              ['Gaze Focus Target', selectedStudent.gazeTarget.replace('_', ' ')],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{val}</span>
              </div>
            ))}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <button
                id="btn-view-student-profile"
                onClick={() => navigate(`/student/${selectedStudent.id}`)}
                style={{
                  padding: '10px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <User size={16} /> View Full Profile
              </button>
              <button
                id="btn-copilot-intervene"
                onClick={() => {
                  toggleCopilot();
                  sendMessage(`Suggest an intervention for ${selectedStudent.name} who is currently showing ${selectedStudent.emotion} emotion and low engagement.`);
                }}
                style={{
                  padding: '10px', borderRadius: 8,
                  border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)',
                  color: 'var(--primary-400)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Sparkles size={16} /> Ask Copilot to Intervene
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🖱️</div>
            Click any student in the 3D spatial view to inspect real-time telemetry
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Mode Info & Color Mapping</div>
          {viewMode === 'risk' ? (
            <>
              {[['High Risk (>70%)', '#ef4444'], ['Medium Risk (40-70%)', '#f59e0b'], ['Low Risk (<40%)', '#22c55e']].map(([label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: color as string }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
                </div>
              ))}
            </>
          ) : viewMode === 'gaze' ? (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Purple vectors represent gaze direction from student eyes to target object (Whiteboard, Teacher, Laptop, Phone).
            </div>
          ) : (
            <>
              {[['High Engagement (75-100%)', '#22c55e'], ['Medium Engagement (50-74%)', '#f59e0b'], ['Low Engagement (0-49%)', '#ef4444']].map(([label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: color as string }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
