import { useState, useEffect } from 'react';
import { Users, Briefcase, Building2, TrendingUp, Activity, BarChart2 } from 'lucide-react';
import CandidatesKanban from '../components/crm/CandidatesKanban';
import CandidatePanel from '../components/crm/CandidatePanel';
import JobsList from '../components/crm/JobsList';
import CompaniesList from '../components/crm/CompaniesList';
import api from '../services/api';

const TABS = [
  { key: 'kandidaten', label: 'Kandidaten',  Icon: Users },
  { key: 'jobs',       label: 'Stellen',     Icon: Briefcase },
  { key: 'kunden',     label: 'Kunden',      Icon: Building2 },
];

function StatCard({ label, value, Icon, color = 'bg-brand/10 text-brand', sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '–'}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {sub && <p className="text-xs text-green-600 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState('kandidaten');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    api.get('/crm/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const handleCandidateUpdate = updated => {
    setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedCandidate?.id === updated.id) setSelectedCandidate(updated);
  };

  const handleCandidateDelete = id => {
    setCandidates(prev => prev.filter(c => c.id !== id));
    setSelectedCandidate(null);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 size={24} className="text-brand" />
          Recruiting CRM
        </h1>
        <p className="text-sm text-gray-500 mt-1">Kandidaten · Stellen · Kunden — alles an einem Ort</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Kandidaten gesamt"
            value={stats.totalCandidates}
            Icon={Users}
            color="bg-brand/10 text-brand"
          />
          <StatCard
            label="Platzierungen"
            value={stats.placements}
            Icon={TrendingUp}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            label="Offene Stellen"
            value={stats.openJobs}
            Icon={Briefcase}
            color="bg-amber-100 text-amber-600"
          />
          <StatCard
            label="Kunden"
            value={stats.totalCompanies}
            Icon={Building2}
            color="bg-violet-100 text-violet-600"
          />
        </div>
      )}

      {/* Pipeline mini-overview */}
      {stats?.candidatesByStage && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pipeline-Übersicht</p>
          <div className="flex items-end gap-1 h-12">
            {[
              { key: 'neu',         label: 'Neu',          color: 'bg-gray-400' },
              { key: 'kontaktiert', label: 'Kontaktiert',  color: 'bg-blue-500' },
              { key: 'vorgestellt', label: 'Vorgestellt',  color: 'bg-violet-500' },
              { key: 'interview',   label: 'Interview',    color: 'bg-amber-500' },
              { key: 'angebot',     label: 'Angebot',      color: 'bg-orange-500' },
              { key: 'platziert',   label: 'Platziert',    color: 'bg-green-500' },
            ].map(s => {
              const count = stats.candidatesByStage[s.key] || 0;
              const max = Math.max(...Object.values(stats.candidatesByStage), 1);
              const pct = Math.max((count / max) * 100, count > 0 ? 8 : 0);
              return (
                <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-gray-700">{count}</span>
                  <div
                    className={`w-full rounded-t-sm ${s.color} transition-all`}
                    style={{ height: `${pct}%` }}
                    title={`${s.label}: ${count}`}
                  />
                  <span className="text-[10px] text-gray-400 text-center leading-tight">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
              ${activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            <tab.Icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="relative">
        {activeTab === 'kandidaten' && (
          <CandidatesKanban onSelectCandidate={setSelectedCandidate} />
        )}
        {activeTab === 'jobs' && <JobsList />}
        {activeTab === 'kunden' && <CompaniesList />}
      </div>

      {/* Candidate slide-over */}
      {selectedCandidate && (
        <CandidatePanel
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onUpdate={handleCandidateUpdate}
          onDelete={handleCandidateDelete}
        />
      )}
    </div>
  );
}
