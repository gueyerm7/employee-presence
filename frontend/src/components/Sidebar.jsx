import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const employeeLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/history', label: 'Historique', icon: '📋' },
  { to: '/absences', label: 'Absences', icon: '🏖️' },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/users', label: 'Utilisateurs', icon: '👥' },
  { to: '/admin/attendances', label: 'Présences', icon: '📋' },
  { to: '/admin/absences', label: 'Absences', icon: '🏖️' },
  { to: '/admin/reports', label: 'Rapports', icon: '📈' },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-57px)] p-4">
      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
