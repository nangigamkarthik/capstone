import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ui/ToastContainer';
import CopilotDrawer from '../ui/CopilotDrawer';
import CopilotButton from '../ui/CopilotButton';
import CommandPalette from '../ui/CommandPalette';
import OnboardingTour from '../ui/OnboardingTour';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes orbMove {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(5vw, 5vh) scale(1.1); }
          66% { transform: translate(-5vw, 10vh) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Animated Gradient Orb */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '40vw',
          height: '40vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-200) 0%, transparent 60%)',
          opacity: 0.4,
          filter: 'blur(80px)',
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'orbMove 20s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--secondary-400) 0%, transparent 50%)',
          opacity: 0.15,
          filter: 'blur(100px)',
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'orbMove 25s ease-in-out infinite reverse',
        }} />
        
        <Header />
        <main style={{ flex: 1, padding: 24, overflow: 'auto', animation: 'fadeIn 0.3s ease-out', position: 'relative', zIndex: 1 }}>
          <Outlet />
        </main>
      </div>
      <ToastContainer />
      <CopilotDrawer />
      <CopilotButton />
      <CommandPalette />
      <OnboardingTour />
    </div>
  );
}
