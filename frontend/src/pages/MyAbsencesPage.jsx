import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { absenceService } from '../services/absence.service';

const statusBadge = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusLabel = { pending: 'En attente', approved: 'Approuvé', rejected: 'Refusé' };

export default function MyAbsencesPage() {
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    absence_type_id: '', start_date: '', end_date: '', reason: '', attachment: null,
  });

  useEffect(() => {
    Promise.all([
      absenceService.types(),
      absenceService.myRequests(),
    ]).then(([typesRes, reqRes]) => {
      setTypes(typesRes.data);
      setRequests(reqRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));

    try {
      const res = await absenceService.create(fd);
      setRequests([res.data, ...requests]);
      setShowModal(false);
      setForm({ absence_type_id: '', start_date: '', end_date: '', reason: '', attachment: null });
      setToast({ type: 'success', message: 'Demande envoyée.' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Erreur.' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette demande ?')) return;
    try {
      await absenceService.delete(id);
      setRequests(requests.filter(r => r.id !== id));
      setToast({ type: 'success', message: 'Demande supprimée.' });
    } catch {
      setToast({ type: 'error', message: 'Erreur lors de la suppression.' });
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes absences</h1>
          <p className="text-gray-500 mt-1">Gérez vos demandes de congés et absences.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>Nouvelle demande</Button>
      </div>

      <Card>
        {requests.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucune demande pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Du</th>
                  <th className="pb-3 font-medium">Au</th>
                  <th className="pb-3 font-medium">Motif</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Commentaire</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-3">{r.absence_type?.name}</td>
                    <td className="py-3">{r.start_date}</td>
                    <td className="py-3">{r.end_date}</td>
                    <td className="py-3 text-gray-600 max-w-[200px] truncate">{r.reason || '--'}</td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[r.status]}`}>
                        {statusLabel[r.status]}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 max-w-[150px] truncate">{r.admin_comment || '--'}</td>
                    <td className="py-3 text-gray-500">{r.created_at}</td>
                    <td className="py-3">
                      {r.status === 'pending' && (
                        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

        <Modal isOpen={showModal} title="Nouvelle demande d'absence" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type d'absence *</label>
              <select
                value={form.absence_type_id}
                onChange={e => setForm({ ...form, absence_type_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required
              >
                <option value="">Sélectionner...</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin *</label>
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
              <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pièce jointe (PDF, JPG, PNG)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setForm({ ...form, attachment: e.target.files[0] })}
                className="w-full text-sm" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button type="submit">Envoyer</Button>
            </div>
          </form>
        </Modal>
    </div>
  );
}
