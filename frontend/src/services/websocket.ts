export type WSChannel = 'classroom' | 'twin' | 'copilot' | 'analytics';

export interface TelemetryPacket {
  type: string;
  timestamp: string;
  lecture_id: number;
  engagement: number;
  attention: number;
  attendance: number;
  active_students: number;
  emotions: {
    happy: number;
    neutral: number;
    confused: number;
    interested: number;
    bored: number;
    frustrated: number;
    surprised: number;
  };
  student_risks?: { id: number; name: string; risk: number; reasons: string[] }[];
}

type Listener = (data: TelemetryPacket) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<WSChannel, Set<Listener>> = new Map();
  private isSimulated = false;
  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  public status: 'connected' | 'connecting' | 'simulated' | 'disconnected' = 'disconnected';
  private statusListeners: Set<(status: WebSocketService['status']) => void> = new Set();

  constructor() {
    this.listeners.set('classroom', new Set());
    this.listeners.set('twin', new Set());
    this.listeners.set('copilot', new Set());
    this.listeners.set('analytics', new Set());
  }

  public connect(lectureId = 201, channel: WSChannel = 'classroom') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const url = `${protocol}//${host}/api/v1/ws/${channel}/${lectureId}`;

    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.stopSimulation();
      };

      this.ws.onmessage = (event) => {
        try {
          const packet: TelemetryPacket = JSON.parse(event.data);
          this.broadcast(channel, packet);
        } catch {
          /* ignore non-json */
        }
      };

      this.ws.onerror = () => {
        this.fallbackToSimulation(lectureId, channel);
      };

      this.ws.onclose = () => {
        if (!this.isSimulated) {
          this.fallbackToSimulation(lectureId, channel);
        }
      };
    } catch {
      this.fallbackToSimulation(lectureId, channel);
    }
  }

  private fallbackToSimulation(lectureId: number, channel: WSChannel) {
    this.setStatus('simulated');
    this.startSimulation(lectureId, channel);
  }

  private startSimulation(lectureId: number, channel: WSChannel) {
    if (this.simulationInterval) return;
    this.isSimulated = true;

    // Emit live simulated metrics every 2.5 seconds
    this.simulationInterval = setInterval(() => {
      const now = new Date();
      const baseEng = 72 + Math.sin(now.getTime() / 10000) * 8;
      const baseAttn = 68 + Math.cos(now.getTime() / 8000) * 6;

      const packet: TelemetryPacket = {
        type: 'telemetry_tick',
        timestamp: now.toTimeString().substring(0, 8),
        lecture_id: lectureId,
        engagement: parseFloat((baseEng + (Math.random() * 4 - 2)).toFixed(1)),
        attention: parseFloat((baseAttn + (Math.random() * 4 - 2)).toFixed(1)),
        attendance: 94.1,
        active_students: 156,
        emotions: {
          happy: parseFloat((0.18 + Math.random() * 0.04 - 0.02).toFixed(2)),
          neutral: parseFloat((0.52 + Math.random() * 0.04 - 0.02).toFixed(2)),
          confused: parseFloat((0.12 + Math.random() * 0.03 - 0.015).toFixed(2)),
          interested: parseFloat((0.10 + Math.random() * 0.02).toFixed(2)),
          bored: parseFloat((0.05 + Math.random() * 0.01).toFixed(2)),
          frustrated: 0.02,
          surprised: 0.01,
        },
        student_risks: [
          { id: 2, name: 'Bob Jones', risk: parseFloat((82.5 + Math.random() * 3 - 1.5).toFixed(1)), reasons: ['Frequent phone usage', 'Distraction spikes'] },
          { id: 3, name: 'Carol Williams', risk: parseFloat((68.2 + Math.random() * 2 - 1).toFixed(1)), reasons: ['Attendance drop', 'Sleeping detected'] },
          { id: 1, name: 'Alice Smith', risk: 25.0, reasons: ['Minor lookaways', 'Overall strong'] },
        ],
      };

      this.broadcast(channel, packet);
    }, 2500);
  }

  private stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulated = false;
  }

  public subscribe(channel: WSChannel, listener: Listener) {
    this.listeners.get(channel)?.add(listener);
    return () => {
      this.listeners.get(channel)?.delete(listener);
    };
  }

  public onStatusChange(listener: (status: WebSocketService['status']) => void) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(s: WebSocketService['status']) {
    this.status = s;
    this.statusListeners.forEach((fn) => fn(s));
  }

  private broadcast(channel: WSChannel, packet: TelemetryPacket) {
    this.listeners.get(channel)?.forEach((fn) => fn(packet));
  }

  public disconnect() {
    this.stopSimulation();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }
}

export const wsService = new WebSocketService();
