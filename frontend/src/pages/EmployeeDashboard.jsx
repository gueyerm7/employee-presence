import { useEffect, useState, useCallback } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import StatsCard from '../components/StatsCard';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { attendanceService } from '../services/attendance.service';
import { biometricService } from '../services/biometric.service';
import { fmtHours } from '../utils/format';

const FIELD_LABELS = {
  check_in: 'Entrée',
  break_start: 'Pause début',
  break_end: 'Pause fin',
  check_out: 'Sortie',
};

const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDate();
}

function getWeekdayIndex(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function isWithinRollingDays(dateStr, days = 2) {
  const d = new Date(dateStr + 'T00:00:00');
  const limit = new Date();
  limit.setDate(limit.getDate() - days);
  limit.setHours(0, 0, 0, 0);
  return d >= limit;
}

export default function EmployeeDashboard() {
  const [attendance, setAttendance] = useState(null);
  const [status, setStatus] = useState({});
  const [weekSummary, setWeekSummary] = useState(null);
  const [monthSummary, setMonthSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioCredentials, setBioCredentials] = useState([]);
  const [showBioModal, setShowBioModal] = useState(false);
  const [bioDeviceName, setBioDeviceName] = useState('');
  const [bioRegLoading, setBioRegLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const webauthnAvailable = !!window.PublicKeyCredential;

  const [weekOffset, setWeekOffset] = useState(0);
  const [weekData, setWeekData] = useState(null);
  const [weekLoading, setWeekLoading] = useState(false);

  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingNowField, setEditingNowField] = useState(null);
  const [editNowValue, setEditNowValue] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [todayRes, weekRes, monthRes] = await Promise.all([
        attendanceService.today(),
        attendanceService.week(),
        attendanceService.month(),
      ]);
      setAttendance(todayRes.data.attendance);
      setStatus(todayRes.data.status);
      setWeekSummary(weekRes.data);
      setMonthSummary(monthRes.data);
    } catch {
      setToast({ message: 'Erreur lors du chargement des données', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBioCredentials = useCallback(async () => {
    try {
      const creds = await biometricService.credentials();
      setBioCredentials(creds);
    } catch {
      // silently fail
    }
  }, []);

  const fetchWeekData = useCallback(async (offset) => {
    setWeekLoading(true);
    try {
      const res = await attendanceService.weekByOffset(offset);
      setWeekData(res.data);
    } catch {
      setToast({ message: 'Erreur lors du chargement de la semaine', type: 'error' });
    } finally {
      setWeekLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); fetchBioCredentials(); }, [fetchData, fetchBioCredentials]);
  useEffect(() => { fetchWeekData(weekOffset); }, [weekOffset, fetchWeekData]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleAction = async (actionFn, successMsg) => {
    setActionLoading(true);
    try {
      const res = await actionFn();
      setAttendance(res.data.attendance);
      setStatus(res.data.status);
      showToast(successMsg);
      const [weekRes, monthRes] = await Promise.all([
        attendanceService.week(),
        attendanceService.month(),
      ]);
      setWeekSummary(weekRes.data);
      setMonthSummary(monthRes.data);
      fetchWeekData(weekOffset);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBiometricAction = async (action, successMsg) => {
    if (!webauthnAvailable) {
      showToast('Windows Hello / empreinte non disponible sur ce navigateur.', 'error');
      return;
    }
    if (!bioCredentials || bioCredentials.length === 0) {
      setShowBioModal(true);
      return;
    }
    setBioLoading(true);
    try {
      const res = await biometricService.authenticate(action, todayStr);
      setAttendance(res.attendance);
      setStatus(res.status);
      showToast(successMsg);
      const [weekRes, monthRes] = await Promise.all([
        attendanceService.week(),
        attendanceService.month(),
      ]);
      setWeekSummary(weekRes.data);
      setMonthSummary(monthRes.data);
      fetchWeekData(weekOffset);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur biométrique';
      showToast(msg, 'error');
    } finally {
      setBioLoading(false);
    }
  };

  const handleBiometricRegister = async () => {
    if (!bioDeviceName.trim()) {
      showToast('Veuillez entrer un nom pour cet appareil.', 'error');
      return;
    }
    setBioRegLoading(true);
    try {
      await biometricService.register(bioDeviceName.trim());
      showToast('Empreinte enregistrée avec succès !');
      setShowBioModal(false);
      setBioDeviceName('');
      fetchBioCredentials();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement';
      showToast(msg, 'error');
    } finally {
      setBioRegLoading(false);
    }
  };

  const handleBiometricDelete = async (id) => {
    try {
      await biometricService.delete(id);
      showToast('Empreinte supprimée.');
      fetchBioCredentials();
    } catch {
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  const startEditCell = (attId, field, currentValue) => {
    setEditingCell({ attId, field });
    setEditValue(currentValue || '');
  };

  const saveCellEdit = async () => {
    if (!editingCell) return;
    const { attId, field } = editingCell;
    try {
      await attendanceService.updateAttendance(attId, { field, value: editValue });
      showToast(`${FIELD_LABELS[field]} modifiée`);
      setEditingCell(null);
      setEditValue('');
      fetchWeekData(weekOffset);
      if (weekOffset === 0) fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur', 'error');
    }
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const startEditNow = (field, currentValue) => {
    setEditingNowField(field);
    setEditNowValue(currentValue || '');
  };

  const saveNowEdit = async () => {
    if (!editingNowField || !attendance) return;
    try {
      await attendanceService.updateAttendance(attendance.id, {
        field: editingNowField,
        value: editNowValue,
      });
      showToast(`${FIELD_LABELS[editingNowField]} modifiée`);
      setEditingNowField(null);
      setEditNowValue('');
      fetchData();
      fetchWeekData(weekOffset);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur', 'error');
    }
  };

  const cancelNowEdit = () => {
    setEditingNowField(null);
    setEditNowValue('');
  };

  const isFieldEditable = (day, field) => {
    if (!day || !day.attendance) return false;
    if (!day.attendance[field]) return false;
    if (day.attendance[`${field}_edited`]) return false;
    if (day.is_weekend) return false;
    return isWithinRollingDays(day.date, 2);
  };

  const isNowFieldEditable = (field) => {
    if (!attendance || !attendance[field]) return false;
    if (attendance[`${field}_edited`]) return false;
    return true;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) return <Loader size="lg" />;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">Bienvenue, voici votre présence du jour.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Aujourd'hui" value={fmtHours(attendance?.total_hours)} icon="⏱️" color="indigo" />
        <StatsCard title="Cette semaine" value={fmtHours(weekSummary?.total_hours)} icon="📅" color="green" />
        <StatsCard title="Ce mois" value={fmtHours(monthSummary?.total_hours)} icon="📊" color="blue" />
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pointage du jour</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {['check_in', 'break_start', 'break_end', 'check_out'].map((field) => {
            const value = attendance?.[field];
            const editing = editingNowField === field;
            return (
              <div key={field} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">{FIELD_LABELS[field]}</p>
                {editing ? (
                  <input
                    type="time"
                    value={editNowValue}
                    onChange={(e) => setEditNowValue(e.target.value)}
                    onBlur={saveNowEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveNowEdit();
                      if (e.key === 'Escape') cancelNowEdit();
                    }}
                    className="w-full text-center text-lg font-semibold text-indigo-600 bg-white border border-indigo-300 rounded px-1 outline-none"
                    autoFocus
                  />
                ) : (
                  <p
                    className={`text-lg font-semibold ${
                      value && isNowFieldEditable(field)
                        ? 'text-indigo-600 cursor-pointer hover:bg-indigo-50 rounded'
                        : 'text-gray-900'
                    }`}
                    onClick={() => value && isNowFieldEditable(field) && startEditNow(field, value)}
                    title={isNowFieldEditable(field) ? 'Cliquer pour modifier' : ''}
                  >
                    {value || '--'}
                    {isNowFieldEditable(field) && <span className="ml-1 text-xs text-indigo-400">✎</span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="success"
              onClick={() => handleAction(() => attendanceService.checkIn(todayStr), 'Entrée pointée !')}
              disabled={actionLoading || bioLoading || !status.can_check_in}
            >
              Pointer Entrée
            </Button>
            {webauthnAvailable && (
              <button
                onClick={() => handleBiometricAction('check-in', 'Entrée pointée !')}
                disabled={actionLoading || bioLoading || !status.can_check_in}
                className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-40 text-sm"
                title="Pointer avec empreinte"
              >
                🖐️
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="warning"
              onClick={() => handleAction(attendanceService.breakStart, 'Pause débutée !')}
              disabled={actionLoading || bioLoading || !status.can_break_start}
            >
              Début Pause
            </Button>
            {webauthnAvailable && (
              <button
                onClick={() => handleBiometricAction('break-start', 'Pause débutée !')}
                disabled={actionLoading || bioLoading || !status.can_break_start}
                className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-40 text-sm"
                title="Pointer avec empreinte"
              >
                🖐️
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="primary"
              onClick={() => handleAction(attendanceService.breakEnd, 'Pause terminée !')}
              disabled={actionLoading || bioLoading || !status.can_break_end}
            >
              Fin Pause
            </Button>
            {webauthnAvailable && (
              <button
                onClick={() => handleBiometricAction('break-end', 'Pause terminée !')}
                disabled={actionLoading || bioLoading || !status.can_break_end}
                className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-40 text-sm"
                title="Pointer avec empreinte"
              >
                🖐️
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="danger"
              onClick={() => handleAction(attendanceService.checkOut, 'Sortie pointée !')}
              disabled={actionLoading || bioLoading || !status.can_check_out}
            >
              Pointer Sortie
            </Button>
            {webauthnAvailable && (
              <button
                onClick={() => handleBiometricAction('check-out', 'Sortie pointée !')}
                disabled={actionLoading || bioLoading || !status.can_check_out}
                className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-40 text-sm"
                title="Pointer avec empreinte"
              >
                🖐️
              </button>
            )}
          </div>
        </div>
        {webauthnAvailable && (
          <p className="text-xs text-gray-400 mt-2">Les boutons 🖐️ utilisent Windows Hello / empreinte digitale</p>
        )}
      </Card>

      {webauthnAvailable && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Empreinte digitale</h2>
            <Button
              variant="secondary"
              onClick={() => setShowBioModal(true)}
              disabled={bioRegLoading}
            >
              + Enregistrer
            </Button>
          </div>
          {bioCredentials.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune empreinte enregistrée. Ajoutez-en une pour pointer avec Windows Hello.</p>
          ) : (
            <div className="space-y-2">
              {bioCredentials.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.device_name}</p>
                    <p className="text-xs text-gray-400">Enregistré le {new Date(c.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <button
                    onClick={() => handleBiometricDelete(c.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showBioModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowBioModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enregistrer une empreinte</h3>
            <p className="text-sm text-gray-500 mb-4">Donnez un nom à cet appareil, puis autorisez Windows Hello.</p>
            <input
              type="text"
              value={bioDeviceName}
              onChange={(e) => setBioDeviceName(e.target.value)}
              placeholder="Ex: PC Bureau, Laptop Dell..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleBiometricRegister()}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBioModal(false)} disabled={bioRegLoading}>Annuler</Button>
              <Button onClick={handleBiometricRegister} disabled={bioRegLoading}>
                {bioRegLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 min-w-0">
            {weekData
              ? `Semaine ${weekData.week_number} (${new Date(weekData.start_date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → ${new Date(weekData.end_date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })})`
              : 'Vue hebdomadaire'}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setWeekOffset((o) => o - 1)}>
              ← Précédente
            </Button>
            <Button
              variant="outline"
              onClick={() => setWeekOffset((o) => o + 1)}
              disabled={weekOffset >= 0}
            >
              Suivante →
            </Button>
          </div>
        </div>

        {weekLoading ? (
          <Loader />
        ) : weekData ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Jour</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Entrée</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Pause début</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Pause fin</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Sortie</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weekData.days
                    .filter((d) => !d.is_weekend)
                    .map((day) => {
                      const a = day.attendance;
                      return (
                        <tr
                          key={day.date}
                          className={`hover:bg-gray-50 ${day.is_today ? 'bg-indigo-50/40' : ''}`}
                        >
                          <td className="px-3 py-3 text-sm">
                            <span className={`font-medium ${day.is_today ? 'text-indigo-600' : 'text-gray-900'}`}>
                              {WEEKDAYS[getWeekdayIndex(day.date)]}
                            </span>
                            <span className="text-gray-400 ml-1 text-xs">
                              {formatDateShort(day.date)}
                            </span>
                          </td>
                          {['check_in', 'break_start', 'break_end', 'check_out'].map((field) => {
                            const isEditing = editingCell?.attId === a?.id && editingCell?.field === field;
                            const editable = isFieldEditable(day, field);
                            return (
                              <td key={field} className="px-3 py-3 text-sm">
                                {isEditing ? (
                                  <input
                                    type="time"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={saveCellEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveCellEdit();
                                      if (e.key === 'Escape') cancelCellEdit();
                                    }}
                                    className="w-20 text-center text-indigo-600 bg-white border border-indigo-300 rounded px-1 py-0.5 outline-none text-sm"
                                    autoFocus
                                  />
                                ) : (
                                  <span
                                    className={`${
                                      editable
                                        ? 'text-indigo-600 cursor-pointer hover:bg-indigo-50 rounded px-1 -ml-1'
                                        : a?.[field]
                                        ? 'text-gray-900'
                                        : 'text-gray-300'
                                    }`}
                                    onClick={() => editable && startEditCell(a.id, field, a[field])}
                                    title={editable ? 'Cliquer pour modifier (1 modification)' : ''}
                                  >
                                    {a?.[field] || '--'}
                                    {editable && <span className="ml-0.5 text-[10px] text-indigo-400">✎</span>}
                                    {a?.[`${field}_edited`] && <span className="ml-0.5 text-[10px] text-green-500">✓</span>}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-sm font-medium text-gray-900">
                            {fmtHours(a?.total_hours)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-500">Total de la semaine</span>
              <span className="text-lg font-bold text-gray-900">{fmtHours(weekData.total_hours)}</span>
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-center py-8">Aucune donnée pour cette semaine.</p>
        )}
      </Card>
    </div>
  );
}
