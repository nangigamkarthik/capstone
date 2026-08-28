import { create } from 'zustand';
import { wsService, type TelemetryPacket } from '../services/websocket';

interface LiveDataStore {
  connectionStatus: 'connected' | 'connecting' | 'simulated' | 'disconnected';
  engagement: number;
  attention: number;
  attendanceRate: number;
  totalStudents: number;
  emotions: Record<string, number>;
  engagementTimeline: { labels: string[]; data: number[] };
  studentRisks: { id: number; name: string; risk: number; reasons: string[] }[];
  lastUpdated: Date | null;
  initWebSocket: () => () => void;
}

const INITIAL_TIMELINE = {
  labels: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30', '10:35', '10:40', '10:45', '10:50', '10:55'],
  data: [82, 85, 78, 72, 68, 65, 70, 75, 80, 77, 74, 79],
};

export const useLiveDataStore = create<LiveDataStore>((set) => ({
  connectionStatus: 'disconnected',
  engagement: 73.2,
  attention: 68.5,
  attendanceRate: 94.1,
  totalStudents: 156,
  emotions: { happy: 0.18, neutral: 0.52, confused: 0.12, interested: 0.10, bored: 0.05, frustrated: 0.02, surprised: 0.01 },
  engagementTimeline: INITIAL_TIMELINE,
  studentRisks: [
    { id: 2, name: 'Bob Jones', risk: 82.5, reasons: ['Frequent phone usage', 'Distraction spikes'] },
    { id: 3, name: 'Carol Williams', risk: 68.2, reasons: ['Attendance drop', 'Sleeping detected'] },
    { id: 1, name: 'Alice Smith', risk: 25.0, reasons: ['Minor lookaways', 'Overall strong'] },
  ],
  lastUpdated: null,

  initWebSocket: () => {
    // Listen for status changes
    const unsubStatus = wsService.onStatusChange((status) => {
      set({ connectionStatus: status });
    });

    // Subscribe to classroom telemetry channel
    const unsubData = wsService.subscribe('classroom', (packet: TelemetryPacket) => {
      set((state) => {
        // Append live timestamp & engagement value to rolling chart (keep last 12 points)
        const newLabels = [...state.engagementTimeline.labels.slice(1), packet.timestamp.substring(0, 5)];
        const newData = [...state.engagementTimeline.data.slice(1), Math.round(packet.engagement)];

        return {
          engagement: packet.engagement,
          attention: packet.attention,
          attendanceRate: packet.attendance,
          totalStudents: packet.active_students,
          emotions: packet.emotions,
          engagementTimeline: { labels: newLabels, data: newData },
          studentRisks: packet.student_risks || state.studentRisks,
          lastUpdated: new Date(),
        };
      });
    });

    // Trigger connection
    wsService.connect(201, 'classroom');

    return () => {
      unsubStatus();
      unsubData();
      wsService.disconnect();
    };
  },
}));
