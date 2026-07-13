import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import { attendanceService } from '../services/attendance.service';
import { fmtHours } from '../utils/format';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const res = await attendanceService.history(page);
      setHistory(res.data.history);
      setMeta(res.data.meta);
    } catch (e) {
      console.error('History fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  if (loading) return <Loader size="lg" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon historique</h1>
        <p className="text-gray-500">Consultez l'historique complet de vos pointages.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entrée</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pause début</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pause fin</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sortie</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{item.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.check_in || '--'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.break_start || '--'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.break_end || '--'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.check_out || '--'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{fmtHours(item.total_hours)}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun pointage trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={fetchHistory} />
      </Card>
    </div>
  );
}
