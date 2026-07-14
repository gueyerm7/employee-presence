import { useAuthStore } from '../store/useAuthStore';
import Button from './Button';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-xl font-bold text-indigo-600">Présence</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="text-right min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[120px] md:max-w-none">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <Button variant="outline" onClick={logout} className="hidden sm:inline-flex">Déconnexion</Button>
          <button
            onClick={logout}
            className="sm:hidden p-2 text-gray-500 hover:text-gray-700"
            title="Déconnexion"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
