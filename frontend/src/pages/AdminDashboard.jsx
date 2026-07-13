import { useEffect, useState } from 'react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Loader from '../components/Loader';
import { adminService } from '../services/admin.service';
import { fmtHours } from '../utils/format';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.dashboard()
      .then((res) => setData(res.data))
      .catch((e) => { console.error('Dashboard error:', e); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader size="lg" />;
  if (!data) return <p className="text-gray-500">Erreur de chargement.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-500">Vue d'ensemble de la présence des employés.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Employés" value={data.total_employees} icon="👥" color="indigo" />
        <StatsCard title="Présents aujourd'hui" value={data.present_today} icon="✅" color="green" />
        <StatsCard title="Absents aujourd'hui" value={data.absent_today} icon="❌" color="red" />
        <StatsCard title="Heures aujourd'hui" value={fmtHours(data.total_hours_today)} icon="⏱️" color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Heures par employé (ce mois)</h2>
          {data.hours_by_employee?.length > 0 ? (
            <div className="space-y-3">
              {data.hours_by_employee.map((emp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{emp.name}</span>
                    <span className="font-medium text-gray-900">{fmtHours(emp.total_hours)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((emp.total_hours / 160) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aucune donnée.</p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total heures aujourd'hui</span>
              <span className="font-semibold text-gray-900">{fmtHours(data.total_hours_today)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total heures cette semaine</span>
              <span className="font-semibold text-gray-900">{fmtHours(data.total_hours_week)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total heures ce mois</span>
              <span className="font-semibold text-gray-900">{fmtHours(data.total_hours_month)}</span>
            </div>
          </div>
        </Card>
      </div>

      {data.latest_attendances?.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dernières présences</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Employé</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entrée</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sortie</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.latest_attendances.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.user?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.check_in || '--'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.check_out || '--'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{fmtHours(a.total_hours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
