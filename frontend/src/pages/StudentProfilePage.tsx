import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Award, TrendingUp, TrendingDown, AlertTriangle, Activity, Clock, Eye, BookOpen, User, Shield } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { EngagementLineChart, EmotionDoughnut, StudentRadar } from '../components/charts/Charts';

// Mock student data keyed by ID
const studentProfiles: Record<string, {
  name: string; code: string; enrolled: string; attendance: number;
  engagement: number; risk: number; totalLectures: number; riskTrend: 'improving' | 'declining' | 'stable';
  engagementHistory: number[]; radarMetrics: { label: string; value: number }[];
  emotions: Record<string, number>; riskFactors: { factor: string; weight: number; description: string }[];
  attendanceRecords: { date: string; course: string; status: 'present' | 'absent' | 'late'; checkIn: string }[];
  activities: { icon: string; description: string; time: string }[];
}> = {
  '1': {
    name: 'Alice Smith', code: 'STU-2024-001', enrolled: 'Aug 2024', attendance: 92,
    engagement: 78, risk: 22, totalLectures: 45, riskTrend: 'improving',
    engagementHistory: [72, 75, 78, 74, 80, 82, 76, 79, 83, 78],
    radarMetrics: [
      { label: 'Attention', value: 82 }, { label: 'Engagement', value: 78 },
      { label: 'Participation', value: 71 }, { label: 'Collaboration', value: 68 },
      { label: 'Focus', value: 85 }, { label: 'Interaction', value: 74 },
    ],
    emotions: { happy: 0.25, neutral: 0.45, confused: 0.08, interested: 0.15, bored: 0.03, frustrated: 0.02, surprised: 0.02 },
    riskFactors: [
      { factor: 'Attendance consistency', weight: 0.15, description: 'Regular class attendance pattern' },
      { factor: 'Engagement trend', weight: 0.25, description: 'Stable upward engagement trend' },
      { factor: 'Participation rate', weight: 0.20, description: 'Active classroom participation' },
    ],
    attendanceRecords: [
      { date: '2026-07-30', course: 'CS301 Data Structures', status: 'present', checkIn: '10:02 AM' },
      { date: '2026-07-29', course: 'MA201 Linear Algebra', status: 'present', checkIn: '09:58 AM' },
      { date: '2026-07-28', course: 'CS301 Data Structures', status: 'present', checkIn: '10:05 AM' },
      { date: '2026-07-25', course: 'CS401 Machine Learning', status: 'late', checkIn: '10:18 AM' },
      { date: '2026-07-24', course: 'MA201 Linear Algebra', status: 'present', checkIn: '09:55 AM' },
      { date: '2026-07-23', course: 'CS301 Data Structures', status: 'present', checkIn: '10:01 AM' },
      { date: '2026-07-22', course: 'CS401 Machine Learning', status: 'present', checkIn: '10:00 AM' },
      { date: '2026-07-21', course: 'MA201 Linear Algebra', status: 'absent', checkIn: '—' },
      { date: '2026-07-18', course: 'CS301 Data Structures', status: 'present', checkIn: '09:59 AM' },
      { date: '2026-07-17', course: 'CS401 Machine Learning', status: 'present', checkIn: '10:03 AM' },
    ],
    activities: [
      { icon: '✋', description: 'Raised hand during Q&A session', time: '10:32 AM' },
      { icon: '💻', description: 'Started using laptop for notes', time: '10:15 AM' },
      { icon: '✍️', description: 'Writing notes actively', time: '10:08 AM' },
      { icon: '👀', description: 'Focused on whiteboard', time: '10:02 AM' },
      { icon: '🤝', description: 'Collaborating with neighbor', time: '09:55 AM' },
      { icon: '📖', description: 'Reading reference material', time: '09:48 AM' },
      { icon: '👂', description: 'Active listening detected', time: '09:40 AM' },
      { icon: '💬', description: 'Participating in group discussion', time: '09:35 AM' },
    ],
  },
  '2': {
    name: 'Bob Jones', code: 'STU-2024-002', enrolled: 'Aug 2024', attendance: 67,
    engagement: 45, risk: 78, totalLectures: 45, riskTrend: 'declining',
    engagementHistory: [58, 52, 48, 50, 44, 42, 46, 40, 38, 45],
    radarMetrics: [
      { label: 'Attention', value: 42 }, { label: 'Engagement', value: 45 },
      { label: 'Participation', value: 30 }, { label: 'Collaboration', value: 35 },
      { label: 'Focus', value: 38 }, { label: 'Interaction', value: 28 },
    ],
    emotions: { happy: 0.08, neutral: 0.30, confused: 0.22, interested: 0.05, bored: 0.20, frustrated: 0.12, surprised: 0.03 },
    riskFactors: [
      { factor: 'Frequent phone usage', weight: 0.35, description: 'Phone detected in 60% of lectures' },
      { factor: 'Attendance drops', weight: 0.30, description: 'Missed 15 of last 45 lectures' },
      { factor: 'Declining engagement', weight: 0.25, description: 'Engagement dropped 22% over 4 weeks' },
      { factor: 'Low participation', weight: 0.10, description: 'Rarely raises hand or interacts' },
    ],
    attendanceRecords: [
      { date: '2026-07-30', course: 'CS301 Data Structures', status: 'absent', checkIn: '—' },
      { date: '2026-07-29', course: 'MA201 Linear Algebra', status: 'late', checkIn: '10:25 AM' },
      { date: '2026-07-28', course: 'CS301 Data Structures', status: 'present', checkIn: '10:12 AM' },
      { date: '2026-07-25', course: 'CS401 Machine Learning', status: 'absent', checkIn: '—' },
      { date: '2026-07-24', course: 'MA201 Linear Algebra', status: 'absent', checkIn: '—' },
      { date: '2026-07-23', course: 'CS301 Data Structures', status: 'present', checkIn: '10:08 AM' },
      { date: '2026-07-22', course: 'CS401 Machine Learning', status: 'late', checkIn: '10:22 AM' },
      { date: '2026-07-21', course: 'MA201 Linear Algebra', status: 'present', checkIn: '10:05 AM' },
      { date: '2026-07-18', course: 'CS301 Data Structures', status: 'absent', checkIn: '—' },
      { date: '2026-07-17', course: 'CS401 Machine Learning', status: 'present', checkIn: '10:01 AM' },
    ],
    activities: [
      { icon: '📱', description: 'Phone usage detected', time: '10:28 AM' },
      { icon: '😴', description: 'Sleeping posture detected', time: '10:15 AM' },
      { icon: '👀', description: 'Looking away from board', time: '10:08 AM' },
      { icon: '📱', description: 'Phone usage detected', time: '09:52 AM' },
      { icon: '💬', description: 'Talking to neighbor', time: '09:45 AM' },
      { icon: '👀', description: 'Distracted — looking at phone', time: '09:38 AM' },
      { icon: '👂', description: 'Brief listening detected', time: '09:30 AM' },
      { icon: '📱', description: 'Phone usage detected', time: '09:22 AM' },
    ],
  },
  '3': {
    name: 'Carol Williams', code: 'STU-2024-003', enrolled: 'Aug 2024', attendance: 85,
    engagement: 62, risk: 45, totalLectures: 45, riskTrend: 'stable',
    engagementHistory: [60, 58, 64, 62, 60, 65, 63, 61, 66, 62],
    radarMetrics: [
      { label: 'Attention', value: 65 }, { label: 'Engagement', value: 62 },
      { label: 'Participation', value: 55 }, { label: 'Collaboration', value: 58 },
      { label: 'Focus', value: 60 }, { label: 'Interaction', value: 52 },
    ],
    emotions: { happy: 0.15, neutral: 0.50, confused: 0.12, interested: 0.10, bored: 0.08, frustrated: 0.03, surprised: 0.02 },
    riskFactors: [
      { factor: 'Inconsistent engagement', weight: 0.30, description: 'Engagement fluctuates between lectures' },
      { factor: 'Moderate confusion', weight: 0.25, description: 'Confused 12% of time in advanced topics' },
      { factor: 'Below-avg participation', weight: 0.20, description: 'Rarely volunteers answers' },
    ],
    attendanceRecords: [
      { date: '2026-07-30', course: 'CS301 Data Structures', status: 'present', checkIn: '10:04 AM' },
      { date: '2026-07-29', course: 'MA201 Linear Algebra', status: 'present', checkIn: '09:58 AM' },
      { date: '2026-07-28', course: 'CS301 Data Structures', status: 'late', checkIn: '10:15 AM' },
      { date: '2026-07-25', course: 'CS401 Machine Learning', status: 'present', checkIn: '10:02 AM' },
      { date: '2026-07-24', course: 'MA201 Linear Algebra', status: 'absent', checkIn: '—' },
      { date: '2026-07-23', course: 'CS301 Data Structures', status: 'present', checkIn: '09:59 AM' },
      { date: '2026-07-22', course: 'CS401 Machine Learning', status: 'present', checkIn: '10:03 AM' },
      { date: '2026-07-21', course: 'MA201 Linear Algebra', status: 'present', checkIn: '09:57 AM' },
      { date: '2026-07-18', course: 'CS301 Data Structures', status: 'present', checkIn: '10:00 AM' },
      { date: '2026-07-17', course: 'CS401 Machine Learning', status: 'absent', checkIn: '—' },
    ],
    activities: [
      { icon: '✍️', description: 'Writing notes', time: '10:30 AM' },
      { icon: '👀', description: 'Looking at whiteboard', time: '10:22 AM' },
      { icon: '💻', description: 'Using laptop for coding', time: '10:15 AM' },
      { icon: '👂', description: 'Listening to lecture', time: '10:05 AM' },
      { icon: '📖', description: 'Reading textbook', time: '09:50 AM' },
      { icon: '✍️', description: 'Taking notes', time: '09:42 AM' },
      { icon: '👀', description: 'Focused on slide', time: '09:35 AM' },
      { icon: '👂', description: 'Active listening', time: '09:28 AM' },
    ],
  },
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'present': return '✅';
    case 'absent': return '❌';
    case 'late': return '⚠️';
    default: return '—';
  }
};

