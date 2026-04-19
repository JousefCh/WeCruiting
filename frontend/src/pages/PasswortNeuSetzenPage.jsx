import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function PasswortNeuSetzenPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-brand flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src="/we_logo_white_tran.png" alt="WeCruiting" className="h-40 w-auto" />
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <p className="text-gray-700 mb-4">Ungültiger oder fehlender Reset-Link.</p>
            <Link to="/passwort-vergessen" className="text-brand font-medium hover:underline text-sm">
              Neuen Link anfordern
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="/we_logo_white_tran.png" alt="WeCruiting" className="h-40 w-auto" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Passwort geändert</h1>
              <p className="text-gray-500 text-sm mb-6">
                Ihr Passwort wurde erfolgreich zurückgesetzt. Sie werden in Kürze zum Login weitergeleitet.
              </p>
              <Link to="/login" className="btn-primary w-full py-3 text-base inline-block text-center">
                Jetzt anmelden
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Neues Passwort</h1>
              <p className="text-gray-500 text-sm mb-6">
                Vergeben Sie ein neues Passwort für Ihr WeCruiting-Konto.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Neues Passwort</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Mindestens 6 Zeichen"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Passwort bestätigen</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Passwort wiederholen"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                  {loading ? 'Wird gespeichert…' : 'Passwort speichern'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
