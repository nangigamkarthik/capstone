export interface ReportConfig {
  title: string;
  course: string;
  date: string;
  type: 'engagement' | 'attendance' | 'risk' | 'teacher';
  summary: string;
  metrics: { label: string; value: string | number }[];
  recommendations: string[];
}

export function generatePDFReport(config: ReportConfig) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate and print PDF reports.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${config.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px;
            color: #0f172a;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #4f46e5;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .badge {
            background: #e0e7ff;
            color: #4338ca;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .title {
            font-size: 26px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .meta {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 24px;
          }
          .section {
            margin-bottom: 28px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
            border-left: 4px solid #6366f1;
            padding-left: 10px;
            margin-bottom: 12px;
          }
          .summary-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;
            font-size: 14px;
            line-height: 1.6;
            color: #334155;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }
          .metric-card {
            background: #f1f5f9;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
          }
          .metric-value {
            font-size: 24px;
            font-weight: 800;
            color: #4f46e5;
          }
          .metric-label {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
            text-transform: uppercase;
          }
          .list-item {
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 8px;
            padding-left: 16px;
            position: relative;
          }
          .list-item::before {
            content: "•";
            color: #6366f1;
            font-weight: bold;
            position: absolute;
            left: 0;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <div class="logo">🧠 CogniClass Digital Twin</div>
          <div class="badge">${config.type} Report</div>
        </div>

        <div class="title">${config.title}</div>
        <div class="meta">Course: <strong>${config.course}</strong> • Generated Date: <strong>${config.date}</strong> • Auth: Cognitive Analytics Engine v2.4</div>

        <div class="metrics-grid">
          ${config.metrics.map(m => `
            <div class="metric-card">
              <div class="metric-value">${m.value}</div>
              <div class="metric-label">${m.label}</div>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <div class="section-title">Executive AI Summary</div>
          <div class="summary-box">
            ${config.summary}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Recommended AI Interventions</div>
          ${config.recommendations.map(r => `<div class="list-item">${r}</div>`).join('')}
        </div>

        <div class="footer">
          <div>CogniClass Platform — Confidential Educational Analytics</div>
          <div>Page 1 of 1</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
