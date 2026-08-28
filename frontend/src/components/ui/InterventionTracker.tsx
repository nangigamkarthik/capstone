import { useState } from 'react';
import { Sparkles, TrendingUp, CheckCircle, Clock, Plus, HelpCircle, Users, MessageSquare } from 'lucide-react';

export interface Intervention {
  id: string;
  time: string;
  type: 'question' | 'group_work' | 'check_in' | 'pause_explain';
  title: string;
  target: string;
  preEngagement: number;
  postEngagement: number;
  recoveryDelta: number;
  status: 'effective' | 'moderate' | 'pending';
  reasoning: string;
}

const initialInterventions: Intervention[] = [
  {
    id: 'int-1',
    time: '10:35 AM',
    type: 'question',
    title: 'Open-ended Questioning',
    target: 'Whole Class',
    preEngagement: 58,
    postEngagement: 74,
    recoveryDelta: 16,
    status: 'effective',
    reasoning: 'Asked student to explain left rotation balance factor. Re-engaged back rows.',
  },
  {
    id: 'int-2',
    time: '10:20 AM',
    type: 'group_work',
    title: '2-Minute Peer Pair Share',
    target: 'Rows 3–4',
    preEngagement: 48,
    postEngagement: 68,
    recoveryDelta: 20,
    status: 'effective',
    reasoning: 'Group activity resolved confusion spike regarding tree height calculation.',
  },
  {
    id: 'int-3',
    time: '10:08 AM',
    type: 'check_in',
    title: 'Individual Check-in Prompt',
    target: 'Bob Jones',
    preEngagement: 32,
    postEngagement: 45,
    recoveryDelta: 13,
    status: 'moderate',
    reasoning: 'Direct question prompted student to put phone away and resume note-taking.',
  },
];

export default function InterventionTracker() {
  const [interventions, setInterventions] = useState(initialInterventions);
  const [showLogModal, setShowLogModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('Whole Class');

  const handleLogIntervention = () => {
    if (!newTitle.trim()) return;

    const pre = Math.floor(Math.random() * 20) + 45;
    const post = Math.min(98, pre + Math.floor(Math.random() * 15) + 10);
    const delta = post - pre;

    const created: Intervention = {
      id: `int-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'question',
      title: newTitle.trim(),
      target: newTarget,
      preEngagement: pre,
      postEngagement: post,
      recoveryDelta: delta,
      status: delta > 12 ? 'effective' : 'moderate',
      reasoning: 'Logged teacher action evaluated by digital twin telemetry model.',
    };

    setInterventions([created, ...interventions]);
    setNewTitle('');
    setShowLogModal(false);
  };

  const avgRecovery = Math.round(
    interventions.reduce((acc, curr) => acc + curr.recoveryDelta, 0) / (interventions.length || 1)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Stat Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Interventions</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{interventions.length}</div>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Engagement Recovery</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={18} /> +{avgRecovery}%
          </div>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Effectiveness Rate</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary-400)', marginTop: 2 }}>
            {Math.round((interventions.filter(i => i.status === 'effective').length / (interventions.length || 1)) * 100)}%
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} color="var(--primary-400)" />
          Intervention History & Recovery Delta
        </h4>
        <button
          id="btn-log-intervention"
          onClick={() => setShowLogModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
            color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}
        >
          <Plus size={14} /> Log Action
        </button>
      </div>

      {/* Interventions Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {interventions.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '14px 16px', borderRadius: 12, background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 16,
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(99,102,241,0.12)', color: 'var(--primary-400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {item.type === 'question' ? <HelpCircle size={18} /> : item.type === 'group_work' ? <Users size={18} /> : <MessageSquare size={18} />}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                  🎯 {item.target}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.reasoning}</div>
            </div>

            {/* Score Delta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>{item.preEngagement}%</span> → <strong style={{ color: 'var(--text-primary)' }}>{item.postEngagement}%</strong>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: 'rgba(34,197,94,0.15)', color: 'var(--success)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <CheckCircle size={12} /> +{item.recoveryDelta}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={12} /> {item.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showLogModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9995, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 16, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Log Teaching Intervention</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Action Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Conducted quick 1-minute poll"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Target Group</label>
                <select
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                >
                  <option>Whole Class</option>
                  <option>Rows 1–2</option>
                  <option>Rows 3–4</option>
                  <option>At-Risk Students</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowLogModal(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleLogIntervention} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--primary-500)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Evaluate & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
