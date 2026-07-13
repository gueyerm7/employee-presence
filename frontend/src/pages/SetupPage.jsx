import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { biometricService } from '../services/biometric.service';
import Button from '../components/Button';

export default function SetupPage() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [biometricDone, setBiometricDone] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleRegisterBiometric = async () => {
    setLoading(true);
    setError(null);
    try {
      const deviceName = navigator.platform || 'Appareil inconnu';
      await biometricService.register(deviceName);
      setBiometricDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate(user?.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Compte créé !</h1>
          <p className="text-gray-500 mt-2">
            Bienvenue {user?.name} !
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          {biometricDone ? (
            <div className="text-green-600 space-y-4">
              <p className="text-lg font-medium">✅ Empreinte enregistrée avec succès</p>
              <p className="text-sm text-gray-500">
                Vous pouvez maintenant vous connecter avec votre empreinte ou votre mot de passe.
              </p>
              <Button onClick={handleSkip} className="w-full">
                Accéder au tableau de bord
              </Button>
            </div>
          ) : (
            <>
              <div className="text-gray-700 space-y-2">
                <p className="text-lg font-medium">Configurez votre empreinte (optionnel)</p>
                <p className="text-sm text-gray-500">
                  Activez la connexion par empreinte digitale ou Face ID pour vous connecter plus rapidement.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}

              <div className="space-y-3">
                <Button onClick={handleRegisterBiometric} className="w-full" disabled={loading}>
                  {loading ? 'Configuration...' : 'Configurer mon empreinte'}
                </Button>
                <Button variant="outline" onClick={handleSkip} className="w-full">
                  Passer pour le moment
                </Button>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-sm text-gray-500">
          <button onClick={() => { logout(); navigate('/login'); }} className="text-indigo-600 hover:text-indigo-500 font-medium">
            Se déconnecter
          </button>
        </p>
      </div>
    </div>
  );
}
