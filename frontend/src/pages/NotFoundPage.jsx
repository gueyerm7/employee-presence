import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Page non trouvée</p>
        <Link to="/">
          <Button>Retour à l'accueil</Button>
        </Link>
      </div>
    </div>
  );
}
