import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import { adminService } from '../services/admin.service';
import { fmtHours } from '../utils/format';

export default function AdminAttendances() {
  const [attendances, setAttendances] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', user_id: '', start_date: '', end_date: '' });

  const fetchAttendances = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, ...filters };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const res = await adminService.attendances(params);
      setAttendances(res.data.attendances);
      setMeta(res.data.meta);
    } catch (e) {
      console.error('Attendances fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendances(); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchAttendances(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Présences</h1>
        <p className="text-gray-500">Consultez toutes les présences des employés.</p>
      </div>

      <Card>
        <form onSubmit={handleFilter} className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Du</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Au</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              Filtrer
            </button>
            <button
              type="button"
              onClick={() => { setFilters({ date: '', user_id: '', start_date: '', end_date: '' }); fetchAttendances(); }}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </Card>

      <Card>
        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Employé</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entrée</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pause début</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pause fin</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sortie</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendances.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.user?.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{a.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{a.check_in || '--'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{a.break_start || '--'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{a.break_end || '--'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{a.check_out || '--'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{fmtHours(a.total_hours)}</td>
                    </tr>
                  ))}
                  {attendances.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucune présence trouvée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={fetchAttendances} />
          </>
        )}
      </Card>
    </div>
  );
}
