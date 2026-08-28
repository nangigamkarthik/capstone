import { useState, useEffect, useRef } from 'react';
import {
  Mic, Sparkles, Download, Search, Tag,
  Play, Pause, Copy, Check
} from 'lucide-react';
import { useCopilotStore } from '../../stores/copilotStore';

export interface TranscriptUtterance {
  id: string;
  timestamp: string;
  speaker: 'teacher' | 'student';
  speakerName: string;
  avatarColor: string;
  text: string;
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'confused';
  confidence: number;
}

const INITIAL_TRANSCRIPT: TranscriptUtterance[] = [
  {
    id: 't-1', timestamp: '10:00:15', speaker: 'teacher', speakerName: 'Prof. Alan Turing',
    avatarColor: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
    text: "Good morning everyone. Today we are diving deep into AVL tree rotations and self-balancing binary search trees.",
    keywords: ['AVL Trees', 'Rotations', 'BST'], sentiment: 'positive', confidence: 0.98
  },
  {
    id: 't-2', timestamp: '10:02:40', speaker: 'student', speakerName: 'Bob Jones (Desk 14)',
    avatarColor: 'linear-gradient(135deg, #f59e0b, #d97706)',
    text: "Professor, could you clarify when a double right-left rotation is required instead of a single rotation?",
    keywords: ['Double Rotation', 'Right-Left'], sentiment: 'confused', confidence: 0.94
  },
  {
    id: 't-3', timestamp: '10:03:10', speaker: 'teacher', speakerName: 'Prof. Alan Turing',
    avatarColor: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
    text: "Great question Bob. A double rotation is necessary when the insertion happens in the inner subtree of a heavy child.",
    keywords: ['Subtree Balance', 'Inner Insertion'], sentiment: 'positive', confidence: 0.97
  },
  {
    id: 't-4', timestamp: '10:05:22', speaker: 'student', speakerName: 'Alice Smith (Desk 4)',
    avatarColor: 'linear-gradient(135deg, #22c55e, #15803d)',
    text: "So the balance factor condition is when the height difference between left and right subtrees exceeds one?",
    keywords: ['Balance Factor', 'Tree Height'], sentiment: 'neutral', confidence: 0.99
  },
];

const SIMULATED_PHRASES: Omit<TranscriptUtterance, 'id' | 'timestamp'>[] = [
  {
    speaker: 'teacher', speakerName: 'Prof. Alan Turing',
    avatarColor: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
    text: "Exactly, Alice. The balance factor MUST remain in the range of negative one to positive one.",
    keywords: ['Balance Condition', 'Range [-1, 1]'], sentiment: 'positive', confidence: 0.98
  },
  {
    speaker: 'student', speakerName: 'Carol Williams (Desk 8)',
    avatarColor: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    text: "What is the worst-case time complexity for lookup operations in an AVL tree?",
    keywords: ['Complexity', 'O(log n)'], sentiment: 'confused', confidence: 0.95
  },
  {
    speaker: 'teacher', speakerName: 'Prof. Alan Turing',
    avatarColor: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
    text: "Because height is strictly logarithmic, lookup is guaranteed to be Big O of log N.",
    keywords: ['Logarithmic Time', 'Guaranteed Search'], sentiment: 'positive', confidence: 0.99
  },
];

