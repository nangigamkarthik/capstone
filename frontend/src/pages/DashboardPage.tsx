import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Video, Activity, AlertTriangle, TrendingUp, Eye,
  GripVertical, EyeOff, RotateCcw, Settings2, Check, X, Clock
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { EngagementLineChart, EmotionDoughnut, AttendanceBarChart } from '../components/charts/Charts';
import { useDashboardStore, type DashboardWidget } from '../stores/dashboardStore';
import { useAuthStore } from '../stores/authStore';

/* ── Mock data ── */
const mockEngagement = { labels: ['10:00','10:05','10:10','10:15','10:20','10:25','10:30','10:35','10:40','10:45','10:50','10:55'], data: [82,85,78,72,68,65,70,75,80,77,74,79] };
const mockEmotion = { happy:0.18, neutral:0.52, confused:0.12, interested:0.10, bored:0.05, frustrated:0.02, surprised:0.01 };
const mockAttendance = { labels:['Mon','Tue','Wed','Thu','Fri'], data:[94,97,92,88,95] };

const statData: Record<string, { title: string; value: string; delta: string; icon: ReactNode; color: string }> = {
  'stat-students':   { title:'Total Students',  value:'156',   delta:'+12',        icon:<Users size={18}/>,         color:'var(--primary-500)' },
  'stat-active':     { title:'Active Classes',   value:'4',     delta:'Live',       icon:<Video size={18}/>,         color:'var(--secondary-500)' },
  'stat-engagement': { title:'Avg Engagement',   value:'73.2%', delta:'+2.4%',      icon:<Activity size={18}/>,      color:'var(--accent-500)' },
  'stat-attention':  { title:'Avg Attention',    value:'68.5%', delta:'-1.2%',      icon:<Eye size={18}/>,           color:'#3b82f6' },
  'stat-attendance': { title:'Attendance Rate',  value:'94.1%', delta:'+0.8%',      icon:<TrendingUp size={18}/>,    color:'var(--success)' },
  'stat-alerts':     { title:'Active Alerts',    value:'7',     delta:'3 critical', icon:<AlertTriangle size={18}/>, color:'var(--danger)' },
};

const atRiskStudents = [
  { id: 2, name:'Bob Jones',       risk:82.5, reasons:['Frequent phone usage','Distraction spikes'] },
  { id: 3, name:'Carol Williams',  risk:68.2, reasons:['Attendance drop','Sleeping detected'] },
  { id: 1, name:'Alice Smith',     risk:25.0, reasons:['Minor lookaways','Overall strong'] },
];

