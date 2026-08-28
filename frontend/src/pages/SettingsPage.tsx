import { useState } from 'react';
import { Save, Camera, Bell, Brain, Palette, Sun, Moon, Monitor, Mountain, Coffee } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { useThemeStore, ACCENT_PRESETS, type ThemeMode } from '../stores/themeStore';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: React.ReactNode; preview: string }[] = [
  { mode: 'light',    label: 'Light',        icon: <Sun size={18}/>,      preview: 'linear-gradient(135deg, #f8fafc, #e2e8f0)' },
  { mode: 'dark',     label: 'Dark',         icon: <Moon size={18}/>,     preview: 'linear-gradient(135deg, #020617, #1e293b)' },
  { mode: 'midnight', label: 'Midnight Blue', icon: <Mountain size={18}/>, preview: 'linear-gradient(135deg, #0a0e27, #181e52)' },
  { mode: 'sepia',    label: 'Warm Sepia',   icon: <Coffee size={18}/>,   preview: 'linear-gradient(135deg, #1a1410, #332820)' },
  { mode: 'system',   label: 'System Auto',  icon: <Monitor size={18}/>,  preview: 'linear-gradient(135deg, #020617 50%, #f8fafc 50%)' },
];

export default function SettingsPage() {
  const { mode, accentHue, setMode, setAccentHue } = useThemeStore();
  const [cameraCount, setCameraCount] = useState(4);
  const [whisperModel, setWhisperModel] = useState('large-v3-turbo');
  const [llmModel, setLlmModel] = useState('gpt-4o');

  const inputStyle: React.CSSProperties = { width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid var(--border-color)', background:'var(--bg-tertiary)', color:'var(--text-primary)', fontSize:13, outline:'none' };
  const labelStyle: React.CSSProperties = { fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:6, display:'block' };

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:800 }}>

      {/* ── Appearance ── */}
      <StatCard title="Appearance" icon={<Palette size={18}/>}>
        {/* Theme Variants */}
        <label style={{ ...labelStyle, marginBottom: 12 }}>Theme</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:10, marginBottom:24 }}>
          {THEME_OPTIONS.map(t => {
            const active = mode === t.mode;
            return (
              <button
                key={t.mode}
                id={`theme-btn-${t.mode}`}
                onClick={() => setMode(t.mode)}
                style={{
                  padding: 0, border: active ? '2px solid var(--primary-500)' : '2px solid var(--border-color)',
                  borderRadius: 14, cursor: 'pointer', background: 'var(--bg-tertiary)',
                  overflow: 'hidden', transition: 'all 0.25s ease',
                  transform: active ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: active ? '0 4px 20px rgba(99,102,241,0.3)' : 'none',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--primary-300)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                {/* Preview swatch */}
                <div style={{
                  height: 52, background: t.preview, borderRadius: '12px 12px 0 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: t.mode === 'light' ? '#334155' : '#e2e8f0',
                }}>
                  {t.icon}
                </div>
                {/* Label */}
                <div style={{
                  padding: '8px 10px', fontSize: 12, fontWeight: active ? 700 : 500,
                  color: active ? 'var(--primary-400)' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}>
                  {active && <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--primary-500)' }}/>}
                  {t.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Accent Color */}
        <label style={{ ...labelStyle, marginBottom: 12 }}>Accent Color</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:16 }}>
          {ACCENT_PRESETS.map(p => {
            const active = accentHue === p.hue;
            return (
              <button
                key={p.name}
                id={`accent-btn-${p.name.toLowerCase()}`}
                onClick={() => setAccentHue(p.hue)}
                title={p.name}
                style={{
                  width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: `hsl(${p.hue}, 72%, 60%)`,
                  outline: active ? '3px solid var(--text-primary)' : '3px solid transparent',
                  outlineOffset: 2,
                  transition: 'all 0.2s ease',
                  transform: active ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: active ? `0 4px 16px hsla(${p.hue}, 72%, 50%, 0.4)` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {active ? '✓' : ''}
              </button>
            );
          })}
        </div>

        {/* Custom hue slider */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:500, minWidth:70 }}>Custom Hue</span>
          <input
            id="accent-hue-slider"
            type="range" min={0} max={360} value={accentHue}
            onChange={(e) => setAccentHue(parseInt(e.target.value, 10))}
            style={{
              flex:1, height:8, borderRadius:4, appearance:'none', cursor:'pointer',
              background: 'linear-gradient(to right, hsl(0,72%,60%), hsl(60,72%,60%), hsl(120,72%,60%), hsl(180,72%,60%), hsl(240,72%,60%), hsl(300,72%,60%), hsl(360,72%,60%))',
            }}
          />
          <div style={{
            width:32, height:32, borderRadius:8,
            background:`hsl(${accentHue}, 72%, 60%)`,
            border:'2px solid var(--border-color)',
            flexShrink:0,
          }}/>
          <span style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:600, minWidth:30 }}>{accentHue}°</span>
        </div>
      </StatCard>

      {/* ── Camera Configuration ── */}
      <StatCard title="Camera Configuration" icon={<Camera size={18}/>}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <label style={labelStyle}>Max Cameras</label>
            <input type="number" value={cameraCount} onChange={e => setCameraCount(+e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Detection Confidence</label>
            <input type="number" defaultValue={0.45} step={0.05} min={0.1} max={1} style={inputStyle} />
          </div>
        </div>
      </StatCard>

      {/* ── AI Models ── */}
      <StatCard title="AI Models" icon={<Brain size={18}/>}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <label style={labelStyle}>Whisper Model</label>
            <select value={whisperModel} onChange={e => setWhisperModel(e.target.value)} style={inputStyle}>
              <option>large-v3-turbo</option><option>large-v3</option><option>medium</option><option>small</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>LLM Model</label>
            <select value={llmModel} onChange={e => setLlmModel(e.target.value)} style={inputStyle}>
              <option>gpt-4o</option><option>gpt-4o-mini</option><option>claude-3.5-sonnet</option><option>gemini-pro</option>
            </select>
          </div>
        </div>
      </StatCard>

      {/* ── Notifications ── */}
      <StatCard title="Notifications" icon={<Bell size={18}/>}>
        {['Engagement drop alerts','At-risk student warnings','Daily summary emails','Real-time copilot suggestions'].map((label, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none' }}>
            <span style={{ fontSize:13, color:'var(--text-primary)' }}>{label}</span>
            <label style={{ position:'relative', display:'inline-block', width:44, height:24 }}>
              <input type="checkbox" defaultChecked={i < 3} style={{ display:'none' }} />
              <span style={{ position:'absolute', inset:0, borderRadius:12, background: i < 3 ? 'var(--primary-500)' : 'var(--bg-tertiary)', cursor:'pointer', transition:'0.3s' }}>
                <span style={{ position:'absolute', left: i < 3 ? 22 : 2, top:2, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'0.3s' }} />
              </span>
            </label>
          </div>
        ))}
      </StatCard>

      <button id="btn-save-settings" style={{
        display:'flex', alignItems:'center', gap:8, padding:'12px 32px', borderRadius:10,
        background:'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
        color:'#fff', border:'none', cursor:'pointer', fontWeight:600, fontSize:14, alignSelf:'flex-start',
      }}><Save size={16}/> Save Settings</button>
    </div>
  );
}
