import { type ReactNode, useState } from 'react';

interface Props { title: string; subtitle?: string; icon?: ReactNode; action?: ReactNode; children: ReactNode; style?: React.CSSProperties; id?: string; accentColor?: string; }

export default function StatCard({ title, subtitle, icon, action, children, style, id, accentColor }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      id={id} 
      className="glass-card animate-slide-up" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
        position: 'relative',
        overflow: 'hidden',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 12px 40px var(--shadow-color), 0 0 15px var(--primary-200)' : '0 8px 32px var(--shadow-color)',
        borderColor: isHovered ? 'var(--primary-400)' : 'var(--glass-border)',
        transition: 'all 0.3s ease',
        ...style,
      }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: accentColor ? accentColor : 'linear-gradient(90deg, var(--primary-500), var(--secondary-500))',
        opacity: isHovered ? 1 : 0.7,
        transition: 'opacity 0.3s ease'
      }} />
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
