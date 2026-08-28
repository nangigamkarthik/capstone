import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Video, Box, BarChart3, Clock, FileText, FlaskConical, Settings, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useClassroomStore } from '../../stores/classroomStore';
import { useAuthStore } from '../../stores/authStore';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/live', label: 'Live Classroom', icon: Video },
  { path: '/twin', label: 'Digital Twin', icon: Box },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/replay', label: 'Replay', icon: Clock },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/research', label: 'Research', icon: FlaskConical },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/admin', label: 'Admin', icon: Shield },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useClassroomStore();
  const { user } = useAuthStore();
  const location = useLocation();

  const displayName = user?.fullName || 'Admin';
  const displayRole = user?.role || 'administrator';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <aside
      id="main-sidebar"
      style={{
        width: sidebarCollapsed ? 72 : 280,
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ padding: sidebarCollapsed ? '20px 12px' : '20px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🧠</div>
        {!sidebarCollapsed && (
          <span style={{ fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg, var(--primary-400), var(--secondary-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CogniClass</span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              id={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: sidebarCollapsed ? '12px 16px' : '12px 16px',
                borderRadius: 10, textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(135deg, var(--primary-600), var(--primary-500))' : 'transparent',
                fontWeight: isActive ? 600 : 400, fontSize: 14,
                transition: 'all 0.2s ease',
              }}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse button */}
      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        style={{
          position: 'absolute', top: 28, right: -12,
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--primary-500)', color: '#fff',
          border: 'none', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 10,
        }}
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* User */}
      <div style={{ padding: sidebarCollapsed ? '16px 12px' : '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-400), var(--accent-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
          {initials}
        </div>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{displayName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{displayRole}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