/* ── Component ── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { widgets, editMode, toggleEditMode, toggleWidget, reorderWidgets, resetLayout } = useDashboardStore();
  const { user } = useAuthStore();
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragCounter = useRef(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const visibleWidgets = editMode ? widgets : widgets.filter(w => w.visible);

  /* ── Drag handlers ── */
  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDragIdx(null);
    setOverIdx(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (idx: number) => (_e: React.DragEvent) => {
    dragCounter.current++;
    setOverIdx(idx);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setOverIdx(null);
      dragCounter.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (toIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromIdx = dragIdx ?? parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIdx) && fromIdx !== toIdx) {
      reorderWidgets(fromIdx, toIdx);
    }
    setDragIdx(null);
    setOverIdx(null);
    dragCounter.current = 0;
  };

  /* ── Render a single widget by id ── */
  const renderWidgetContent = (w: DashboardWidget): ReactNode => {
    const sd = statData[w.id];
    if (sd) {
      return (
        <div className="stat-card-wrapper" style={{ height: '100%' }}>
          <StatCard id={w.id} title={sd.title} icon={<span style={{ color: sd.color }}>{sd.icon}</span>}>
            <div style={{ fontSize:28, fontWeight:800, color:'var(--text-primary)' }}>{sd.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize:12, color: sd.delta === 'Live' || sd.delta.startsWith('-') && !sd.delta.includes('%') ? 'var(--danger)' : 'var(--success)', fontWeight:600 }}>
              {sd.delta === 'Live' && <span className="pulse-dot"></span>}
              {sd.delta}
            </div>
          </StatCard>
        </div>
      );
    }
    if (w.id === 'chart-engagement') {
      return (
        <StatCard id={w.id} title="Engagement Timeline" subtitle="Last 60 minutes">
          <EngagementLineChart labels={mockEngagement.labels} data={mockEngagement.data} />
        </StatCard>
      );
    }
    if (w.id === 'chart-emotions') {
      return (
        <StatCard id={w.id} title="Emotion Distribution" subtitle="Current class">
          <EmotionDoughnut distribution={mockEmotion} />
        </StatCard>
      );
    }
    if (w.id === 'chart-attendance') {
      return (
        <StatCard id={w.id} title="Weekly Attendance" subtitle="This week">
          <AttendanceBarChart labels={mockAttendance.labels} data={mockAttendance.data} />
        </StatCard>
      );
    }
    if (w.id === 'panel-risk') {
      return (
        <StatCard id={w.id} title="At-Risk Students" subtitle="Predictions" icon={<AlertTriangle size={18} color="var(--danger)" />}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {atRiskStudents.map((s) => (
              <div
                key={s.id}
                id={`student-risk-${s.id}`}
                onClick={() => navigate(`/student/${s.id}`)}
                style={{
                  display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
                  borderRadius:12, background:'var(--bg-tertiary)', cursor:'pointer',
                  transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid rgba(255,255,255,0.02)',
                  position: 'relative', overflow: 'hidden'
                }}
                className="at-risk-card"
              >
                {/* Severity gradient bar */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.risk > 75 ? 'linear-gradient(to bottom, #ef4444, #991b1b)' : s.risk > 50 ? 'linear-gradient(to bottom, #f59e0b, #b45309)' : 'linear-gradient(to bottom, #22c55e, #166534)' }} />
                
                <div style={{
                  width:40, height:40, borderRadius:'50%',
                  background:`linear-gradient(135deg, hsl(${360-s.risk*3.6},80%,50%), hsl(${360-s.risk*3.6},80%,30%))`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontWeight:700, fontSize:14,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                  {s.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{s.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop: 2 }}>{s.reasons.join(' • ')}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.risk > 75 ? '#ef4444' : s.risk > 50 ? '#f59e0b' : '#22c55e' }}>
                    {Math.round(s.risk)}%
                  </div>
                  <div style={{ fontSize:10, textTransform: 'uppercase', letterSpacing: '0.05em', color:'var(--text-secondary)' }}>Risk Score</div>
                </div>
              </div>
            ))}
          </div>
        </StatCard>
      );
    }
    return null;
  };

  /* ── Inline style helpers ── */
  const editToolbarStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', borderRadius: 14,
    background: editMode
      ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(20,184,166,0.08))'
      : 'transparent',
    border: editMode ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
    transition: 'all 0.3s ease',
    marginBottom: 4,
  };

  const btnStyle = (variant: 'primary' | 'ghost' | 'danger'): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s ease', border: 'none',
    ...(variant === 'primary' ? {
      background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
      color: '#fff',
    } : variant === 'danger' ? {
      background: 'rgba(239,68,68,0.12)', color: 'var(--danger)',
    } : {
      background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
    }),
  });

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <style>{`
        .dw-drag-over {
          outline: 2px dashed var(--primary-500) !important;
          outline-offset: 4px;
          background: rgba(99,102,241,0.06) !important;
          border-radius: 14px;
        }
        .dw-hidden-overlay {
          position: relative;
          opacity: 0.35;
          pointer-events: auto;
        }
        .dw-hidden-overlay::after {
          content: 'HIDDEN';
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
          background: repeating-linear-gradient(
            -45deg,
            transparent, transparent 8px,
            rgba(148,163,184,0.06) 8px,
            rgba(148,163,184,0.06) 16px
          );
          border-radius: 14px;
          pointer-events: none;
        }
        .dw-grip:hover { color: var(--primary-400) !important; }
        .dw-widget-wrapper { transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .dw-widget-wrapper:hover { transform: translateY(-4px); }
        
        .pulse-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #ef4444;
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          animation: pulse-red 1.5s infinite;
        }
        
        @keyframes pulse-red {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .stat-card-wrapper > div {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card-wrapper:hover > div {
          background: linear-gradient(135deg, var(--bg-secondary), rgba(255,255,255,0.03));
          border-color: rgba(255,255,255,0.1);
        }

        .at-risk-card:hover {
          transform: translateX(6px);
          background: linear-gradient(90deg, var(--bg-tertiary), rgba(255,255,255,0.03));
        }

        .section-divider {
          height: 1px;
          width: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          margin: 10px 0;
        }
      `}</style>

      {/* ── Welcome Banner ── */}
      <div style={{
        padding: '28px 32px',
        borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(20,184,166,0.08))',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        {/* Pattern overlay */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div style={{ zIndex: 1 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #818cf8, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.fullName?.split(' ')[0] || 'Instructor'}!
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}>
            Here's what's happening in your classrooms today.
          </p>
        </div>
        <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
          <Clock size={20} style={{ color: 'var(--primary-400)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* ── Edit Toolbar ── */}
      <div style={editToolbarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings2 size={18} style={{ color: editMode ? 'var(--primary-400)' : 'var(--text-secondary)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {editMode ? 'Customizing Layout' : 'Dashboard Overview'}
          </span>
          {editMode && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
              background: 'rgba(99,102,241,0.15)', color: 'var(--primary-400)',
            }}>
              Drag to reorder • Click eye to toggle
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editMode && (
            <button
              id="btn-reset-layout"
              onClick={resetLayout}
              style={btnStyle('danger')}
              title="Reset to default layout"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
          <button
            id="btn-toggle-edit-mode"
            onClick={toggleEditMode}
            style={btnStyle(editMode ? 'primary' : 'ghost')}
          >
            {editMode ? <><Check size={14} /> Done</> : <><Settings2 size={14} /> Customize</>}
          </button>
        </div>
      </div>

      {/* ── Widget Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 20,
      }}>
        {visibleWidgets.map((w, idx) => {
          const isStatRow = w.group === 'stat';
          const isDragTarget = overIdx === idx && dragIdx !== idx;
          const isHidden = !w.visible;

          const gridStyles: React.CSSProperties = isStatRow
            ? {}
            : { gridColumn: w.colSpan === 2 ? 'span 2' : 'span 1' };

          return (
            <div
              key={w.id}
              className={`dw-widget-wrapper${isDragTarget ? ' dw-drag-over' : ''}${isHidden ? ' dw-hidden-overlay' : ''}`}
              style={{ position: 'relative', ...gridStyles }}
              draggable={editMode}
              onDragStart={editMode ? handleDragStart(idx) : undefined}
              onDragEnd={editMode ? handleDragEnd : undefined}
              onDragEnter={editMode ? handleDragEnter(idx) : undefined}
              onDragLeave={editMode ? handleDragLeave : undefined}
              onDragOver={editMode ? handleDragOver : undefined}
              onDrop={editMode ? handleDrop(idx) : undefined}
            >
              {editMode && (
                <div style={{
                  position: 'absolute', top: 12, right: 12, zIndex: 10,
                  display: 'flex', gap: 6,
                }}>
                  <button
                    title={w.visible ? 'Hide widget' : 'Show widget'}
                    onClick={(e) => { e.stopPropagation(); toggleWidget(w.id); }}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: w.visible ? 'rgba(15,23,42,0.8)' : 'rgba(239,68,68,0.2)',
                      color: w.visible ? 'var(--text-secondary)' : 'var(--danger)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(4px)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {w.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <div
                    className="dw-grip"
                    title="Drag to reorder"
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'rgba(15,23,42,0.8)',
                      color: 'var(--text-secondary)',
                      backdropFilter: 'blur(4px)',
                      cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <GripVertical size={13} />
                  </div>
                </div>
              )}

              {renderWidgetContent(w)}
            </div>
          );
        })}
      </div>

      {/* ── Hidden widget inventory (edit mode) ── */}
      {editMode && widgets.filter(w => !w.visible).length > 0 && (
        <div style={{
          padding: '20px 24px', borderRadius: 16,
          border: '1px dashed rgba(99,102,241,0.3)',
          background: 'rgba(99,102,241,0.03)',
          marginTop: 16
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hidden Widgets — Click <X size={12} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> to restore
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {widgets.filter(w => !w.visible).map(w => (
              <button
                key={w.id}
                onClick={() => toggleWidget(w.id)}
                style={{
                  padding: '8px 16px', borderRadius: 10,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.color = 'var(--primary-400)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <EyeOff size={14} /> {w.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
