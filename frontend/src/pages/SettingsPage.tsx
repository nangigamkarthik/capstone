import { useState } from 'react';
import { Save, Camera, Bell, Brain } from 'lucide-react';
import StatCard from '../components/ui/StatCard';

export default function SettingsPage() {
  const [cameraCount, setCameraCount] = useState(4);
  const [whisperModel, setWhisperModel] = useState('large-v3-turbo');
  const [llmModel, setLlmModel] = useState('gpt-4o');

  const inputStyle: React.CSSProperties = { width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid var(--border-color)', background:'var(--bg-tertiary)', color:'var(--text-primary)', fontSize:13, outline:'none' };
  const labelStyle: React.CSSProperties = { fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:6, display:'block' };

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:800 }}>
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
