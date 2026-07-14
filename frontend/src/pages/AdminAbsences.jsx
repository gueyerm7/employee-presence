import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { absenceService } from '../services/absence.service';

const statusBadge = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusLabel = { pending: 'En attente', approved: 'Approuvé', rejected: 'Refusé' };

const filters = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvés' },
  { value: 'rejected', label: 'Refusés' },
];

export default function AdminAbsences() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [toast, setToast] = useState(null);
  const [processing, setProcessing] = useState(null);

  const fetchRequests = () => {
    setLoading(true);
    absenceService.all({ status: filter || undefined })
      .then(res => setRequests(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const handleStatus = async (id, status) => {
    const comment = prompt(status === 'approved' ? 'Commentaire (optionnel) :' : 'Motif du refus :');
    if (comment === null) return;
    setProcessing(id);
    try {
      await absenceService.updateStatus(id, { status, admin_comment: comment || '' });
      setToast({ type: 'success', message: `Demande ${statusLabel[status].toLowerCase()}.` });
      fetchRequests();
    } catch {
      setToast({ type: 'error', message: 'Erreur lors de la mise à jour.' });
    } finally {
      setProcessing(null);
    }
  };

  if (loading && requests.length === 0) return <Loader />;

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Demandes d'absence</h1>
        <p className="text-gray-500 mt-1">Gérez les demandes de congés des employés.</p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {requests.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucune demande trouvée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">Employé</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Du</th>
                  <th className="pb-3 font-medium">Au</th>
                  <th className="pb-3 font-medium">Motif</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Soumis le</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-3 font-medium">{r.user?.name}</td>
                    <td className="py-3">{r.absence_type?.name}</td>
                    <td className="py-3">{r.start_date}</td>
                    <td className="py-3">{r.end_date}</td>
                    <td className="py-3 text-gray-600 max-w-[200px] truncate">{r.reason || '--'}</td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[r.status]}`}>
                        {statusLabel[r.status]}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{r.created_at}</td>
                    <td className="py-3">
                      {r.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleStatus(r.id, 'approved')} disabled={processing === r.id}
                            className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50">
                            Approuver
                          </button>
                          <button onClick={() => handleStatus(r.id, 'rejected')} disabled={processing === r.id}
                            className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50">
                            Refuser
                          </button>
                        </div>
                      )}
                      {r.status !== 'pending' && (
                        <span className="text-xs text-gray-400">{r.admin_comment && `"${r.admin_comment}"`}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
