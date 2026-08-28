import { useState, useRef, useEffect } from 'react';
import { Camera, Wifi, WifiOff, Maximize2, Video, VideoOff, Settings } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { EngagementLineChart, EmotionDoughnut } from '../components/charts/Charts';

const cameras = [
  { id: 1, name: 'Live Laptop Webcam', status: 'active', type: 'webcam' },
  { id: 2, name: 'Front RTSP Camera', status: 'active', type: 'rtsp' },
  { id: 3, name: 'Side Left RTSP', status: 'active', type: 'rtsp' },
  { id: 4, name: 'Side Right Camera', status: 'offline', type: 'rtsp' },
];

const mockTimeline = { labels: ['00:00', '05:00', '10:00', '15:00', '20:00', '25:00', '30:00'], data: [88, 85, 80, 72, 68, 74, 79] };
const mockEmotions = { happy: 0.2, neutral: 0.5, confused: 0.15, interested: 0.08, bored: 0.05, frustrated: 0.02 };

export default function LiveClassroomPage() {
  const [selectedCam, setSelectedCam] = useState(1);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [rtspUrl, setRtspUrl] = useState('rtsp://192.168.1.100:554/stream1');
  const [showSettings, setShowSettings] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startWebcam = async () => {
    try {
      setWebcamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsWebcamActive(true);
    } catch (err: any) {
      console.error('Error accessing webcam:', err);
      setWebcamError(err.message || 'Could not access local webcam device');
      setIsWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  useEffect(() => {
    if (selectedCam === 1) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [selectedCam]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Live Video & Perception Feeds</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Real-time multi-camera integration, local webcam analytics, and RTSP stream feeds.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}
          >
            <Settings size={16} /> Config RTSP URL
          </button>
        </div>
      </div>

      {/* RTSP Config Bar */}
      {showSettings && (
        <div className="glass-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 600, minWidth: 120 }}>RTSP Stream URL:</label>
          <input
            type="text"
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          />
          <button className="btn-primary" style={{ padding: '8px 16px', borderRadius: 8 }}>Connect Stream</button>
        </div>
      )}

      {/* Camera Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Main Camera View Canvas */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', aspectRatio: '16/9', background: '#090d16' }}>
          {selectedCam === 1 && isWebcamActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0f172a, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Camera size={54} style={{ marginBottom: 12, opacity: 0.5, color: 'var(--primary-400)' }} />
                <div style={{ fontSize: 15, fontWeight: 600 }}>Camera {selectedCam} — {cameras.find(c => c.id === selectedCam)?.name}</div>
                {selectedCam === 1 && webcamError ? (
                  <div style={{ fontSize: 12, marginTop: 8, color: 'var(--danger)' }}>⚠️ {webcamError}</div>
                ) : (
                  <div style={{ fontSize: 12, marginTop: 6, color: 'var(--primary-400)' }}>
                    {selectedCam === 1 ? 'Initializing local camera device...' : `RTSP Source: ${rtspUrl}`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Analytics Overlay Canvas HUD */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', border: '1px solid rgba(99,102,241,0.2)' }}>
            {/* Simulated Bounding Box Overlay for Live Detection */}
            {isWebcamActive && selectedCam === 1 && (
              <div style={{
                position: 'absolute',
                top: '25%',
                left: '35%',
                width: '30%',
                height: '50%',
                border: '2px solid #22c55e',
                borderRadius: 8,
                boxShadow: '0 0 15px rgba(34,197,94,0.4)',
                transition: 'all 0.3s ease'
              }}>
                <span style={{
                  position: 'absolute',
                  top: -24,
                  left: 0,
                  background: '#22c55e',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  ID #1: Active Person (Attention: 94%)
                </span>
              </div>
            )}
          </div>

          {/* Top Status Bar */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: 11, fontWeight: 600, animation: 'pulseGlow 2s infinite' }}>
              ● LIVE STREAM
            </span>
            <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#e2e8f0', fontSize: 11 }}>
              FPS: 29.8 | 720p
            </span>
          </div>

          {/* Bottom Video Controls Overlay */}
          <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
            {selectedCam === 1 && (
              <button
                onClick={isWebcamActive ? stopWebcam : startWebcam}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: isWebcamActive ? 'rgba(239,68,68,0.8)' : 'rgba(34,197,94,0.8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isWebcamActive ? <><VideoOff size={14} /> Stop Webcam</> : <><Video size={14} /> Start Webcam</>}
              </button>
            )}

            <button style={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#fff' }}>
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* Camera Selector Thumbnails */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cameras.map(cam => (
            <button
              key={cam.id}
              id={`cam-${cam.id}`}
              onClick={() => setSelectedCam(cam.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 12,
                border: selectedCam === cam.id ? '2px solid var(--primary-500)' : '1px solid var(--border-color)',
                background: selectedCam === cam.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={18} style={{ color: cam.status === 'active' ? 'var(--success)' : 'var(--text-secondary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cam.name}</div>
                <div style={{ fontSize: 11, color: cam.status === 'active' ? 'var(--success)' : 'var(--danger)' }}>
                  {cam.id === 1 && isWebcamActive ? '● Device Streaming' : cam.status === 'active' ? '● Online' : '○ Offline'}
                </div>
              </div>
              {cam.status === 'active' ? <Wifi size={14} style={{ color: 'var(--success)' }} /> : <WifiOff size={14} style={{ color: 'var(--danger)' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Live Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <StatCard id="live-engagement" title="Live Engagement Metrics" subtitle="Real-time 30-min window">
          <EngagementLineChart labels={mockTimeline.labels} data={mockTimeline.data} />
        </StatCard>
        <StatCard id="live-emotions" title="Current Classroom Emotion Distribution">
          <EmotionDoughnut distribution={mockEmotions} />
        </StatCard>
      </div>
    </div>
  );
}

