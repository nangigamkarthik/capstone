import { useLocation } from 'react-router-dom';
import { Search, Bell, Sun, Moon, LogOut, Sparkles } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';
import { useCopilotStore } from '../../stores/copilotStore';
import NotificationPanel from '../ui/NotificationPanel';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard', '/live': 'Live Classroom', '/twin': 'Digital Twin',
  '/analytics': 'Analytics', '/replay': 'Replay', '/reports': 'Reports',
  '/research': 'Research', '/settings': 'Settings', '/admin': 'Admin',
};

export default function Header() {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { unreadCount, togglePanel } = useNotificationStore();
  const { toggleCopilot } = useCopilotStore();
  const { user, logout } = useAuthStore();
  const title = pageTitles[location.pathname] || (location.pathname.startsWith('/student') ? 'Student Profile' : 'Dashboard');

  return (
    <header id="main-header" className="glass-card" style={{
      padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input id="header-search" placeholder="Search..." style={{
            padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13, width: 220, outline: 'none',
          }} />
        </div>

        {/* AI Copilot Trigger */}
        <button
          id="btn-copilot-header"
          onClick={toggleCopilot}
          title="Open AI Copilot (Ctrl+K)"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            border: '1px solid rgba(99,102,241,0.3)',
            background: 'rgba(99,102,241,0.12)',
            color: 'var(--primary-400)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <Sparkles size={16} /> Copilot
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button id="btn-notifications" onClick={togglePanel} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel />
        </div>

        {/* Theme */}
        <button id="btn-theme-toggle" onClick={toggleTheme} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4,
          transition: 'transform 0.3s ease',
        }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border-color)' }} />

        {/* User Info + Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-400), var(--secondary-400))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 600, fontSize: 13,
            }}>
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
            <button id="btn-logout" onClick={logout} title="Sign Out" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: 4,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
