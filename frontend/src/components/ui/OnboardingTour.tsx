import { useState, useEffect } from 'react';
import { HelpCircle, ChevronRight, Check } from 'lucide-react';

interface Step {
  targetId: string;
  title: string;
  description: string;
  position: 'bottom' | 'top' | 'right' | 'left' | 'center';
}

const tourSteps: Step[] = [
  {
    targetId: 'main-header',
    title: 'Welcome to CogniClass Digital Twin!',
    description: 'This is your top header. Monitor active routes, search telemetry, check notifications, switch themes, or trigger the AI Copilot.',
    position: 'bottom',
  },
  {
    targetId: 'btn-copilot-header',
    title: 'AI RAG Copilot Assistant',
    description: 'Click here or press Ctrl+K anytime to open your AI Assistant. Ask questions like "Who is struggling today?" or "Summarize the last 15 minutes".',
    position: 'bottom',
  },
  {
    targetId: 'main-sidebar',
    title: 'Navigation Sidebar',
    description: 'Easily switch between Dashboard, Live Classroom, 3D Digital Twin, Analytics, Replay, Reports, and Research benchmarks.',
    position: 'right',
  },
  {
    targetId: 'chart-engagement',
    title: 'Real-Time Telemetry & At-Risk Detection',
    description: 'View live engagement scores, emotion distribution, and at-risk student predictions calculated by multimodal neural networks.',
    position: 'center',
  },
];

export default function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Show tour automatically on first visit or when triggered via event
    const hasSeenTour = localStorage.getItem('has_seen_tour');
    if (!hasSeenTour) {
      setIsActive(true);
    }

    const handleStartTour = () => {
      setCurrentStepIndex(0);
      setIsActive(true);
    };

    window.addEventListener('start-tour', handleStartTour);
    return () => window.removeEventListener('start-tour', handleStartTour);
  }, []);

  if (!isActive) return null;

  const step = tourSteps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      localStorage.setItem('has_seen_tour', 'true');
      setIsActive(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('has_seen_tour', 'true');
    setIsActive(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>
      {/* Semi-transparent backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', pointerEvents: 'auto' }} onClick={handleSkip} />

      {/* Tour Step Card */}
      <div
        id="tour-card"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '420px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--primary-500)',
          borderRadius: 16,
          padding: '24px',
          boxShadow: '0 20px 50px rgba(99,102,241,0.3)',
          zIndex: 9999,
          pointerEvents: 'auto',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <HelpCircle size={18} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step {currentStepIndex + 1} of {tourSteps.length}
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{step.title}</h3>
          </div>
        </div>

        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {step.description}
        </p>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleSkip}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
          >
            Skip Tour
          </button>

          <button
            id="btn-tour-next"
            onClick={handleNext}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {currentStepIndex === tourSteps.length - 1 ? (
              <>Got it! <Check size={14} /></>
            ) : (
              <>Next <ChevronRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
