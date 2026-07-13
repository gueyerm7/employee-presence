import { useAuthStore } from '../store/useAuthStore';
import Button from './Button';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-indigo-600">Présence</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <Button variant="outline" onClick={logout}>Déconnexion</Button>
        </div>
      </div>
    </nav>
  );
}
