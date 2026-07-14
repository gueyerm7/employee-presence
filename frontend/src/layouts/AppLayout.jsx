import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function AppLayout() {
  const { token } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onToggleSidebar={() => setSidebarOpen(o => !o)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
