import { Link } from 'react-router-dom';
import { FileText, Eye, Download, Sparkles, ChevronRight, Zap } from 'lucide-react';

function LinkedinIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

const FEATURES = [
  {
    icon: FileText,
    title: '5 professionelle Vorlagen',
    desc: 'Von klassisch bis modern – wählen Sie die Vorlage, die zu Ihnen passt.',
  },
  {
    icon: Eye,
    title: 'Live-Vorschau',
    desc: 'Jede Änderung wird sofort in der Vorschau angezeigt. Was Sie sehen, bekommen Sie.',
  },
  {
    icon: Download,
    title: 'PDF-Export in Sekunden',
    desc: 'Laden Sie Ihren fertigen Lebenslauf als druckfertiges A4-PDF herunter.',
  },
  {
    icon: Sparkles,
    title: 'KI-Unterstützung',
    desc: 'Lassen Sie sich bei Ihrem Anschreiben von KI unterstützen – schnell und individuell.',
  },
];

const TEMPLATES = [
  { name: 'Modern', desc: 'Zweispaltig mit farbiger Sidebar' },
  { name: 'Klassisch', desc: 'Zeitlos und bewährt' },
  { name: 'Elegant', desc: 'Serifenschrift, edle Optik' },
  { name: 'Kreativ', desc: 'Farbenfroh und dynamisch' },
  { name: 'Minimal', desc: 'Reduziert und fokussiert' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Public Navbar ─────────────────────────────────────────── */}
      <header className="bg-brand shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <img src="/we_logo_white_tran.png" alt="WeCruiting" className="h-28 w-auto" />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors px-4 py-2"
            >
              Anmelden
            </Link>
            <Link
              to="/registrieren"
              className="text-sm font-semibold bg-white text-brand px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="bg-brand text-white py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.6] mb-6">
            Ihr professioneller Lebenslauf<br className="hidden sm:block" /> in Minuten mit{' '}
            <span className="inline-flex items-center gap-1.5 bg-white text-[#0A66C2] font-semibold px-3 py-1 rounded-full align-middle shadow-sm" style={{ fontSize: '0.78em' }}>
              <LinkedinIcon size={13} />
              LinkedIn-Import
            </span>{' '}erstellt.
          </h1>
          <p className="text-lg text-white/75 mb-10 max-w-xl mx-auto leading-relaxed">
            Wählen Sie aus 5 Vorlagen, füllen Sie Ihre Daten aus und laden Sie
            Ihren Lebenslauf als druckfertiges PDF herunter. Kostenlos und ohne Vorkenntnisse.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/registrieren"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand font-semibold px-8 py-4 rounded-xl text-base hover:bg-brand-50 transition-colors shadow-lg"
            >
              Jetzt kostenlos starten
              <ChevronRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 border border-white/40 text-white font-medium px-8 py-4 rounded-xl text-base hover:bg-white/10 transition-colors"
            >
              Bereits registriert? Anmelden
            </Link>
          </div>
        </div>
      </section>

      {/* ── LinkedIn Import ───────────────────────────────────────── */}
      <section className="bg-white py-20 px-4 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#0A66C2]/8 to-brand/8 rounded-3xl border border-[#0A66C2]/15 p-8 sm:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-10">

              {/* Text */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-[#0A66C2]/10 text-[#0A66C2] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                  <LinkedinIcon size={13} />
                  LinkedIn-Import
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-snug">
                  LinkedIn-Profil teilen –<br className="hidden sm:block" /> Lebenslauf in Sekunden erstellt.
                </h2>
                <p className="text-gray-500 leading-relaxed mb-6 max-w-lg">
                  Kein mühsames Abtippen. Teilen Sie einfach Ihr LinkedIn-Profil,
                  und wir übernehmen Ihre Berufserfahrung, Ausbildung und Kenntnisse automatisch –
                  fertig zum Bearbeiten und Herunterladen.
                </p>
                <Link
                  to="/registrieren"
                  className="inline-flex items-center gap-2 bg-brand text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-brand/90 transition-colors shadow-md"
                >
                  Jetzt ausprobieren
                  <ChevronRight size={16} />
                </Link>
              </div>

              {/* Steps */}
              <div className="flex flex-col gap-4 lg:min-w-[260px]">
                {[
                  { step: '1', label: 'LinkedIn Profil teilen', icon: LinkedinIcon },
                  { step: '2', label: 'Daten werden automatisch übernommen', icon: Zap },
                  { step: '3', label: 'Vorlage wählen & PDF herunterladen', icon: Download },
                ].map(({ step, label, icon: Icon }) => (
                  <div key={step} className="flex items-center gap-4 bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100">
                    <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-white" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Schritt {step}</div>
                      <div className="text-sm font-semibold text-gray-800 leading-snug">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3">
            Alles, was Sie für Ihre Bewerbung brauchen
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            WeCruiting macht aus Ihren Daten ein überzeugendes Bewerbungsdokument.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-gray-100 hover:border-brand-100 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Templates ─────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3">
            5 Vorlagen – für jeden Stil
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Ob Berufseinsteiger oder erfahrene Fachkraft – bei uns finden Sie die passende Vorlage.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {TEMPLATES.map(({ name, desc }) => (
              <div key={name} className="bg-white rounded-xl border border-gray-100 p-5 text-center hover:border-brand hover:shadow-md transition-all group">
                <div className="w-10 h-14 bg-brand-50 rounded-md mx-auto mb-3 flex items-center justify-center group-hover:bg-brand transition-colors">
                  <FileText size={20} className="text-brand group-hover:text-white transition-colors" strokeWidth={1.5} />
                </div>
                <div className="font-semibold text-gray-800 text-sm">{name}</div>
                <div className="text-xs text-gray-400 mt-1 leading-snug">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      <section className="bg-brand py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Bereit für Ihren nächsten Karriereschritt?
          </h2>
          <p className="text-white/75 mb-8">
            Erstellen Sie Ihren Lebenslauf jetzt – kostenlos, schnell und professionell.
          </p>
          <Link
            to="/registrieren"
            className="inline-flex items-center gap-2 bg-white text-brand font-semibold px-8 py-4 rounded-xl text-base hover:bg-brand-50 transition-colors shadow-lg"
          >
            Kostenlos registrieren
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <span>© {new Date().getFullYear()} WeCruiting Consulting GmbH</span>
          <div className="flex items-center gap-6">
            <Link to="/impressum" className="hover:text-white transition-colors">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
            <Link to="/agb" className="hover:text-white transition-colors">AGB</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
