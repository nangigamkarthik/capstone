import { useLocation } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Mountain, Coffee, LogOut, Sparkles, Zap } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';
import { useCopilotStore } from '../../stores/copilotStore';
import NotificationPanel from '../ui/NotificationPanel';

const pageTitles: Record<string, { label: string; emoji: string }> = {
  '/': { label: 'Dashboard', emoji: '📊' },
  '/live': { label: 'Live Classroom', emoji: '🎥' },
  '/twin': { label: 'Digital Twin', emoji: '🧊' },
  '/analytics': { label: 'Analytics', emoji: '📈' },
  '/replay': { label: 'Replay', emoji: '⏪' },
  '/reports': { label: 'Reports', emoji: '📄' },
  '/research': { label: 'Research', emoji: '🔬' },
  '/settings': { label: 'Settings', emoji: '⚙️' },
  '/admin': { label: 'Admin', emoji: '🛡️' },
};

export default function Header() {
  const location = useLocation();
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const { unreadCount, togglePanel } = useNotificationStore();
  const { toggleCopilot } = useCopilotStore();
  const { user, logout } = useAuthStore();

  const pageInfo = pageTitles[location.pathname] || (location.pathname.startsWith('/student')
    ? { label: 'Student Profile', emoji: '👤' }
    : { label: 'Dashboard', emoji: '📊' });

  const themeIcon = resolvedTheme === 'dark' ? <Sun size={18} />
    : resolvedTheme === 'light' ? <Moon size={18} />
    : resolvedTheme === 'midnight' ? <Mountain size={18} />
    : <Coffee size={18} />;

  return (
    <header id="main-header" className="glass-card" style={{
      padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none',
      position: 'sticky', top: 0, zIndex: 20,
      borderBottom: '1px solid var(--border-color)',
    }}>
      <style>{`
        .hdr-icon-btn {
          width: 38px; height: 38px; border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .hdr-icon-btn:hover {
          background: var(--primary-500); color: #fff;
          border-color: var(--primary-500);
          transform: scale(1.08);
          box-shadow: 0 4px 14px rgba(99,102,241,0.3);
        }
        .hdr-copilot-btn {
          display: flex; align-items: center; gap: 6;
          padding: 8px 16px; border-radius: 10;
          border: 1px solid transparent;
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(20,184,166,0.1));
          color: var(--primary-400); font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.25s ease;
          position: relative; overflow: hidden;
        }
        .hdr-copilot-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, var(--primary-600), var(--secondary-500));
          opacity: 0; transition: opacity 0.25s;
        }
        .hdr-copilot-btn:hover::before { opacity: 1; }
        .hdr-copilot-btn:hover {
          color: #fff; border-color: transparent;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.35);
        }
        .hdr-copilot-btn > * { position: relative; z-index: 1; }
        .hdr-search-input {
          padding: 9px 12px 9px 38px; border-radius: 10;
          border: 1px solid var(--border-color);
          background: var(--bg-tertiary); color: var(--text-primary);
          font-size: 13px; width: 200px; outline: none;
          transition: all 0.2s ease;
        }
        .hdr-search-input:focus {
          border-color: var(--primary-400); width: 260px;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .hdr-user-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: 12px;
          background: linear-gradient(135deg, var(--primary-400), var(--secondary-400));
          box-shadow: 0 0 0 2px var(--bg-secondary), 0 0 0 4px var(--primary-500);
          flex-shrink: 0;
        }
        .hdr-notif-badge {
          position: absolute; top: -4px; right: -4px;
          min-width: 18px; height: 18px; border-radius: 9px;
          background: var(--danger); color: #fff;
          font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          padding: 0 4px;
          box-shadow: 0 2px 6px rgba(239,68,68,0.4);
          animation: pulseGlow 2s infinite;
        }
      `}</style>

      {/* Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>{pageInfo.emoji}</span>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{pageInfo.label}</h1>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={10} style={{ color: 'var(--success)' }} />
            <span>System Online</span>
            <span style={{ margin: '0 4px', opacity: 0.3 }}>|</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 1 }} />
          <input id="header-search" className="hdr-search-input" placeholder="Search anything..." />
        </div>

        {/* AI Copilot Trigger */}
        <button id="btn-copilot-header" className="hdr-copilot-btn" onClick={toggleCopilot} title="Open AI Copilot (Ctrl+K)">
          <Sparkles size={15} /> <span>Copilot</span>
          <kbd style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.15)', marginLeft: 2 }}>⌘K</kbd>
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button id="btn-notifications" className="hdr-icon-btn" onClick={togglePanel} style={{ position: 'relative' }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="hdr-notif-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel />
        </div>

        {/* Theme */}
        <button id="btn-theme-toggle" className="hdr-icon-btn" onClick={toggleTheme} title={`Current: ${resolvedTheme}`}>
          {themeIcon}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, transparent, var(--border-color), transparent)' }} />

        {/* User Info + Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="hdr-user-avatar">
              {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user.fullName}</div>
              <span style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                padding: '1px 6px', borderRadius: 4, letterSpacing: '0.05em',
                background: user.role === 'admin' ? 'rgba(99,102,241,0.15)' : 'rgba(20,184,166,0.15)',
                color: user.role === 'admin' ? 'var(--primary-400)' : 'var(--secondary-400)',
              }}>{user.role}</span>
            </div>
            <button id="btn-logout" className="hdr-icon-btn" onClick={logout} title="Sign Out"
              style={{ width: 32, height: 32, borderRadius: 8 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
