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

export default function Sidebar({ open, onClose }) {
  const { user } = useAuthStore();
  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`
        fixed top-[57px] left-0 z-40 h-[calc(100vh-57px)] w-64 bg-white border-r border-gray-200 p-4
        transition-transform duration-200 ease-in-out
        md:static md:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              onClick={onClose}
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
    </>
  );
}
