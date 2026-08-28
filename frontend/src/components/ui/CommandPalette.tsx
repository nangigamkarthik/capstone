import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Building2, Video, Box, BarChart3, Clock, FileText, FlaskConical, Settings, Shield, User, Sparkles, Sun, Download, HelpCircle } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useCopilotStore } from '../../stores/copilotStore';
import { generatePDFReport } from '../../utils/pdfGenerator';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Students' | 'Actions';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toggleTheme } = useThemeStore();
  const { toggleCopilot } = useCopilotStore();

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dash', category: 'Navigation', title: 'Dashboard', subtitle: 'Overview stats & classroom telemetry', icon: <LayoutDashboard size={18} />, action: () => navigate('/') },
    { id: 'nav-campus', category: 'Navigation', title: 'Campus Map & 2D Floorplan', subtitle: 'Multi-classroom floorplan & room telemetry', icon: <Building2 size={18} />, action: () => navigate('/campus') },
    { id: 'nav-live', category: 'Navigation', title: 'Live Classroom', subtitle: 'Real-time multi-modal monitoring', icon: <Video size={18} />, action: () => navigate('/live') },
    { id: 'nav-twin', category: 'Navigation', title: 'Digital Twin', subtitle: '3D Spatial classroom & heatmaps', icon: <Box size={18} />, action: () => navigate('/twin') },
    { id: 'nav-analytics', category: 'Navigation', title: 'Analytics & Leaderboard', subtitle: 'Comparative benchmarks & rankings', icon: <BarChart3 size={18} />, action: () => navigate('/analytics') },
    { id: 'nav-replay', category: 'Navigation', title: 'Replay Session', subtitle: 'Timeline scrubber & events', icon: <Clock size={18} />, action: () => navigate('/replay') },
    { id: 'nav-reports', category: 'Navigation', title: 'Reports & Exports', subtitle: 'PDF report generator & downloads', icon: <FileText size={18} />, action: () => navigate('/reports') },
    { id: 'nav-research', category: 'Navigation', title: 'Research & Knowledge Graph', subtitle: 'Model benchmarks & concept graph', icon: <FlaskConical size={18} />, action: () => navigate('/research') },
    { id: 'nav-settings', category: 'Navigation', title: 'Settings', subtitle: 'System thresholds & notifications', icon: <Settings size={18} />, action: () => navigate('/settings') },
    { id: 'nav-admin', category: 'Navigation', title: 'Admin Control', subtitle: 'User management & security logs', icon: <Shield size={18} />, action: () => navigate('/admin') },

    // Students
    { id: 'stu-1', category: 'Students', title: 'Alice Smith (STU-001)', subtitle: 'High Performer • 85% Engagement', icon: <User size={18} />, action: () => navigate('/student/1') },
    { id: 'stu-2', category: 'Students', title: 'Bob Jones (STU-002)', subtitle: 'At-Risk • 42% Engagement', icon: <User size={18} />, action: () => navigate('/student/2') },
    { id: 'stu-3', category: 'Students', title: 'Carol Williams (STU-003)', subtitle: 'Average • 78% Engagement', icon: <User size={18} />, action: () => navigate('/student/3') },
    { id: 'stu-4', category: 'Students', title: 'David Miller (STU-004)', subtitle: 'Top Focus • 91% Engagement', icon: <User size={18} />, action: () => navigate('/student/4') },

    // Actions
    { id: 'act-copilot', category: 'Actions', title: 'Open AI Copilot Assistant', subtitle: 'RAG natural language Q&A', icon: <Sparkles size={18} />, action: () => toggleCopilot() },
    { id: 'act-theme', category: 'Actions', title: 'Toggle Light/Dark Theme', subtitle: 'Switch color theme', icon: <Sun size={18} />, action: () => toggleTheme() },
    {
      id: 'act-pdf', category: 'Actions', title: 'Quick PDF Report Generation', subtitle: 'Export summary PDF', icon: <Download size={18} />, action: () => {
        generatePDFReport({
          title: 'Quick Executive Summary Report', course: 'CS301 Data Structures', date: new Date().toLocaleDateString(), type: 'engagement',
          summary: 'Command palette quick-generated lecture summary.',
          metrics: [{ label: 'Avg Engagement', value: '78%' }, { label: 'Attendance', value: '94%' }],
          recommendations: ['Maintain active Q&A check-ins.'],
        });
      }
    },
    { id: 'act-tour', category: 'Actions', title: 'Start Interactive Tour', subtitle: 'Guided walkthrough', icon: <HelpCircle size={18} />, action: () => window.dispatchEvent(new Event('start-tour')) },
  ];

  const filteredCommands = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    (c.subtitle && c.subtitle.toLowerCase().includes(query.toLowerCase())) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '80px',
        background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
    >
      <div
        id="command-palette-modal"
        style={{
          width: '100%', maxWidth: '580px',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 16, boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Input Bar */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-secondary)',
        }}>
          <Search size={20} color="var(--primary-400)" />
          <input
            ref={inputRef}
            id="input-command-palette"
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search students, pages, actions... (Esc to close)"
            style={{
              flex: 1, background: 'none', border: 'none', color: 'var(--text-primary)',
              fontSize: 15, outline: 'none', fontWeight: 500,
            }}
          />
          <span style={{ fontSize: 11, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
            ESC
          </span>
        </div>

        {/* Results Stream */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
              No matching commands or students found.
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  id={`cmd-item-${cmd.id}`}
                  onClick={() => { cmd.action(); setIsOpen(false); }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: isSelected ? 'rgba(99,102,241,0.15)' : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: isSelected ? 'var(--primary-500)' : 'var(--bg-tertiary)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.15s',
                  }}>
                    {cmd.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? 'var(--primary-400)' : 'var(--text-primary)' }}>
                      {cmd.title}
                    </div>
                    {cmd.subtitle && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cmd.subtitle}</div>
                    )}
                  </div>

                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between',
          fontSize: 11, color: 'var(--text-secondary)',
        }}>
          <div>Use <kbd style={{ background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: 3 }}>↑</kbd> <kbd style={{ background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: 3 }}>↓</kbd> to navigate</div>
          <div><kbd style={{ background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: 3 }}>↵ Enter</kbd> to select</div>
        </div>
      </div>
    </div>
  );
}
