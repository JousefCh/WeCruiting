import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import * as cvService from '../services/cvService';
import CVCard from '../components/dashboard/CVCard';

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [cvs, setCVs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    cvService.listCVs().then(setCVs).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Lebenslauf wirklich löschen?')) return;
    setDeletingId(id);
    await cvService.deleteCV(id);
    setCVs(cvs => cvs.filter(c => c.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Guten Tag, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Ihre gespeicherten Lebensläufe</p>
        </div>
        <button
          onClick={() => navigate('/lebenslauf/neu')}
          className="btn-primary px-5 py-2.5 flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Neuen Lebenslauf erstellen
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cvs.length === 0 ? (
        <EmptyState onNew={() => navigate('/lebenslauf/neu')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cvs.map(cv => (
            <CVCard
              key={cv.id}
              cv={cv}
              onEdit={() => navigate(`/lebenslauf/${cv.id}`)}
              onDelete={() => handleDelete(cv.id)}
              isDeleting={deletingId === cv.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Noch keine Lebensläufe</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        Erstellen Sie Ihren ersten professionellen Lebenslauf – in wenigen Minuten fertig.
      </p>
      <button onClick={onNew} className="btn-primary px-6 py-3">
        Ersten Lebenslauf erstellen
      </button>
    </div>
  );
}
