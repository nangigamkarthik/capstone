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
      backgroundColor: 'rgba(10,14,39,0.95)',
      titleColor: '#e2e8f0',
      bodyColor: '#e2e8f0',
      borderColor: 'rgba(99,102,241,0.4)',
      borderWidth: 1,
      cornerRadius: 10,
      padding: 12,
      titleFont: { weight: 'bold' as const, size: 13 },
      bodyFont: { size: 12 },
      displayColors: false,
      caretSize: 6,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148,163,184,0.06)', drawBorder: false },
      ticks: { color: '#64748b', font: { size: 11 } },
      border: { display: false },
    },
    y: {
      grid: { color: 'rgba(148,163,184,0.08)', drawBorder: false },
      ticks: { color: '#64748b', font: { size: 11 } },
      border: { display: false },
    },
  },
};

export function EngagementLineChart({ labels, data }: { labels: string[]; data: number[] }) {
  return (
    <div style={{ height: 240 }}>
      <Line
        options={baseOptions}
        data={{
          labels,
          datasets: [{
            data, fill: true,
            borderColor: 'hsl(var(--accent-hue, 239), 72%, 60%)',
            backgroundColor: (ctx) => {
              const chart = ctx.chart;
              const { ctx: canvasCtx, chartArea } = chart;
              if (!chartArea) return 'rgba(99,102,241,0.1)';
              const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, 'rgba(99,102,241,0.25)');
              gradient.addColorStop(0.5, 'rgba(99,102,241,0.08)');
              gradient.addColorStop(1, 'rgba(99,102,241,0.01)');
              return gradient;
            },
            borderWidth: 2.5, pointRadius: 0, tension: 0.45,
            pointHoverRadius: 6, pointHoverBackgroundColor: '#6366f1',
            pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
          }],
        }}
      />
    </div>
  );
}

export function EmotionDoughnut({ distribution }: { distribution: Record<string, number> }) {
  const colors = ['#22c55e', '#94a3b8', '#f59e0b', '#818cf8', '#ef4444', '#f97316', '#38bdf8'];
  const hoverColors = ['#16a34a', '#64748b', '#d97706', '#6366f1', '#dc2626', '#ea580c', '#0ea5e9'];
  return (
    <div style={{ height: 220, display: 'flex', justifyContent: 'center' }}>
      <Doughnut
        options={{
          responsive: true, maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'right' as const,
              labels: {
                color: '#94a3b8', usePointStyle: true, pointStyle: 'circle',
                padding: 14, font: { size: 11, weight: 'bold' as const },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(10,14,39,0.95)',
              titleColor: '#e2e8f0', bodyColor: '#e2e8f0',
              borderColor: 'rgba(99,102,241,0.4)', borderWidth: 1,
              cornerRadius: 10, padding: 12,
            },
          },
        }}
        data={{
          labels: Object.keys(distribution).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
          datasets: [{
            data: Object.values(distribution),
            backgroundColor: colors,
            hoverBackgroundColor: hoverColors,
            borderWidth: 0,
            hoverOffset: 6,
          }],
        }}
      />
    </div>
  );
}

export function AttendanceBarChart({ labels, data }: { labels: string[]; data: number[] }) {
  return (
    <div style={{ height: 220 }}>
      <Bar
        options={{
          ...baseOptions,
          plugins: { ...baseOptions.plugins, legend: { display: false } },
        }}
        data={{
          labels,
          datasets: [{
            data,
            backgroundColor: (ctx) => {
              const chart = ctx.chart;
              const { ctx: canvasCtx, chartArea } = chart;
              if (!chartArea) return 'rgba(99,102,241,0.7)';
              const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, 'rgba(99,102,241,0.4)');
              gradient.addColorStop(1, 'rgba(99,102,241,0.85)');
              return gradient;
            },
            hoverBackgroundColor: 'rgba(99,102,241,1)',
            borderRadius: 8,
            borderSkipped: false,
          }],
        }}
      />
    </div>
  );
}

export function StudentRadar({ metrics }: { metrics: { label: string; value: number }[] }) {
  return (
    <div style={{ height: 280 }}>
      <Radar
        options={{
          responsive: true, maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true, max: 100,
              ticks: { display: false, stepSize: 20 },
              grid: { color: 'rgba(148,163,184,0.12)', circular: true },
              pointLabels: { color: '#94a3b8', font: { size: 11, weight: 'bold' as const } },
              angleLines: { color: 'rgba(148,163,184,0.08)' },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(10,14,39,0.95)',
              titleColor: '#e2e8f0', bodyColor: '#e2e8f0',
              borderColor: 'rgba(99,102,241,0.4)', borderWidth: 1,
              cornerRadius: 10, padding: 12,
            },
          },
        }}
        data={{
          labels: metrics.map((m) => m.label),
          datasets: [{
            data: metrics.map((m) => m.value),
            backgroundColor: 'rgba(99,102,241,0.15)',
            borderColor: '#6366f1',
            borderWidth: 2.5,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          }],
        }}
      />
    </div>
  );
}
