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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        <main style={{ flex: 1, padding: 24, overflow: 'auto', animation: 'fadeIn 0.3s ease-out' }}>
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
