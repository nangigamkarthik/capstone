import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, Trash2, ExternalLink, Lightbulb, BookOpen } from 'lucide-react';
import { useCopilotStore } from '../../stores/copilotStore';

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function CopilotDrawer() {
  const { isOpen, setIsOpen, messages, isLoading, sendMessage, clearChat, selectedLectureId, setSelectedLectureId } = useCopilotStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;
    sendMessage(query);
    if (!textToSend) setInputText('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div
        ref={drawerRef}
        id="copilot-drawer"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 10px rgba(99,102,241,0.3); }
            50% { box-shadow: 0 0 20px rgba(99,102,241,0.7); }
          }
          .chip-hover:hover {
            border-color: var(--primary-500) !important;
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
          }
        `}</style>

        {/* Drawer Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', animation: 'pulseGlow 3s infinite',
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                AI Classroom Copilot
                <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.15)', color: 'var(--primary-400)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>RAG v2.4</span>
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <BookOpen size={12} />
                <span>Context:</span>
                <select
                  id="copilot-context-select"
                  value={selectedLectureId || 201}
                  onChange={(e) => setSelectedLectureId(Number(e.target.value))}
                  style={{
                    background: 'none', border: 'none', color: 'var(--primary-400)',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none',
                  }}
                >
                  <option value={201} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>CS301 Data Structures (Room 204)</option>
                  <option value={202} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>MA201 Linear Algebra (Room 105)</option>
                  <option value={203} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>CS401 Machine Learning (Lab 3)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              id="btn-clear-copilot"
              onClick={clearChat}
              title="Clear Conversation"
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 6, borderRadius: 6 }}
            >
              <Trash2 size={16} />
            </button>
            <button
              id="btn-close-copilot"
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 6, borderRadius: 6 }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                {msg.sender === 'assistant' ? (
                  <>
                    <Bot size={14} color="var(--primary-400)" />
                    <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>CogniCopilot</span>
                  </>
                ) : (
                  <span>You</span>
                )}
                <span>• {formatTime(msg.timestamp)}</span>
              </div>

              <div
                style={{
                  maxWidth: '88%',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.sender === 'user'
                    ? 'linear-gradient(135deg, var(--primary-600), var(--primary-500))'
                    : 'var(--bg-tertiary)',
                  color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                  border: msg.sender === 'assistant' ? '1px solid var(--border-color)' : 'none',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {msg.text}

                {/* Sources Badges */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>Sources:</span>
                    {msg.sources.map((src, i) => (
                      <span key={i} style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(99,102,241,0.15)', color: 'var(--primary-400)',
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}>
                        <ExternalLink size={10} /> {src.type} {src.id ? `#${src.id}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggestions chips from assistant */}
              {msg.suggestions && msg.suggestions.length > 0 && msg === messages[messages.length - 1] && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, maxWidth: '90%' }}>
                  {msg.suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      className="chip-hover"
                      onClick={() => handleSend(sug)}
                      style={{
                        padding: '6px 12px', borderRadius: 16,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                        fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Lightbulb size={12} color="#f59e0b" /> {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13, padding: '8px 12px' }}>
              <Sparkles size={16} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--primary-400)' }} />
              <span>Analyzing digital twin multimodal stream...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ display: 'flex', gap: 8 }}
          >
            <input
              id="copilot-chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Copilot about engagement, confusion, or students..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              id="btn-send-copilot"
              type="submit"
              disabled={isLoading || !inputText.trim()}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
                color: '#fff',
                cursor: isLoading || !inputText.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !inputText.trim() ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'opacity 0.2s',
              }}
            >
              <Send size={16} />
            </button>
          </form>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 8, textAlign: 'center' }}>
            Tip: Press <kbd style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 3 }}>Ctrl+K</kbd> anywhere to toggle Copilot
          </div>
        </div>
      </div>
    </div>
  );
}