export default function LiveTranscriptPanel() {
  const [utterances, setUtterances] = useState<TranscriptUtterance[]>(INITIAL_TRANSCRIPT);
  const [isLiveStream, setIsLiveStream] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakerFilter, setSpeakerFilter] = useState<'all' | 'teacher' | 'student'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { sendMessage, toggleCopilot } = useCopilotStore();

  // Simulated live speech stream listener
  useEffect(() => {
    if (!isLiveStream) return;

    let idx = 0;
    const interval = setInterval(() => {
      const phrase = SIMULATED_PHRASES[idx % SIMULATED_PHRASES.length];
      const now = new Date();
      const newUtterance: TranscriptUtterance = {
        id: `t-live-${Date.now()}`,
        timestamp: now.toTimeString().substring(0, 8),
        ...phrase,
      };

      setUtterances((prev) => [...prev, newUtterance]);
      idx++;
    }, 6000);

    return () => clearInterval(interval);
  }, [isLiveStream]);

  // Auto scroll to bottom on new utterance
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [utterances]);

  const filteredUtterances = utterances.filter((u) => {
    const matchesSpeaker = speakerFilter === 'all' || u.speaker === speakerFilter;
    const matchesSearch =
      u.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.speakerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSpeaker && matchesSearch;
  });

  const handleCopyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAskCopilot = (text: string) => {
    toggleCopilot();
    sendMessage(`Explain this classroom transcript segment: "${text}"`);
  };

  const handleExportTranscript = () => {
    const content = utterances
      .map((u) => `[${u.timestamp}] ${u.speakerName}: ${u.text}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CogniClass_Transcript_${new Date().toISOString().substring(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', minHeight: 480 }}>
      <style>{`
        .transcript-item {
          transition: all 0.2s ease;
        }
        .transcript-item:hover {
          background: rgba(255,255,255,0.03) !important;
          border-color: rgba(99,102,241,0.2) !important;
        }
        .audio-bar {
          width: 3px;
          background: var(--primary-400);
          border-radius: 2px;
          animation: audioPulse 1.2s ease-in-out infinite alternate;
        }
        @keyframes audioPulse {
          0% { height: 4px; }
          100% { height: 18px; }
        }
      `}</style>

      {/* ── Panel Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <Mic size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Live Speech & Diarization</h3>
              {isLiveStream && (
                <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: 'var(--success)', padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="pulse-dot" style={{ width: 6, height: 6 }} /> WHISPER V3 LIVE
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Real-time automatic speech recognition & speaker classification</div>
          </div>
        </div>

        {/* Audio Waveform Spectrum simulation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isLiveStream && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 20, padding: '0 8px', borderRadius: 6, background: 'var(--bg-tertiary)' }}>
              {[0.4, 0.8, 0.3, 1.0, 0.6, 0.9, 0.5, 0.7].map((delay, i) => (
                <div key={i} className="audio-bar" style={{ animationDelay: `${delay}s` }} />
              ))}
            </div>
          )}

          <button
            onClick={() => setIsLiveStream(!isLiveStream)}
            title={isLiveStream ? 'Pause live stream' : 'Resume live stream'}
            style={{
              padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
              background: isLiveStream ? 'rgba(99,102,241,0.12)' : 'var(--bg-tertiary)',
              color: isLiveStream ? 'var(--primary-400)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {isLiveStream ? <Pause size={14} /> : <Play size={14} />}
            <span>{isLiveStream ? 'Live Stream' : 'Paused'}</span>
          </button>

          <button
            onClick={handleExportTranscript}
            title="Download full transcript text file"
            style={{
              padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
              background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <Download size={14} /> <span>Export</span>
          </button>
        </div>
      </div>

      {/* ── Search & Speaker Filters ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search words, speakers, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '7px 12px 7px 34px', borderRadius: 8,
              border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)', fontSize: 12, outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-tertiary)', padding: 3, borderRadius: 8, border: '1px solid var(--border-color)' }}>
          {(['all', 'teacher', 'student'] as const).map((sp) => (
            <button
              key={sp}
              onClick={() => setSpeakerFilter(sp)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                background: speakerFilter === sp ? 'var(--primary-600)' : 'transparent',
                color: speakerFilter === sp ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              {sp === 'all' ? 'All Speakers' : sp === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Students'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Transcript Utterance Stream ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
          paddingRight: 4, maxHeight: 420
        }}
      >
        {filteredUtterances.map((item) => (
          <div
            key={item.id}
            className="transcript-item"
            style={{
              padding: '12px 16px', borderRadius: 12,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              display: 'flex', flexDirection: 'column', gap: 8, position: 'relative'
            }}
          >
            {/* Utterance Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: item.avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 11, fontWeight: 700
                }}>
                  {item.speaker === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.speakerName}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginLeft: 8 }}>{item.timestamp}</span>
                </div>
              </div>

              {/* Badges & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.sentiment === 'confused' && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                    ❓ Confusion
                  </span>
                )}
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {(item.confidence * 100).toFixed(0)}% ASR
                </span>
                <button
                  onClick={() => handleCopyToClipboard(item.id, item.text)}
                  title="Copy segment text"
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}
                >
                  {copiedId === item.id ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                </button>
                <button
                  onClick={() => handleAskCopilot(item.text)}
                  title="Ask Copilot about this segment"
                  style={{
                    background: 'rgba(99,102,241,0.15)', border: 'none', color: 'var(--primary-400)',
                    borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 10, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 3
                  }}
                >
                  <Sparkles size={11} /> Copilot
                </button>
              </div>
            </div>

            {/* Speech Text */}
            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, paddingLeft: 38 }}>
              "{item.text}"
            </div>

            {/* Topic Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 38, marginTop: 2 }}>
              {item.keywords.map((kw, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                  background: 'rgba(99,102,241,0.1)', color: 'var(--primary-400)',
                  display: 'flex', alignItems: 'center', gap: 2
                }}>
                  <Tag size={9} /> #{kw}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
