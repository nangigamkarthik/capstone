import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, Activity, AlertTriangle, Eye, Video, ArrowUpRight,
  Layers, Search, Compass
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';

export interface ClassroomRoom {
  id: string;
  code: string;
  name: string;
  floor: number;
  course: string;
  instructor: string;
  capacity: number;
  enrolled: number;
  engagement: number;
  attention: number;
  confusion: number;
  status: 'optimal' | 'warning' | 'critical';
  atRiskCount: number;
  x: number; // grid column pos
  y: number; // grid row pos
  width: number;
  height: number;
}

const ROOMS_DATA: ClassroomRoom[] = [
  {
    id: 'room-101', code: 'R-101', name: 'Computer Science Lab 1', floor: 1,
    course: 'CS301 Data Structures', instructor: 'Dr. Alan Turing',
    capacity: 40, enrolled: 38, engagement: 82.4, attention: 78.1, confusion: 8.2,
    status: 'optimal', atRiskCount: 1, x: 1, y: 1, width: 2, height: 2
  },
  {
    id: 'room-102', code: 'R-102', name: 'Mathematics Lecture Hall', floor: 1,
    course: 'MA201 Linear Algebra', instructor: 'Prof. Katherine Johnson',
    capacity: 60, enrolled: 54, engagement: 61.2, attention: 58.4, confusion: 28.5,
    status: 'warning', atRiskCount: 4, x: 3, y: 1, width: 3, height: 2
  },
  {
    id: 'aud-a', code: 'AUD-A', name: 'Grand Auditorium A', floor: 1,
    course: 'PH101 Physics Fundamentals', instructor: 'Dr. Richard Feynman',
    capacity: 120, enrolled: 110, engagement: 76.5, attention: 72.0, confusion: 14.1,
    status: 'optimal', atRiskCount: 2, x: 6, y: 1, width: 4, height: 2
  },
  {
    id: 'room-204', code: 'R-204', name: 'AI & Robotics Studio', floor: 2,
    course: 'CS401 Machine Learning', instructor: 'Prof. Geoffrey Hinton',
    capacity: 35, enrolled: 32, engagement: 88.9, attention: 84.2, confusion: 4.5,
    status: 'optimal', atRiskCount: 0, x: 1, y: 1, width: 3, height: 2
  },
  {
    id: 'room-205', code: 'R-205', name: 'Software Systems Lab', floor: 2,
    course: 'CS305 Operating Systems', instructor: 'Dr. Linus Torvalds',
    capacity: 45, enrolled: 41, engagement: 54.8, attention: 49.6, confusion: 36.2,
    status: 'critical', atRiskCount: 7, x: 4, y: 1, width: 3, height: 2
  },
  {
    id: 'sem-12', code: 'SEM-12', name: 'Ethics & Humanities Room', floor: 2,
    course: 'HU102 Tech Ethics', instructor: 'Prof. Ada Lovelace',
    capacity: 30, enrolled: 28, engagement: 79.1, attention: 74.5, confusion: 10.0,
    status: 'optimal', atRiskCount: 1, x: 7, y: 1, width: 3, height: 2
  },
];

