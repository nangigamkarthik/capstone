import { Users, Activity } from 'lucide-react';
import StatCard from '../components/ui/StatCard';

const users = [
  { id:1, email:'admin@cogniclass.ai', name:'Admin User', role:'admin', active:true },
  { id:2, email:'prof.smith@university.edu', name:'Prof. Smith', role:'teacher', active:true },
  { id:3, email:'dr.jones@university.edu', name:'Dr. Jones', role:'teacher', active:true },
  { id:4, email:'alice@student.edu', name:'Alice Smith', role:'student', active:true },
  { id:5, email:'bob@student.edu', name:'Bob Jones', role:'student', active:false },
];

const auditLogs = [
  { time:'11:22:05', user:'Admin', action:'Created lecture CS201-L12', entity:'Lecture' },
  { time:'11:18:30', user:'Prof. Smith', action:'Started lecture CS101-L08', entity:'Lecture' },
  { time:'11:15:12', user:'System', action:'Face enrollment for Alice Smith', entity:'Student' },
  { time:'11:10:00', user:'Admin', action:'Updated camera config Room 201', entity:'Room' },
];

const roleColors: Record<string, string> = { admin:'var(--danger)', teacher:'var(--primary-400)', student:'var(--secondary-400)', parent:'var(--accent-400)' };

export default function AdminPage() {
  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* User Management */}
      <StatCard id="admin-users" title="User Management" icon={<Users size={18}/>}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border-color)' }}>
                {['Name','Email','Role','Status','Actions'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'10px 12px', color:'var(--text-secondary)', fontWeight:600, fontSize:11, textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom:'1px solid var(--border-color)' }}>
                  <td style={{ padding:12, fontWeight:600, color:'var(--text-primary)' }}>{u.name}</td>
                  <td style={{ padding:12, color:'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding:12 }}>
                    <span style={{ padding:'3px 10px', borderRadius:20, background:`${roleColors[u.role]}22`, color:roleColors[u.role], fontSize:11, fontWeight:600, textTransform:'capitalize' }}>{u.role}</span>
                  </td>
                  <td style={{ padding:12 }}>
                    <span style={{ color: u.active ? 'var(--success)' : 'var(--text-secondary)', fontSize:12 }}>{u.active ? '● Active' : '○ Inactive'}</span>
                  </td>
                  <td style={{ padding:12 }}>
                    <button style={{ padding:'4px 12px', borderRadius:6, background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', color:'var(--text-secondary)', cursor:'pointer', fontSize:12 }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StatCard>

      {/* Audit Log */}
      <StatCard id="admin-audit" title="Audit Log" subtitle="Recent system activity" icon={<Activity size={18}/>}>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {auditLogs.map((log, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, background:'var(--bg-tertiary)' }}>
              <span style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'monospace', minWidth:65 }}>{log.time}</span>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--primary-400)', minWidth:80 }}>{log.user}</span>
              <span style={{ fontSize:13, color:'var(--text-primary)', flex:1 }}>{log.action}</span>
              <span style={{ padding:'2px 8px', borderRadius:4, background:'var(--bg-secondary)', border:'1px solid var(--border-color)', fontSize:10, color:'var(--text-secondary)' }}>{log.entity}</span>
            </div>
          ))}
        </div>
      </StatCard>
    </div>
  );
}
