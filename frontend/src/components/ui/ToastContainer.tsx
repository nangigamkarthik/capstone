import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import type { Toast } from '../../types';

const getIconForType = (type: Toast['type']) => {
  switch (type) {
    case 'alert': return <AlertTriangle size={20} color="var(--danger)" />;
    case 'warning': return <AlertCircle size={20} color="#f59e0b" />;
    case 'info': return <Info size={20} color="var(--primary-500)" />;
    case 'success': return <CheckCircle size={20} color="var(--success)" />;
  }
};

const getColorForType = (type: Toast['type']) => {
  switch (type) {
    case 'alert': return 'var(--danger)';
    case 'warning': return '#f59e0b';
    case 'info': return 'var(--primary-500)';
    case 'success': return 'var(--success)';
  }
};

export default function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes progressShrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>

      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            width: '320px',
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border-color)',
            borderLeft: `4px solid ${getColorForType(toast.type)}`,
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            pointerEvents: 'auto',
            animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
          }}
        >
          <div style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              {getIconForType(toast.type)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {toast.title}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                borderRadius: '4px',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ height: '3px', background: 'var(--bg-tertiary)', width: '100%' }}>
            <div style={{
              height: '100%',
              background: getColorForType(toast.type),
              animation: 'progressShrink 5s linear forwards',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
