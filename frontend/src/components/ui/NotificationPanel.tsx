import { useRef, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Bell, BellOff, X, Check } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import type { Notification } from '../../types';

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const getIconForType = (type: Notification['type']) => {
  switch (type) {
    case 'alert': return <AlertTriangle size={18} color="var(--danger)" />;
    case 'warning': return <AlertCircle size={18} color="#f59e0b" />;
    case 'info': return <Info size={18} color="var(--primary-500)" />;
    case 'success': return <CheckCircle size={18} color="var(--success)" />;
  }
};

const getColorForType = (type: Notification['type']) => {
  switch (type) {
    case 'alert': return 'var(--danger)';
    case 'warning': return '#f59e0b';
    case 'info': return 'var(--primary-500)';
    case 'success': return 'var(--success)';
  }
};

export default function NotificationPanel() {
  const { notifications, unreadCount, panelOpen, setPanelOpen, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const bellBtn = document.getElementById('btn-notifications');
        if (bellBtn && !bellBtn.contains(event.target as Node)) {
          setPanelOpen(false);
        }
      }
    };

    if (panelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [panelOpen, setPanelOpen]);

  if (!panelOpen) return null;

  return (
    <div
      ref={panelRef}
      id="notification-panel"
      style={{
        position: 'absolute',
        top: '60px',
        right: '0px',
        width: '400px',
        maxHeight: '80vh',
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden',
        animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>
        {`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .notification-item {
            transition: background 0.2s ease;
          }
          .notification-item:hover {
            background: var(--bg-tertiary) !important;
          }
        `}
      </style>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="var(--text-primary)" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</h3>
          {unreadCount > 0 && (
            <span style={{
              background: 'var(--primary-500)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '12px',
            }}>
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            id="btn-mark-all-read"
            onClick={markAllAsRead}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-500)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{
        overflowY: 'auto',
        flex: 1,
        maxHeight: 'calc(80vh - 110px)',
      }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <BellOff size={48} style={{ margin: '0 auto 16px', opacity: 0.5, display: 'block' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="notification-item"
                onClick={() => !notification.read && markAsRead(notification.id)}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-color)',
                  borderLeft: `4px solid ${getColorForType(notification.type)}`,
                  display: 'flex',
                  gap: '12px',
                  cursor: notification.read ? 'default' : 'pointer',
                  opacity: notification.read ? 0.7 : 1,
                  position: 'relative',
                }}
              >
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  {getIconForType(notification.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: notification.read ? 500 : 600,
                      color: 'var(--text-primary)',
                    }}>
                      {notification.title}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {formatTimeAgo(notification.timestamp)}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                  }}>
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <div style={{
                    position: 'absolute',
                    top: '22px',
                    right: '20px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--primary-500)',
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          textAlign: 'center',
        }}>
          <button
            id="btn-clear-notifications"
            onClick={clearAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '6px',
            }}
          >
            <X size={14} /> Clear All
          </button>
        </div>
      )}
    </div>
  );
}