const getRiskColor = (risk: number) => {
  if (risk < 30) return 'var(--success)';
  if (risk < 60) return '#f59e0b';
  return 'var(--danger)';
};

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const student = studentProfiles[id || '1'] || studentProfiles['1'];
  const lectureLabels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Back Button + Profile Header */}
      <div className="glass-card animate-slide-up" style={{ padding: 28 }}>
        <button
          id="btn-back-dashboard"
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            color: 'var(--primary-500)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            marginBottom: 20, padding: '4px 0',
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `linear-gradient(135deg, var(--primary-500), var(--secondary-500))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 28, fontWeight: 700, flexShrink: 0,
            boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
          }}>
            {student.name.split(' ').map(n => n[0]).join('')}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                {student.name}
              </h2>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: 'rgba(34,197,94,0.15)', color: 'var(--success)',
              }}>
                Active
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14} /> {student.code}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> Enrolled {student.enrolled}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BookOpen size={14} /> {student.totalLectures} Lectures</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginTop: 24 }}>
          {[
            { label: 'Attendance', value: `${student.attendance}%`, icon: <Calendar size={16} />, color: student.attendance >= 80 ? 'var(--success)' : 'var(--danger)' },
            { label: 'Avg Engagement', value: `${student.engagement}%`, icon: <Activity size={16} />, color: student.engagement >= 60 ? 'var(--success)' : '#f59e0b' },
            { label: 'Risk Score', value: `${student.risk}`, icon: <Shield size={16} />, color: getRiskColor(student.risk) },
            { label: 'Total Lectures', value: `${student.totalLectures}`, icon: <BookOpen size={16} />, color: 'var(--primary-500)' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '14px 16px', borderRadius: 12,
              background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: `${stat.color}15`, color: stat.color,
              }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{stat.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <StatCard id="chart-student-engagement" title="Engagement Timeline" subtitle="Last 10 lectures" icon={<TrendingUp size={18} />}>
          <EngagementLineChart labels={lectureLabels} data={student.engagementHistory} />
        </StatCard>
        <StatCard id="chart-student-radar" title="Performance Metrics" subtitle="Multi-dimensional analysis" icon={<Award size={18} />}>
          <StudentRadar metrics={student.radarMetrics} />
        </StatCard>
      </div>

      {/* Emotion + Risk Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <StatCard id="chart-student-emotion" title="Emotion Distribution" subtitle="Aggregate across lectures" icon={<Eye size={18} />}>
          <EmotionDoughnut distribution={student.emotions} />
        </StatCard>

        <StatCard id="panel-risk-assessment" title="AI Risk Assessment" subtitle="Dropout prediction" icon={<AlertTriangle size={18} />}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Risk Circle */}
            <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={getRiskColor(student.risk)}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${student.risk * 2.64} ${264 - student.risk * 2.64}`}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: getRiskColor(student.risk) }}>{student.risk}</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>/ 100</span>
              </div>
            </div>

            {/* Risk Details */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                {student.riskTrend === 'improving' ? <TrendingDown size={16} color="var(--success)" /> :
                  student.riskTrend === 'declining' ? <TrendingUp size={16} color="var(--danger)" /> :
                  <Activity size={16} color="#f59e0b" />}
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: student.riskTrend === 'improving' ? 'var(--success)' :
                    student.riskTrend === 'declining' ? 'var(--danger)' : '#f59e0b',
                }}>
                  {student.riskTrend === 'improving' ? 'Improving' :
                    student.riskTrend === 'declining' ? 'Declining' : 'Stable'}
                </span>
              </div>
              {student.riskFactors.map((f, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{f.factor}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{Math.round(f.weight * 100)}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${f.weight * 100}%`, background: getRiskColor(student.risk), borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StatCard>
      </div>

      {/* Attendance Table */}
      <StatCard id="table-attendance" title="Attendance Record" subtitle="Recent lectures" icon={<Calendar size={18} />}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                {['Date', 'Course', 'Status', 'Check-in'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {student.attendanceRecords.map((rec, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)' }}>
                  <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{rec.date}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{rec.course}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: rec.status === 'present' ? 'rgba(34,197,94,0.15)' : rec.status === 'absent' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                      color: rec.status === 'present' ? 'var(--success)' : rec.status === 'absent' ? 'var(--danger)' : '#f59e0b',
                    }}>
                      {getStatusIcon(rec.status)} {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{rec.checkIn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StatCard>

      {/* Activity Log */}
      <StatCard id="panel-activity-log" title="Recent Activity" subtitle="AI-detected behaviors" icon={<Clock size={18} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
          {student.activities.map((act, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--bg-tertiary)',
              transition: 'background 0.2s',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{act.icon}</span>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{act.description}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                {act.time}
              </span>
            </div>
          ))}
        </div>
      </StatCard>
    </div>
  );
}
