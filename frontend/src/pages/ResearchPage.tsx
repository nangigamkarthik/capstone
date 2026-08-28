import StatCard from '../components/ui/StatCard';
import { EngagementLineChart } from '../components/charts/Charts';
import KnowledgeGraph from '../components/charts/KnowledgeGraph';
import PublicationPlots from '../components/charts/PublicationPlots';
import ModelPerformanceWidget from '../components/ui/ModelPerformanceWidget';
import { FlaskConical, Download } from 'lucide-react';
import { exportToCSV } from '../utils/csvExporter';

export default function ResearchPage() {
  const handleExportCSV = () => {
    exportToCSV('cogniclass_research_metrics', [
      { Metric: 'Object Detection (mAP50)', Value: '94.5%' },
      { Metric: 'Pose Estimation (PCK)', Value: '89.2%' },
      { Metric: 'Gaze Tracking Error', Value: '4.1°' },
      { Metric: 'Emotion Recognition F1', Value: '85.9%' },
      { Metric: 'Engagement Prediction R2', Value: '86.4%' },
      { Metric: 'Inference Latency', Value: '4.2 ms/frame' },
    ]);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Model GPU & Inference Performance Telemetry */}
      <StatCard id="research-gpu-performance" title="Real-Time Neural Inference & Hardware Telemetry" icon={<FlaskConical size={18} />}>
        <ModelPerformanceWidget />
      </StatCard>

      {/* Concept Knowledge Graph */}
      <StatCard id="research-knowledge-graph" title="Classroom Knowledge Concept Graph" subtitle="Multimodal dependency & student mastery map">
        <KnowledgeGraph />
      </StatCard>

      {/* Publication Plots & Confusion Matrix */}
      <StatCard id="research-publication-plots" title="Publication-Ready Neural Evaluation" subtitle="IEEE / CVPR benchmarks">
        <PublicationPlots />
      </StatCard>

      {/* Training loss curve */}
      <StatCard id="research-loss" title="Training Loss Curve" subtitle="Multimodal Fusion Model">
        <EngagementLineChart labels={['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10']} data={[95, 88, 78, 65, 52, 42, 35, 30, 28, 26]} />
      </StatCard>

      {/* Export Datasets */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleExportCSV}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          <Download size={16} /> Export Metrics (CSV)
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600 }}>
          <Download size={16} /> Export Dataset (YOLO Annotations)
        </button>
      </div>
    </div>
  );
}
