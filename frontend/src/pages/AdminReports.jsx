import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { adminService } from '../services/admin.service';
import { fmtHours } from '../utils/format';

function downloadDirect(url, params, filename) {
  const token = localStorage.getItem('token');
  const qs = new URLSearchParams({ ...params, token }).toString();
  const a = document.createElement('a');
  a.href = `/api${url}?${qs}`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'daily') {
        res = await adminService.dailyReport(date);
      } else if (activeTab === 'weekly') {
        res = await adminService.weeklyReport(date);
      } else {
        res = await adminService.monthlyReport(month, year);
      }
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'daily', label: 'Journalier' },
    { id: 'weekly', label: 'Hebdomadaire' },
    { id: 'monthly', label: 'Mensuel' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
        <p className="text-gray-500">Générez et consultez les rapports de présence.</p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setData(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 items-end mb-6">
          {activeTab !== 'monthly' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {new Date(2024, i).toLocaleString('fr', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-24"
                />
              </div>
            </>
          )}
          <Button onClick={fetchReport} disabled={loading}>Générer le rapport</Button>
        </div>
      </Card>

      {data && !loading && (
        <Card>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Export</h2>
            {activeTab === 'monthly' ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => downloadDirect('/export/monthly-pdf', { year, month }, `rapport-mensuel-${year}-${month}.pdf`)}
                >
                  PDF Mensuel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => downloadDirect('/export/monthly-excel', { year, month }, `rapport-mensuel-${year}-${month}.xlsx`)}
                >
                  Excel Mensuel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const lastDay = activeTab === 'daily' ? date : data.end_date;
                      const params = activeTab === 'daily' ? { start_date: date, end_date: date }
                        : { start_date: data.start_date, end_date: data.end_date };
                      downloadDirect('/export/pdf', params, 'rapport-presences.pdf');
                    } catch (e) { alert('Erreur PDF: ' + e.message); }
                  }}
                >
                  PDF
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const params = activeTab === 'daily' ? { start_date: date, end_date: date }
                        : { start_date: data.start_date, end_date: data.end_date };
                      downloadDirect('/export/excel', params, 'rapport-presences.xlsx');
                    } catch (e) { alert('Erreur Excel: ' + e.message); }
                  }}
                >
                  Excel
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {loading && <Loader />}

      {data && !loading && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Rapport {activeTab === 'daily' ? `du ${data.date}` : activeTab === 'weekly' ? `semaine du ${data.start_date} au ${data.end_date}` : `${year}/${month}`}
          </h2>

          {activeTab === 'daily' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Total présents: <strong>{data.total_present}</strong></p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Employé</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entrée</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pause début</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pause fin</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sortie</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.attendances.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.user?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{a.check_in || '--'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{a.break_start || '--'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{a.break_end || '--'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{a.check_out || '--'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{fmtHours(a.total_hours)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Résumé des heures par employé:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Développeur</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Semaine 1</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Semaine 2</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Semaine 3</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Semaine 4</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Semaine 5</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Total Mensuel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data.rows || []).map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{r.weeks[1]}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{r.weeks[2]}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{r.weeks[3]}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{r.weeks[4]}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{r.weeks[5]}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{r.total}</td>
                      </tr>
                    ))}
                    {(!data.rows || data.rows.length === 0) && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucune donnée pour ce mois.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Résumé des heures par employé:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Employé</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total heures</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data.summaries || []).map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.user?.name || `User #${s.user_id}`}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{fmtHours(s.total_hours)}</td>
                      </tr>
                    ))}
                    {(!data.summaries || data.summaries.length === 0) && (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-gray-400">Aucune donnée pour cette période.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
