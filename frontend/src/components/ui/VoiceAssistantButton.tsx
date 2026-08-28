import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { voiceService, type VoiceState } from '../../services/voiceAssistant';
import { useCopilotStore } from '../../stores/copilotStore';
import { useThemeStore } from '../../stores/themeStore';
import { generatePDFReport } from '../../utils/pdfGenerator';

export default function VoiceAssistantButton() {
  const navigate = useNavigate();
  const { toggleCopilot, sendMessage } = useCopilotStore();
  const { toggleTheme } = useThemeStore();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    // Register Voice Command Rules
    voiceService.registerCommand({
      phrases: ['show dashboard', 'open dashboard', 'go to dashboard', 'dashboard'],
      description: 'Navigate to main Dashboard',
      action: () => {
        voiceService.speak('Navigating to Dashboard');
        navigate('/');
      },
    });

    voiceService.registerCommand({
      phrases: ['show campus map', 'open campus map', 'go to campus', 'campus map', 'campus'],
      description: 'Navigate to Campus Floorplan Map',
      action: () => {
        voiceService.speak('Opening Campus Floorplan Map');
        navigate('/campus');
      },
    });

    voiceService.registerCommand({
      phrases: ['show digital twin', 'open digital twin', 'go to twin', '3d twin', 'digital twin'],
      description: 'Navigate to 3D Digital Twin View',
      action: () => {
        voiceService.speak('Opening 3D Digital Twin');
        navigate('/twin');
      },
    });

    voiceService.registerCommand({
      phrases: ['show live classroom', 'open live classroom', 'live classroom', 'live cameras'],
      description: 'Navigate to Live Video Streams',
      action: () => {
        voiceService.speak('Opening Live Classroom Feeds');
        navigate('/live');
      },
    });

    voiceService.registerCommand({
      phrases: ['show analytics', 'open analytics', 'leaderboard', 'analytics'],
      description: 'Navigate to Analytics & Leaderboard',
      action: () => {
        voiceService.speak('Opening Analytics and Leaderboard');
        navigate('/analytics');
      },
    });

    voiceService.registerCommand({
      phrases: ['open copilot', 'open assistant', 'ask copilot', 'copilot'],
      description: 'Toggle AI Copilot Drawer',
      action: () => {
        voiceService.speak('Opening AI Copilot');
        toggleCopilot();
      },
    });

    voiceService.registerCommand({
      phrases: ['who is struggling', 'struggling students', 'at risk students'],
      description: 'Ask Copilot for struggling students summary',
      action: () => {
        voiceService.speak('Asking Copilot for struggling student analysis');
        toggleCopilot();
        sendMessage('Who is struggling in class today?');
      },
    });

    voiceService.registerCommand({
      phrases: ['show bob jones', 'open bob jones', 'bob jones'],
      description: 'Navigate to student Bob Jones profile',
      action: () => {
        voiceService.speak('Opening student profile for Bob Jones');
        navigate('/student/2');
      },
    });

    voiceService.registerCommand({
      phrases: ['toggle theme', 'change theme', 'dark mode', 'light mode'],
      description: 'Cycle color theme',
      action: () => {
        voiceService.speak('Toggling color theme');
        toggleTheme();
      },
    });

    voiceService.registerCommand({
      phrases: ['export report', 'generate report', 'download report'],
      description: 'Generate Executive PDF Report',
      action: () => {
        voiceService.speak('Generating executive PDF report');
        generatePDFReport({
          title: 'Voice Triggered Executive Summary Report',
          course: 'CS301 Data Structures',
          date: new Date().toLocaleDateString(),
          type: 'engagement',
          summary: 'Generated via hands-free voice assistant command.',
          metrics: [{ label: 'Avg Engagement', value: '78.5%' }],
          recommendations: ['Review AVL tree rotation concepts.'],
        });
      },
    });

    // Subscribe to state updates
    const unsubscribe = voiceService.onStateChange((state, lastText) => {
      setVoiceState(state);
      setTranscript(lastText);
    });

    return () => unsubscribe();
  }, [navigate, toggleCopilot, toggleTheme, sendMessage]);

  const isListening = voiceState === 'listening' || voiceState === 'processing' || voiceState === 'speaking';

  if (voiceState === 'unsupported') return null;

  return (
    <>
      <style>{`
        .voice-orb-btn {
          position: fixed;
          bottom: 24px;
          right: 84px;
          z-index: 9980;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .voice-orb-active {
          background: linear-gradient(135deg, #ef4444, #f59e0b) !important;
          box-shadow: 0 0 25px rgba(239,68,68,0.6) !important;
          transform: scale(1.1);
        }
        .voice-orb-idle {
          background: linear-gradient(135deg, var(--secondary-600), var(--secondary-400));
        }
        .voice-orb-idle:hover {
          transform: scale(1.1);
          box-shadow: 0 10px 30px rgba(20,184,166,0.5);
        }
        .voice-pulse-wave {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid #ef4444;
          animation: voicePulse 1.5s infinite;
          pointer-events: none;
        }
        @keyframes voicePulse {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .voice-tooltip {
          position: fixed;
          bottom: 86px;
          right: 84px;
          z-index: 9981;
          padding: 10px 16px;
          border-radius: 12px;
          background: rgba(15,23,42,0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
          animation: fadeIn 0.2s ease-out;
          max-width: 320px;
        }
      `}</style>

      {/* Real-time Voice Command Transcript Tooltip */}
      {isListening && (
        <div className="voice-tooltip">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: voiceState === 'speaking' ? '#3b82f6' : '#ef4444', animation: 'pulse-red 1.5s infinite' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--secondary-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {voiceState === 'speaking' ? 'Assistant Speaking...' : voiceState === 'processing' ? 'Processing Command...' : 'Listening ("Hey Cogni")...'}
            </div>
            <div style={{ fontSize: 13, color: '#f8fafc', marginTop: 2, fontStyle: transcript ? 'normal' : 'italic' }}>
              {transcript ? `"${transcript}"` : 'Say "Show campus map" or "Open copilot"'}
            </div>
          </div>
        </div>
      )}

      {/* Mic Orb Floating Button */}
      <button
        id="btn-voice-assistant"
        className={`voice-orb-btn ${isListening ? 'voice-orb-active' : 'voice-orb-idle'}`}
        onClick={() => voiceService.toggleListening()}
        onContextMenu={(e) => { e.preventDefault(); setShowHelpModal(true); }}
        title={isListening ? 'Click to stop voice listening (Right-click for command list)' : 'Click to enable Hands-Free Voice Assistant ("Hey Cogni")'}
      >
        {isListening && <div className="voice-pulse-wave" />}
        {voiceState === 'speaking' ? <Volume2 size={22} className="animate-pulse" /> : isListening ? <Mic size={22} /> : <MicOff size={20} />}
      </button>

      {/* Command Reference Help Modal */}
      {showHelpModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 480, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--secondary-600), var(--secondary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Mic size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Voice Assistant Commands</h3>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Wake words: "Hey Cogni", "Cogni", or direct phrase</div>
                </div>
              </div>
              <button onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {[
                { phrase: '"Show campus map"', desc: 'Navigate to 2D floorplan overview' },
                { phrase: '"Show 3D twin"', desc: 'Navigate to 3D Digital Twin view' },
                { phrase: '"Show live classroom"', desc: 'Navigate to multi-cam video streams' },
                { phrase: '"Open copilot"', desc: 'Toggle AI Copilot assistant drawer' },
                { phrase: '"Who is struggling today?"', desc: 'Ask Copilot Q&A for risk analysis' },
                { phrase: '"Show Bob Jones"', desc: 'Navigate to student Bob Jones profile' },
                { phrase: '"Toggle theme"', desc: 'Cycle dark/light color themes' },
                { phrase: '"Export report"', desc: 'Generate & download PDF summary' },
              ].map((c, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--secondary-400)' }}>{c.phrase}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.desc}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              style={{ padding: '10px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
