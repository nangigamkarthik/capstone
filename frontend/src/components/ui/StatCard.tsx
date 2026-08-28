import { type ReactNode } from 'react';

interface Props { title: string; subtitle?: string; icon?: ReactNode; action?: ReactNode; children: ReactNode; style?: React.CSSProperties; id?: string; }

export default function StatCard({ title, subtitle, icon, action, children, style, id }: Props) {
  return (
    <div id={id} className="glass-card animate-slide-up" style={{
      padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
      ...style,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {action}
          {icon && <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>{icon}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}
