import { useState, useRef, useEffect } from 'react';
import { Camera, Wifi, WifiOff, Maximize2, Video, VideoOff, Settings, Clock, Activity, Target } from 'lucide-react';
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .scanline-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.03) 50%, transparent);
          background-size: 100% 8px;
          animation: scanline 6s linear infinite;
          opacity: 0.8;
          z-index: 10;
        }
        
        .pulse-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #ef4444;
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          animation: pulse-red 1.5s infinite;
        }
        
        @keyframes pulse-red {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .camera-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
        }
        
        .camera-card:hover {
          transform: translateX(4px);
          background: linear-gradient(90deg, var(--bg-tertiary), rgba(255,255,255,0.05));
          border-color: rgba(255,255,255,0.1);
        }
      `}</style>

      {/* Live Status Bar */}
      <div style={{
        padding: '16px 24px',
        borderRadius: 16,
        background: 'rgba(15,23,42,0.8)',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
             <span className="pulse-dot"></span>
             <span style={{ fontWeight: 800, letterSpacing: '0.05em', color: '#ef4444', fontSize: 13 }}>LIVE</span>
           </div>
           <div style={{ height: 24, width: 1, background: 'var(--border-color)' }}></div>
           <div>
             <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Room 402 - Advanced Mathematics</h2>
             <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Dr. Sarah Jenkins • Session Active</span>
           </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
             <Wifi size={16} /> Connection Stable
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-tertiary)', padding: '8px 16px', borderRadius: 10 }}>
             <Clock size={16} style={{ color: 'var(--primary-400)' }} />
             <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
               {currentTime.toLocaleTimeString()}
             </span>
           </div>
        </div>
      </div>

      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>Video & Perception Feeds</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Real-time multi-camera integration and behavioral analytics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
          >
            <Settings size={16} /> Config RTSP
          </button>
        </div>
      </div>

      {/* RTSP Config Bar */}
      {showSettings && (
        <div className="glass-card animate-fade-in" style={{ padding: '20px', display: 'flex', gap: 16, alignItems: 'center', background: 'linear-gradient(to right, rgba(15,23,42,0.8), rgba(30,41,59,0.8))', borderRadius: 16, border: '1px solid rgba(99,102,241,0.2)' }}>
          <label style={{ fontSize: 14, fontWeight: 600, minWidth: 140, color: 'var(--primary-300)' }}>Stream Source URL:</label>
          <input
            type="text"
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button className="btn-primary" style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 600 }}>Connect Stream</button>
        </div>
      )}

      {/* Camera Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: 24 }}>
        {/* Main Camera View Canvas */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', aspectRatio: '16/9', background: '#020617', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          
          <div className="scanline-overlay"></div>
          
          {selectedCam === 1 && isWebcamActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at center, #1e293b, #020617)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ textAlign: 'center', padding: 30, background: 'rgba(0,0,0,0.4)', borderRadius: 20, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Camera size={64} style={{ marginBottom: 16, opacity: 0.8, color: 'var(--primary-400)' }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Camera {selectedCam}</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>{cameras.find(c => c.id === selectedCam)?.name}</div>
                {selectedCam === 1 && webcamError ? (
                  <div style={{ fontSize: 13, marginTop: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>⚠️ {webcamError}</div>
                ) : (
                  <div style={{ fontSize: 13, marginTop: 12, color: 'var(--primary-400)', fontWeight: 600 }}>
                    {selectedCam === 1 ? 'Initializing local camera device...' : `Connecting to RTSP: ${rtspUrl}`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Analytics Overlay Canvas HUD */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', border: '1px solid rgba(99,102,241,0.1)', borderRadius: 16 }}>
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
                boxShadow: '0 0 15px rgba(34,197,94,0.4), inset 0 0 10px rgba(34,197,94,0.2)',
                transition: 'all 0.3s ease',
                zIndex: 20
              }}>
                <span style={{
                  position: 'absolute',
                  top: -26,
                  left: -2,
                  background: '#22c55e',
                  color: '#000',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '6px 6px 6px 0',
                  letterSpacing: '0.02em',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  ID #1: ATTENTIVE (94%)
                </span>
                {/* Corner markers */}
                <div style={{ position: 'absolute', top: -2, left: -2, width: 10, height: 10, borderTop: '3px solid #fff', borderLeft: '3px solid #fff' }}></div>
                <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderTop: '3px solid #fff', borderRight: '3px solid #fff' }}></div>
                <div style={{ position: 'absolute', bottom: -2, left: -2, width: 10, height: 10, borderBottom: '3px solid #fff', borderLeft: '3px solid #fff' }}></div>
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderBottom: '3px solid #fff', borderRight: '3px solid #fff' }}></div>
              </div>
            )}
          </div>

          {/* Top Status Bar */}
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 10, alignItems: 'center', zIndex: 20 }}>
            <span style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 10px rgba(239,68,68,0.4)' }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, background: '#fff' }}></span> REC
            </span>
            <span style={{ padding: '6px 12px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#e2e8f0', fontSize: 11, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>
              FPS: 29.8 | 1080p | H.264
            </span>
          </div>

          {/* Bottom Video Controls Overlay */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}>
            {selectedCam === 1 && (
              <button
                onClick={isWebcamActive ? stopWebcam : startWebcam}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: isWebcamActive ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s'
                }}
              >
                {isWebcamActive ? <><VideoOff size={16} /> Stop Feed</> : <><Video size={16} /> Start Feed</>}
              </button>
            )}

            <button style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, cursor: 'pointer', color: '#fff', backdropFilter: 'blur(4px)', transition: 'all 0.2s' }}>
              <Maximize2 size={18} />
            </button>
          </div>
        </div>

        {/* Camera Selector Thumbnails */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: -4 }}>
            Available Feeds
          </div>
          {cameras.map(cam => (
            <button
              key={cam.id}
              id={`cam-${cam.id}`}
              onClick={() => setSelectedCam(cam.id)}
              className="camera-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px',
                borderRadius: 14,
                border: selectedCam === cam.id ? '1px solid var(--primary-500)' : '1px solid rgba(255,255,255,0.05)',
                background: selectedCam === cam.id ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))' : 'var(--bg-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {selectedCam === cam.id && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--primary-500)' }}></div>}
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={20} style={{ color: cam.status === 'active' ? 'var(--primary-400)' : 'var(--text-secondary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: selectedCam === cam.id ? 'var(--primary-300)' : 'var(--text-primary)', marginBottom: 4 }}>{cam.name}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: cam.status === 'active' ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: cam.status === 'active' ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }}></span>
                  {cam.id === 1 && isWebcamActive ? 'Device Streaming' : cam.status === 'active' ? 'Online & Ready' : 'Offline'}
                </div>
              </div>
              {cam.status === 'active' ? <Wifi size={18} style={{ color: 'var(--success)', opacity: 0.8 }} /> : <WifiOff size={18} style={{ color: 'var(--danger)', opacity: 0.8 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Live Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <StatCard id="live-engagement" title="Live Engagement Metrics" subtitle="Real-time 30-min window" icon={<Activity size={18} color="var(--primary-400)" />}>
          <div style={{ position: 'relative' }}>
            {/* Color-coded indicator gauge */}
            <div style={{ position: 'absolute', top: -30, right: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(34,197,94,0.2)' }}>
              <Target size={14} color="#22c55e" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>82% Average</span>
            </div>
            <EngagementLineChart labels={mockTimeline.labels} data={mockTimeline.data} />
          </div>
        </StatCard>
        
        <StatCard id="live-emotions" title="Classroom Emotion Distribution" subtitle="AI-aggregated perception" icon={<Camera size={18} color="var(--secondary-400)" />}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: -30, right: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(99,102,241,0.2)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>Positive Bias</span>
            </div>
            <EmotionDoughnut distribution={mockEmotions} />
          </div>
        </StatCard>
      </div>
    </div>
  );
}
