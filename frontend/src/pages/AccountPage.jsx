import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function AccountPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (next.length < 6) {
      setError('Das neue Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    if (next !== confirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: current, newPassword: next });
      setSuccess('Passwort wurde erfolgreich geändert.');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      setError(err.response?.data?.error || 'Passwort konnte nicht geändert werden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand mb-8 transition-colors"
      >
        <ArrowLeft size={15} /> Zurück zum Dashboard
      </button>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Mein Konto</h2>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span className="text-gray-400">Name</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">E-Mail</span>
            <span className="font-medium">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound size={16} className="text-brand" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-gray-900">Passwort ändern</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Aktuelles Passwort</label>
            <input
              type="password"
              className="input-field"
              placeholder="Aktuelles Passwort"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Neues Passwort</label>
            <input
              type="password"
              className="input-field"
              placeholder="Mindestens 6 Zeichen"
              value={next}
              onChange={e => setNext(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Neues Passwort bestätigen</label>
            <input
              type="password"
              className="input-field"
              placeholder="Passwort wiederholen"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Wird gespeichert…' : 'Passwort speichern'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Abmelden</p>
            <p className="text-xs text-gray-400 mt-0.5">Sie werden auf die Startseite weitergeleitet.</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}
