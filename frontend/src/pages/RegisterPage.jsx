import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const register = useAuthStore(s => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registrierung fehlgeschlagen.');
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Konto erstellen</h1>
          <p className="text-gray-500 text-sm mb-6">Registrieren Sie sich, um Lebensläufe zu erstellen.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Vollständiger Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Vorname Nachname"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">E-Mail-Adresse</label>
              <input
                type="email"
                className="input-field"
                placeholder="name@beispiel.de"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Passwort</label>
              <input
                type="password"
                className="input-field"
                placeholder="Mindestens 6 Zeichen"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? 'Wird registriert…' : 'Registrieren'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Bereits registriert?{' '}
            <Link to="/login" className="text-brand font-medium hover:underline">
              Anmelden
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-gray-400">
            Mit der Registrierung stimmen Sie unseren{' '}
            <Link to="/agb" className="hover:underline">AGB</Link>{' '}
            und der{' '}
            <Link to="/datenschutz" className="hover:underline">Datenschutzerklärung</Link>{' '}
            zu.
          </p>
          <p className="mt-1 text-center text-xs text-gray-400">
            <Link to="/impressum" className="hover:underline">Impressum</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
