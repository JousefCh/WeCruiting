import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PasswortVergessenPage from './pages/PasswortVergessenPage';
import PasswortNeuSetzenPage from './pages/PasswortNeuSetzenPage';
import DashboardPage from './pages/DashboardPage';
import CVBuilderPage from './pages/CVBuilderPage';
import AccountPage from './pages/AccountPage';
import DatenschutzPage from './pages/DatenschutzPage';
import ImpressumPage from './pages/ImpressumPage';
import AgbPage from './pages/AgbPage';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 bg-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-5 text-xs text-gray-400">
          <Link to="/impressum" className="hover:text-gray-600 transition-colors">Impressum</Link>
          <span>·</span>
          <Link to="/agb" className="hover:text-gray-600 transition-colors">AGB</Link>
          <span>·</span>
          <Link to="/datenschutz" className="hover:text-gray-600 transition-colors">Datenschutz</Link>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const initialize = useAuthStore(s => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registrieren" element={<RegisterPage />} />
        <Route path="/passwort-vergessen" element={<PasswortVergessenPage />} />
        <Route path="/passwort-neu-setzen" element={<PasswortNeuSetzenPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/agb" element={<AgbPage />} />

        {/* Protected app pages */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout><DashboardPage /></Layout>} path="/dashboard" />
          <Route element={<Layout><AccountPage /></Layout>} path="/konto" />
          <Route element={<Layout><CVBuilderPage /></Layout>} path="/lebenslauf/neu" />
          <Route element={<Layout><CVBuilderPage /></Layout>} path="/lebenslauf/:id" />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
