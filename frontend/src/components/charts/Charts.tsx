import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, BarElement, RadialLinearScale, Filler, Tooltip, Legend, Title,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, RadialLinearScale, Filler, Tooltip, Legend, Title);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15,23,42,0.9)',
      titleColor: '#e2e8f0',
      bodyColor: '#e2e8f0',
      borderColor: 'rgba(99,102,241,0.3)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
    },
  },
  scales: {
    x: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
  },
};

export function EngagementLineChart({ labels, data }: { labels: string[]; data: number[] }) {
  return (
    <div style={{ height: 220 }}>
      <Line
        options={baseOptions}
        data={{
          labels,
          datasets: [{
            data, fill: true,
            borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.15)',
            borderWidth: 2.5, pointRadius: 0, tension: 0.4,
          }],
        }}
      />
    </div>
  );
}

export function EmotionDoughnut({ distribution }: { distribution: Record<string, number> }) {
  const colors = ['#22c55e', '#94a3b8', '#f59e0b', '#6366f1', '#ef4444', '#dc2626', '#3b82f6'];
  return (
    <div style={{ height: 200, display: 'flex', justifyContent: 'center' }}>
      <Doughnut
        options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right' as const, labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } } } } }}
        data={{
          labels: Object.keys(distribution),
          datasets: [{ data: Object.values(distribution), backgroundColor: colors, borderWidth: 0 }],
        }}
      />
    </div>
  );
}

export function AttendanceBarChart({ labels, data }: { labels: string[]; data: number[] }) {
  return (
    <div style={{ height: 200 }}>
      <Bar
        options={{ ...baseOptions, plugins: { ...baseOptions.plugins, legend: { display: false } } }}
        data={{
          labels,
          datasets: [{ data, backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 6, borderSkipped: false }],
        }}
      />
    </div>
  );
}

export function StudentRadar({ metrics }: { metrics: { label: string; value: number }[] }) {
  return (
    <div style={{ height: 260 }}>
      <Radar
        options={{ responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true, max: 100, ticks: { display: false }, grid: { color: 'rgba(148,163,184,0.15)' }, pointLabels: { color: '#94a3b8', font: { size: 11 } } } }, plugins: { legend: { display: false } } }}
        data={{
          labels: metrics.map((m) => m.label),
          datasets: [{
            data: metrics.map((m) => m.value),
            backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#6366f1', borderWidth: 2, pointBackgroundColor: '#6366f1',
          }],
        }}
      />
    </div>
  );
}
