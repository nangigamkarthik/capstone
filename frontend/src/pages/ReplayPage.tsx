import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import InterventionTracker from '../components/ui/InterventionTracker';

const events = [
  { time: '00:10:00', type: 'hand_raise', label: '3 students raised hands', color: 'var(--primary-400)' },
  { time: '00:18:30', type: 'question', label: 'Student asked about backpropagation', color: 'var(--secondary-400)' },
  { time: '00:25:00', type: 'distraction', label: 'Engagement drop detected (back row)', color: 'var(--danger)' },
  { time: '00:32:15', type: 'collaboration', label: 'Group discussion initiated', color: 'var(--success)' },
  { time: '00:40:00', type: 'hand_raise', label: '5 students raised hands', color: 'var(--primary-400)' },
  { time: '00:48:20', type: 'distraction', label: 'Phone usage spike detected', color: 'var(--danger)' },
];

export default function ReplayPage() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(42);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Video Player */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #020617, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Clock size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div style={{ fontSize: 16, fontWeight: 600 }}>Lecture Replay</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>CS301 — Data Structures & Algorithms</div>
          </div>
        </div>

        {/* Controls overlay */}
        <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Progress bar */}
          <div
            style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', cursor: 'pointer' }}
            onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setProgress(Math.round(((e.clientX - rect.left) / rect.width) * 100)); }}
          >
            <div style={{ width: `${progress}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--primary-500), var(--secondary-500))', transition: 'width 0.1s' }} />
            <div style={{ position: 'absolute', left: `${progress}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px rgba(99,102,241,0.5)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={() => setProgress(Math.max(0, progress - 5))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><SkipBack size={20} /></button>
              <button onClick={() => setPlaying(!playing)} style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-500)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {playing ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
              </button>
              <button onClick={() => setProgress(Math.min(100, progress + 5))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><SkipForward size={20} /></button>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              {Math.floor(progress * 0.6)}:{String(Math.floor(progress * 0.36) % 60).padStart(2, '0')} / 60:00
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Events Timeline + Intervention Tracker */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <StatCard id="replay-events" title="Lecture Key Events" subtitle="Multimodal markers" icon={<Clock size={18} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.map((e, i) => (
              <button
                key={i}
                onClick={() => { const mins = parseInt(e.time.split(':')[1]); setProgress(Math.round((mins / 60) * 100)); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace', minWidth: 60 }}>{e.time}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{e.label}</span>
              </button>
            ))}
          </div>
        </StatCard>

        <StatCard id="replay-interventions" title="Teacher Interventions & Recovery Delta" subtitle="Action tracking">
          <InterventionTracker />
        </StatCard>
      </div>
    </div>
  );
}
