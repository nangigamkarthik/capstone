import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) navigate('/', { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#020617',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(40px, -60px) scale(1.1); }
          50% { transform: translate(-30px, -100px) scale(0.9); }
          75% { transform: translate(60px, -40px) scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .login-input:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
        }
        .login-btn:hover:not(:disabled) {
          box-shadow: 0 8px 25px rgba(99,102,241,0.4) !important;
          transform: translateY(-1px) !important;
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0) !important;
        }
      `}</style>

      {/* Animated background gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(-45deg, #0f172a, #1e1b4b, #0f172a, #042f2e, #0f172a)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
      }} />

      {/* Floating orbs */}
      {[
        { size: 300, top: '10%', left: '10%', color: 'rgba(99,102,241,0.08)', delay: '0s', duration: '20s' },
        { size: 400, top: '60%', right: '5%', color: 'rgba(20,184,166,0.06)', delay: '5s', duration: '25s' },
        { size: 200, bottom: '10%', left: '30%', color: 'rgba(99,102,241,0.05)', delay: '10s', duration: '18s' },
        { size: 150, top: '20%', right: '25%', color: 'rgba(251,191,36,0.04)', delay: '3s', duration: '22s' },
      ].map((orb, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: orb.size,
          height: orb.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
          top: orb.top, left: (orb as { left?: string }).left, right: (orb as { right?: string }).right, bottom: (orb as { bottom?: string }).bottom,
          animation: `floatOrb ${orb.duration} ease-in-out ${orb.delay} infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.05) 1px, transparent 0)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Login Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        margin: '0 20px',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 20,
        padding: '48px 40px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 100px rgba(99,102,241,0.05)',
        animation: 'cardEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #6366f1, #14b8a6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
          }}>🧠</div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, margin: '0 0 6px',
            background: 'linear-gradient(135deg, #818cf8, #2dd4bf)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>CogniClass</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, letterSpacing: '0.05em' }}>
            Cognitive Classroom Digital Twin
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 20,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', fontSize: 13, textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Username */}
          <div>
            <label htmlFor="login-email" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                id="login-email"
                type="text"
                className="login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                style={{
                  width: '100%', padding: '12px 14px 12px 42px', borderRadius: 10,
                  border: '1px solid #334155', background: 'rgba(30,41,59,0.5)',
                  color: '#f8fafc', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%', padding: '12px 42px 12px 42px', borderRadius: 10,
                  border: '1px solid #334155', background: 'rgba(30,41,59,0.5)',
                  color: '#f8fafc', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
              <button
                id="btn-toggle-password"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="btn-login"
            type="submit"
            className="login-btn"
            disabled={isLoading || !username || !password}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 6, opacity: isLoading || !username || !password ? 0.6 : 1,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(99,102,241,0.25)',
            }}
          >
            {isLoading ? (
              <>
                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Demo hint */}
        <div style={{
          marginTop: 28, paddingTop: 20,
          borderTop: '1px solid rgba(99,102,241,0.1)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>Demo Credentials</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <button
              id="btn-demo-admin"
              type="button"
              onClick={() => { setUsername('admin'); setPassword('admin123'); }}
              style={{
                padding: '6px 14px', borderRadius: 8,
                border: '1px solid #334155', background: 'rgba(30,41,59,0.5)',
                color: '#94a3b8', fontSize: 12, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#c7d2fe'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              👤 Admin
            </button>
            <button
              id="btn-demo-teacher"
              type="button"
              onClick={() => { setUsername('teacher'); setPassword('teacher123'); }}
              style={{
                padding: '6px 14px', borderRadius: 8,
                border: '1px solid #334155', background: 'rgba(30,41,59,0.5)',
                color: '#94a3b8', fontSize: 12, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#14b8a6'; e.currentTarget.style.color = '#99f6e4'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              📚 Teacher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
