import { useState } from 'react';
import { FileText, Download, Plus, Search, Filter } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import ReportModal from '../components/ui/ReportModal';
import { generatePDFReport } from '../utils/pdfGenerator';

const initialReports = [
  { id: 1, title: 'Weekly Engagement Report — CS301', type: 'engagement', course: 'CS301 Data Structures', date: 'Jul 28, 2026', status: 'completed' },
  { id: 2, title: 'Attendance Summary — July 2026', type: 'attendance', course: 'MA201 Linear Algebra', date: 'Jul 25, 2026', status: 'completed' },
  { id: 3, title: 'At-Risk Student Analysis Q2', type: 'risk', course: 'CS401 Machine Learning', date: 'Jul 20, 2026', status: 'completed' },
  { id: 4, title: 'Teacher Effectiveness Evaluation', type: 'teacher', course: 'CS301 Data Structures', date: 'Jul 15, 2026', status: 'completed' },
];

export default function ReportsPage() {
  const [reports, setReports] = useState(initialReports);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredReports = reports.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || r.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleDownloadReport = (report: typeof reports[0]) => {
    generatePDFReport({
      title: report.title,
      course: report.course,
      date: report.date,
      type: report.type as 'engagement' | 'attendance' | 'risk' | 'teacher',
      summary: `Automated analytical evaluation for ${report.course}. Multimodal AI tracking captured engagement patterns, attendance metrics, and high-probability at-risk markers.`,
      metrics: [
        { label: 'Avg Engagement', value: '78.5%' },
        { label: 'Attendance Rate', value: '93.2%' },
        { label: 'At-Risk Flags', value: 2 },
      ],
      recommendations: [
        'Maintain student check-in frequency during key lecture derivations.',
        'Follow up with students showing attendance gaps in morning classes.',
      ],
    });
  };

  const handleReportCreated = (newReport: { title: string; type: string; date: string }) => {
    const created = {
      id: Date.now(),
      title: newReport.title,
      type: newReport.type,
      course: 'CS301 Data Structures',
      date: newReport.date,
      status: 'completed',
    };
    setReports([created, ...reports]);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              id="search-reports"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter reports..."
              style={{
                padding: '8px 12px 8px 36px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)', fontSize: 13, width: 220, outline: 'none',
              }}
            />
          </div>

          {/* Filter Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-tertiary)', padding: 4, borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <Filter size={14} style={{ color: 'var(--text-secondary)', marginLeft: 6 }} />
            {['all', 'engagement', 'attendance', 'risk', 'teacher'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedFilter(type)}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none',
                  background: selectedFilter === type ? 'var(--primary-500)' : 'transparent',
                  color: selectedFilter === type ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <button
          id="btn-new-report"
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
            color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)', transition: 'all 0.2s',
          }}
        >
          <Plus size={16} /> Generate New Report
        </button>
      </div>

      {/* Reports List */}
      <StatCard id="reports-list" title="Generated Analytical Reports" subtitle={`${filteredReports.length} reports available`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredReports.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <FileText size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No reports found matching your criteria</p>
            </div>
          ) : (
            filteredReports.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
                  borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: 'rgba(99,102,241,0.12)', color: 'var(--primary-400)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FileText size={20} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
                    <span>📅 {r.date}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>🏷️ {r.type}</span>
                    <span>•</span>
                    <span>📚 {r.course}</span>
                  </div>
                </div>

                <button
                  id={`btn-download-report-${r.id}`}
                  onClick={() => handleDownloadReport(r)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
                    border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(99,102,241,0.2)', transition: 'transform 0.2s',
                  }}
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
            ))
          )}
        </div>
      </StatCard>

      {/* Modal */}
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReportCreated={handleReportCreated}
      />
    </div>
  );
}
