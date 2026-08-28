import { useState } from 'react';
import { X, FileText, Sparkles } from 'lucide-react';
import { generatePDFReport } from '../../utils/pdfGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated: (report: { title: string; type: string; date: string }) => void;
}

export default function ReportModal({ isOpen, onClose, onReportCreated }: Props) {
  const [reportType, setReportType] = useState<'engagement' | 'attendance' | 'risk' | 'teacher'>('engagement');
  const [course, setCourse] = useState('CS301 Data Structures');
  const [customTitle, setCustomTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const title = customTitle.trim() || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Analytics Report — ${course}`;

      let metrics = [
        { label: 'Avg Engagement', value: '76.4%' },
        { label: 'Attendance Rate', value: '94.2%' },
        { label: 'At-Risk Count', value: 2 },
      ];

      let summary = "During the evaluated period, class participation remained high with notable spikes during practical demonstrations. Multimodal gaze analysis indicated 84% blackboard focus during key problem derivations.";
      let recommendations = [
        "Incorporate interactive check-ins midway through 60-minute lectures.",
        "Provide supplementary video material for students in the lowest 10% engagement percentile.",
        "Re-evaluate row placement for Bob Jones to minimize phone distractions.",
      ];

      if (reportType === 'attendance') {
        metrics = [
          { label: 'Total Enrolled', value: 32 },
          { label: 'Avg Present', value: 29 },
          { label: 'Unexcused Absences', value: 4 },
        ];
        summary = "Attendance trends are overall consistent with Friday classes showing a minor 6% drop. All mandatory lab sessions achieved 100% check-in.";
      } else if (reportType === 'risk') {
        metrics = [
          { label: 'High Risk (>70%)', value: 1 },
          { label: 'Medium Risk (30-70%)', value: 2 },
          { label: 'Low Risk (<30%)', value: 29 },
        ];
        summary = "Early warning models flagged 1 student for high dropout probability due to persistent tardiness and phone usage during lectures.";
      }

      generatePDFReport({
        title,
        course,
        date: dateStr,
        type: reportType,
        summary,
        metrics,
        recommendations,
      });

      onReportCreated({ title, type: reportType, date: dateStr });
      setIsGenerating(false);
      onClose();
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9995,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        width: '100%', maxWidth: '480px',
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: 16, padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}>
              <FileText size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Generate PDF Report</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Report Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { id: 'engagement', label: 'Engagement' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'risk', label: 'At-Risk Analysis' },
                { id: 'teacher', label: 'Teacher Metrics' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setReportType(t.id as unknown as 'engagement' | 'attendance' | 'risk' | 'teacher')}
                  style={{
                    padding: '10px', borderRadius: 8,
                    border: `1px solid ${reportType === t.id ? 'var(--primary-500)' : 'var(--border-color)'}`,
                    background: reportType === t.id ? 'rgba(99,102,241,0.15)' : 'var(--bg-tertiary)',
                    color: reportType === t.id ? 'var(--primary-400)' : 'var(--text-primary)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Course Context
            </label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
              }}
            >
              <option>CS301 Data Structures & Algorithms</option>
              <option>MA201 Linear Algebra</option>
              <option>CS401 Machine Learning</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Custom Report Title (Optional)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Midterm Engagement Evaluation"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            id="btn-confirm-generate-pdf"
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Sparkles size={16} /> {isGenerating ? 'Generating...' : 'Generate & Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
