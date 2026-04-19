import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function PasswortVergessenPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
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
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">E-Mail versendet</h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Falls ein Konto mit der Adresse <strong>{email}</strong> existiert,
                haben Sie eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts erhalten.
                Bitte prüfen Sie auch Ihren Spam-Ordner.
              </p>
              <Link to="/login" className="btn-primary w-full py-3 text-base inline-block text-center">
                Zurück zum Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Passwort vergessen?</h1>
              <p className="text-gray-500 text-sm mb-6">
                Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">E-Mail-Adresse</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="name@beispiel.de"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                  {loading ? 'Wird gesendet…' : 'Link anfordern'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                <Link to="/login" className="text-brand font-medium hover:underline">
                  ← Zurück zum Login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