export default function CampusPage() {
  const navigate = useNavigate();
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<ClassroomRoom | null>(ROOMS_DATA[0]);
  const [viewMode, setViewMode] = useState<'map' | 'cards'>('map');

  const filteredRooms = ROOMS_DATA.filter((r) => {
    const matchesFloor = selectedFloor === 'all' || r.floor === selectedFloor;
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFloor && matchesStatus && matchesSearch;
  });

  const totalStudents = ROOMS_DATA.reduce((acc, r) => acc + r.enrolled, 0);
  const avgEngagement = (ROOMS_DATA.reduce((acc, r) => acc + r.engagement, 0) / ROOMS_DATA.length).toFixed(1);
  const totalAtRisk = ROOMS_DATA.reduce((acc, r) => acc + r.atRiskCount, 0);
  const criticalRooms = ROOMS_DATA.filter(r => r.status === 'critical').length;

  const getStatusColor = (status: ClassroomRoom['status']) => {
    switch (status) {
      case 'optimal': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        .campus-room-box {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .campus-room-box:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 30px rgba(0,0,0,0.3);
        }
        .pulse-live-ring {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .pulse-live-ring::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid currentColor;
          animation: pulseRing 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulseRing {
          0% { transform: scale(0.7); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* ── Header Summary Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard title="Active Rooms" icon={<Building2 size={18} />} accentColor="var(--primary-500)">
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{ROOMS_DATA.length}</div>
          <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>6 Telemetry Streams Live</div>
        </StatCard>
        <StatCard title="Total Campus Students" icon={<Users size={18} />}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{totalStudents}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Across 2 Building Floors</div>
        </StatCard>
        <StatCard title="Campus Avg Engagement" icon={<Activity size={18} />}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary-400)' }}>{avgEngagement}%</div>
          <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>+3.2% vs last hour</div>
        </StatCard>
        <StatCard title="At-Risk Alerts" icon={<AlertTriangle size={18} color="var(--danger)" />}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--danger)' }}>{totalAtRisk}</div>
          <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>{criticalRooms} Critical Room Flagged</div>
        </StatCard>
      </div>

      {/* ── Control Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        padding: '16px 24px', borderRadius: 16, background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)', boxShadow: '0 4px 20px var(--shadow-color)'
      }}>
        {/* Left: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search room, instructor, course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 240
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-tertiary)', padding: 4, borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '0 8px', fontWeight: 600 }}>Floor:</span>
            {(['all', 1, 2] as const).map((fl) => (
              <button
                key={String(fl)}
                onClick={() => setSelectedFloor(fl)}
                style={{
                  padding: '4px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: selectedFloor === fl ? 'var(--primary-600)' : 'transparent',
                  color: selectedFloor === fl ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                {fl === 'all' ? 'All Floors' : `Floor ${fl}`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-tertiary)', padding: 4, borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '0 8px', fontWeight: 600 }}>Status:</span>
            {['all', 'optimal', 'warning', 'critical'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                style={{
                  padding: '4px 10px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                  background: selectedStatus === st ? 'var(--primary-600)' : 'transparent',
                  color: selectedStatus === st ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Right: View Toggle */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-tertiary)', padding: 4, borderRadius: 10, border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setViewMode('map')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: viewMode === 'map' ? 'linear-gradient(135deg, var(--primary-600), var(--primary-500))' : 'transparent',
              color: viewMode === 'map' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <Compass size={14} /> 2D Floorplan Map
          </button>
          <button
            onClick={() => setViewMode('cards')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: viewMode === 'cards' ? 'linear-gradient(135deg, var(--primary-600), var(--primary-500))' : 'transparent',
              color: viewMode === 'cards' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={14} /> Room Cards
          </button>
        </div>
      </div>

      {/* ── Main Content Area: Floorplan vs Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedRoom ? '1fr 340px' : '1fr', gap: 20 }}>
        
        {/* Left Column: Map or Cards */}
        {viewMode === 'map' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Floor 1 Section */}
            {(selectedFloor === 'all' || selectedFloor === 1) && (
              <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.15)', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>F1</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Floor 1 — Science & General Lectures</h3>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>3 Active Classrooms • 202 Enrolled Students</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', background: 'rgba(34,197,94,0.1)', padding: '3px 8px', borderRadius: 6 }}>Live Stream Active</span>
                </div>

                {/* Floor 1 Grid Map */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 14, minHeight: 180,
                  background: 'rgba(15,23,42,0.4)', borderRadius: 14, padding: 16, border: '1px dashed var(--border-color)'
                }}>
                  {filteredRooms.filter(r => r.floor === 1).map((room) => {
                    const isSelected = selectedRoom?.id === room.id;
                    const statusColor = getStatusColor(room.status);
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className="campus-room-box"
                        style={{
                          gridColumn: `span ${room.width}`,
                          gridRow: `span ${room.height}`,
                          padding: 16, borderRadius: 14, position: 'relative',
                          background: isSelected ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(15,23,42,0.9))' : 'var(--bg-secondary)',
                          border: isSelected ? `2px solid ${statusColor}` : `1px solid var(--border-color)`,
                          boxShadow: isSelected ? `0 0 20px ${statusColor}40` : 'none',
                          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                        }}
                      >
                        <div className="pulse-live-ring" style={{ color: statusColor, backgroundColor: statusColor }} />

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-tertiary)', color: statusColor }}>{room.code}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{room.enrolled}/{room.capacity} seats</span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{room.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--primary-400)', fontWeight: 600, marginTop: 4 }}>{room.course}</div>
                        </div>

                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Engagement</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: statusColor }}>{room.engagement}%</div>
                          </div>
                          {room.atRiskCount > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                              ⚠️ {room.atRiskCount} at-risk
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Floor 2 Section */}
            {(selectedFloor === 'all' || selectedFloor === 2) && (
              <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(20,184,166,0.15)', color: 'var(--secondary-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>F2</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Floor 2 — AI Labs & Advanced Computing</h3>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>3 Active Classrooms • 101 Enrolled Students</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', background: 'rgba(34,197,94,0.1)', padding: '3px 8px', borderRadius: 6 }}>Live Stream Active</span>
                </div>

                {/* Floor 2 Grid Map */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 14, minHeight: 180,
                  background: 'rgba(15,23,42,0.4)', borderRadius: 14, padding: 16, border: '1px dashed var(--border-color)'
                }}>
                  {filteredRooms.filter(r => r.floor === 2).map((room) => {
                    const isSelected = selectedRoom?.id === room.id;
                    const statusColor = getStatusColor(room.status);
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className="campus-room-box"
                        style={{
                          gridColumn: `span ${room.width}`,
                          gridRow: `span ${room.height}`,
                          padding: 16, borderRadius: 14, position: 'relative',
                          background: isSelected ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(15,23,42,0.9))' : 'var(--bg-secondary)',
                          border: isSelected ? `2px solid ${statusColor}` : `1px solid var(--border-color)`,
                          boxShadow: isSelected ? `0 0 20px ${statusColor}40` : 'none',
                          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                        }}
                      >
                        <div className="pulse-live-ring" style={{ color: statusColor, backgroundColor: statusColor }} />

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-tertiary)', color: statusColor }}>{room.code}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{room.enrolled}/{room.capacity} seats</span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{room.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--primary-400)', fontWeight: 600, marginTop: 4 }}>{room.course}</div>
                        </div>

                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Engagement</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: statusColor }}>{room.engagement}%</div>
                          </div>
                          {room.atRiskCount > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                              ⚠️ {room.atRiskCount} at-risk
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Cards Grid View */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {filteredRooms.map((room) => {
              const statusColor = getStatusColor(room.status);
              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className="campus-room-box glass-card"
                  style={{
                    padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                    border: `1px solid ${selectedRoom?.id === room.id ? statusColor : 'var(--border-color)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: statusColor, background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>{room.code}</span>
                      <h4 style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{room.name}</h4>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Floor {room.floor}</span>
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--primary-400)', fontWeight: 600 }}>{room.course}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Instructor: {room.instructor}</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'var(--bg-tertiary)', padding: 10, borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Engagement</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: statusColor }}>{room.engagement}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Confusion</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: room.confusion > 20 ? '#ef4444' : 'var(--text-primary)' }}>{room.confusion}%</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/twin'); }}
                    style={{
                      marginTop: 4, padding: '8px 12px', borderRadius: 8, border: 'none',
                      background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
                      color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <span>Inspect 3D Twin</span> <ArrowUpRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Right Column: Room Telemetry Drawer */}
        {selectedRoom && (
          <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, alignSelf: 'flex-start', position: 'sticky', top: 90 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: getStatusColor(selectedRoom.status), background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>
                  {selectedRoom.code} • Floor {selectedRoom.floor}
                </span>
                <h3 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedRoom.name}</h3>
              </div>
              <button onClick={() => setSelectedRoom(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-400)' }}>{selectedRoom.course}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Instructor: {selectedRoom.instructor}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Occupancy: {selectedRoom.enrolled} / {selectedRoom.capacity} seats</div>
            </div>

            {/* Metrics Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Real-time Telemetry</div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Engagement Score</span>
                  <span style={{ color: getStatusColor(selectedRoom.status) }}>{selectedRoom.engagement}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${selectedRoom.engagement}%`, background: getStatusColor(selectedRoom.status), transition: 'width 0.4s ease' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Attention Rate</span>
                  <span style={{ color: 'var(--primary-400)' }}>{selectedRoom.attention}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${selectedRoom.attention}%`, background: 'var(--primary-400)', transition: 'width 0.4s ease' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Confusion Index</span>
                  <span style={{ color: selectedRoom.confusion > 20 ? '#ef4444' : 'var(--text-secondary)' }}>{selectedRoom.confusion}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${selectedRoom.confusion}%`, background: selectedRoom.confusion > 20 ? '#ef4444' : '#f59e0b', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => navigate('/twin')}
                style={{
                  padding: '12px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <Eye size={16} /> <span>Open 3D Digital Twin</span>
              </button>

              <button
                onClick={() => navigate('/live')}
                style={{
                  padding: '12px', borderRadius: 10, border: '1px solid var(--border-color)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <Video size={16} /> <span>View Multi-Cam Stream</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
