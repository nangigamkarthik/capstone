import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, Award, Flame, ArrowUpRight, BarChart2 } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { EngagementLineChart, AttendanceBarChart, StudentRadar, EmotionDoughnut } from '../components/charts/Charts';

const engLabels = ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Wk6', 'Wk7', 'Wk8'];
const engDataCourseA = [72, 74, 70, 68, 75, 78, 80, 77];

const attLabels = ['CS101', 'CS201', 'CS301', 'CS401', 'MATH201'];
const attData = [96, 92, 88, 94, 91];

const radarMetrics = [
  { label: 'Attention', value: 72 }, { label: 'Engagement', value: 78 },
  { label: 'Participation', value: 65 }, { label: 'Collaboration', value: 58 },
  { label: 'Comprehension', value: 70 }, { label: 'Consistency', value: 82 },
];

const emoDist = { happy: 0.22, neutral: 0.45, confused: 0.14, interested: 0.12, bored: 0.04, frustrated: 0.02, surprised: 0.01 };

const leaderboardStudents = [
  { rank: 1, id: 4, name: 'David Miller', score: 91, badge: '🥇 Top Focus', streak: '8 lectures', avatarBg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { rank: 2, id: 1, name: 'Alice Smith', score: 85, badge: '🥈 High Engagement', streak: '6 lectures', avatarBg: 'linear-gradient(135deg, #94a3b8, #64748b)' },
  { rank: 3, id: 3, name: 'Carol Williams', score: 78, badge: '🥉 Consistent Notes', streak: '4 lectures', avatarBg: 'linear-gradient(135deg, #b45309, #78350f)' },
  { rank: 4, id: 7, name: 'Grace Taylor', score: 72, badge: '⭐ Team Collaborator', streak: '3 lectures', avatarBg: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
  { rank: 5, id: 6, name: 'Frank Wilson', score: 65, badge: 'Active Listener', streak: '2 lectures', avatarBg: 'linear-gradient(135deg, #2dd4bf, #0d9488)' },
];

export default function AnalyticsPage() {
  const [selectedCourseA, setSelectedCourseA] = useState('CS301');
  const [selectedCourseB, setSelectedCourseB] = useState('MA201');
  const [timeRange, setTimeRange] = useState('8-weeks');
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Filter & Comparison Controls Bar */}
      <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BarChart2 size={20} color="var(--primary-400)" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Comparative Telemetry Matrix</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>Compare:</span>
            <select
              value={selectedCourseA}
              onChange={(e) => setSelectedCourseA(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--primary-400)', fontWeight: 600, fontSize: 13, outline: 'none' }}
            >
              <option value="CS301">CS301 Data Structures</option>
              <option value="CS101">CS101 Intro to AI</option>
              <option value="CS401">CS401 Machine Learning</option>
            </select>
            <span>vs</span>
            <select
              value={selectedCourseB}
              onChange={(e) => setSelectedCourseB(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--secondary-400)', fontWeight: 600, fontSize: 13, outline: 'none' }}
            >
              <option value="MA201">MA201 Linear Algebra</option>
              <option value="CS201">CS201 Deep Learning</option>
              <option value="MATH201">MATH201 Statistics</option>
            </select>
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: 3, borderRadius: 8, border: '1px solid var(--border-color)' }}>
            {['4-weeks', '8-weeks', 'semester'].map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none',
                  background: timeRange === r ? 'var(--primary-500)' : 'transparent',
                  color: timeRange === r ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                }}
              >
                {r.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Trends & Leaderboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Engagement Comparison Trend */}
        <StatCard id="analytics-engagement-trend" title={`${selectedCourseA} vs ${selectedCourseB} Engagement Trend`} subtitle={`${timeRange} rolling comparison`} icon={<TrendingUp size={18} />}>
          <EngagementLineChart labels={engLabels} data={engDataCourseA} />
        </StatCard>

        {/* Live Engagement Leaderboard */}
        <StatCard id="analytics-leaderboard" title="Engagement Leaderboard" subtitle="Top performing students" icon={<Trophy size={18} color="#f59e0b" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leaderboardStudents.map((s) => (
              <div
                key={s.id}
                id={`leaderboard-item-${s.id}`}
                onClick={() => navigate(`/student/${s.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 10, background: 'var(--bg-tertiary)', cursor: 'pointer',
                  transition: 'all 0.2s', border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-500)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: s.avatarBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0,
                }}>
                  {s.rank}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {s.name}
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{s.badge}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Flame size={12} color="#f59e0b" /> {s.streak} streak
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>{s.score}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Score</div>
                </div>
              </div>
            ))}
          </div>
        </StatCard>
      </div>

      {/* Performance Profile & Attendance Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <StatCard id="analytics-radar" title="Student Performance Radar" subtitle="Class multi-attribute profile" icon={<Award size={18} />}>
          <StudentRadar metrics={radarMetrics} />
        </StatCard>

        <StatCard id="analytics-attendance" title="Attendance by Course" subtitle="Comparison breakdown">
          <AttendanceBarChart labels={attLabels} data={attData} />
        </StatCard>

        <StatCard id="analytics-emotions" title="Semester Emotion Distribution" subtitle="Aggregate telemetry">
          <EmotionDoughnut distribution={emoDist} />
        </StatCard>
      </div>

      {/* Course Comparison Table */}
      <StatCard id="analytics-comparison" title="Detailed Course Benchmarks" subtitle="Current semester breakdown">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                {['Course', 'Enrolled', 'Avg Engagement', 'Avg Attention', 'Attendance Rate', 'At-Risk Count', 'Action'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { course: 'CS101 - Intro to AI', students: 42, eng: 78.3, att: 72.1, rate: '96%', risk: 2 },
                { course: 'CS201 - Deep Learning', students: 35, eng: 74.8, att: 68.9, rate: '92%', risk: 4 },
                { course: 'CS301 - Computer Vision', students: 28, eng: 82.1, att: 79.5, rate: '88%', risk: 1 },
                { course: 'MATH201 - Statistics', students: 40, eng: 65.4, att: 60.2, rate: '91%', risk: 6 },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)' }}>
                  <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>{row.course}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{row.students}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--success)', fontWeight: 600 }}>{row.eng}%</td>
                  <td style={{ padding: '12px 14px', color: 'var(--primary-400)', fontWeight: 600 }}>{row.att}%</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{row.rate}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: row.risk > 3 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                      color: row.risk > 3 ? 'var(--danger)' : 'var(--success)',
                    }}>
                      {row.risk} student{row.risk > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      onClick={() => navigate('/twin')}
                      style={{
                        background: 'none', border: 'none', color: 'var(--primary-500)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      Inspect Twin <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StatCard>
    </div>
  );
}
