import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SetupPage from './pages/SetupPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HistoryPage from './pages/HistoryPage';
import MyAbsencesPage from './pages/MyAbsencesPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminAttendances from './pages/AdminAttendances';
import AdminReports from './pages/AdminReports';
import AdminAbsences from './pages/AdminAbsences';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children, role }) {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/setup" element={<SetupPage />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute role="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute role="employee">
              <HistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/absences" element={
            <ProtectedRoute role="employee">
              <MyAbsencesPage />
            </ProtectedRoute>
          } />

          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute role="admin">
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/attendances" element={
            <ProtectedRoute role="admin">
              <AdminAttendances />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute role="admin">
              <AdminReports />
            </ProtectedRoute>
          } />
          <Route path="/admin/absences" element={
            <ProtectedRoute role="admin">
              <AdminAbsences />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
