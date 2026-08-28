import { useState } from 'react';
import { BarChart2, CheckCircle2 } from 'lucide-react';

// Emotion Labels & Confusion Matrix Data (Normalized %)
const emotions = ['Happy', 'Neutral', 'Confused', 'Interested', 'Bored', 'Frustrated'];
const confusionMatrix = [
  [92, 4, 1, 2, 1, 0],
  [2, 88, 5, 3, 1, 1],
  [1, 6, 84, 4, 2, 3],
  [3, 4, 3, 89, 1, 0],
  [0, 3, 4, 1, 90, 2],
  [1, 2, 6, 1, 4, 86],
];

const ablationData = [
  { name: 'Multimodal Fusion (Full)', map: 94.5, f1: 86.4, latency: '4.2 ms', color: 'var(--primary-500)' },
  { name: 'Vision-Only (Pose + Face)', map: 88.2, f1: 79.1, latency: '3.1 ms', color: 'var(--secondary-500)' },
  { name: 'Audio-Only (Speech Tone)', map: 72.4, f1: 65.8, latency: '1.8 ms', color: '#f59e0b' },
  { name: 'Baseline ResNet-50', map: 64.1, f1: 58.2, latency: '8.4 ms', color: '#64748b' },
];

export default function PublicationPlots() {
  const [activeTab, setActiveTab] = useState<'confusion' | 'ablation'>('confusion');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tab Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-tertiary)', padding: 3, borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('confusion')}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: activeTab === 'confusion' ? 'var(--primary-500)' : 'transparent',
              color: activeTab === 'confusion' ? '#fff' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Confusion Matrix
          </button>
          <button
            onClick={() => setActiveTab('ablation')}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: activeTab === 'ablation' ? 'var(--primary-500)' : 'transparent',
              color: activeTab === 'ablation' ? '#fff' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Ablation Benchmark Study
          </button>
        </div>

        <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <CheckCircle2 size={14} color="var(--success)" /> Publication Standard (IEEE / CVPR)
        </span>
      </div>

      {/* Render Active View */}
      {activeTab === 'confusion' ? (
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={16} color="var(--primary-400)" /> Emotion Classification Confusion Matrix (Normalized %)
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', margin: '0 auto', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: 8, color: 'var(--text-secondary)' }}>Actual \ Pred</th>
                  {emotions.map(e => <th key={e} style={{ padding: 8, color: 'var(--text-primary)', fontWeight: 600 }}>{e}</th>)}
                </tr>
              </thead>
              <tbody>
                {confusionMatrix.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ padding: 8, color: 'var(--text-primary)', fontWeight: 600 }}>{emotions[rIdx]}</td>
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      const opacity = val / 100;
                      return (
                        <td
                          key={cIdx}
                          style={{
                            padding: '10px 14px', textAlign: 'center', fontWeight: isDiagonal ? 700 : 400,
                            background: isDiagonal ? `rgba(99,102,241,${opacity})` : `rgba(239,68,68,${opacity * 0.5})`,
                            color: opacity > 0.4 ? '#fff' : 'var(--text-primary)',
                            borderRadius: 4, border: '1px solid var(--bg-secondary)',
                          }}
                        >
                          {val}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Ablation Comparison Across Architecture Components
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ablationData.map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    mAP50: <strong style={{ color: 'var(--text-primary)' }}>{item.map}%</strong> • Latency: {item.latency}
                  </span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.map}%`, background: item.color, borderRadius: 5, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
