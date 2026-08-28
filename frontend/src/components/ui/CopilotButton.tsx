import { Sparkles } from 'lucide-react';
import { useCopilotStore } from '../../stores/copilotStore';

export default function CopilotButton() {
  const { toggleCopilot } = useCopilotStore();

  return (
    <button
      id="btn-copilot-floating"
      onClick={toggleCopilot}
      title="Open AI Copilot (Ctrl+K)"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--primary-600), var(--secondary-500))',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.2)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
        zIndex: 9980,
        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), boxShadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(99,102,241,0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.4)';
      }}
    >
      <Sparkles size={24} />
      <span style={{
        position: 'absolute', top: -2, right: -2, width: 12, height: 12,
        borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-primary)',
      }} />
    </button>
  );
}
