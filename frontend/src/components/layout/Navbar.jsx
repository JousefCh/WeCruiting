import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="bg-brand shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <img
              src="/we_logo_white_tran.png"
              alt="WeCruiting"
              className="h-28 w-auto"
            />
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'text-white'
                  : 'text-brand-100 hover:text-white'
              }`}
            >
              Meine Lebensläufe
            </Link>
            <Link
              to="/lebenslauf/neu"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/lebenslauf/neu'
                  ? 'text-white'
                  : 'text-brand-100 hover:text-white'
              }`}
            >
              + Neuer Lebenslauf
            </Link>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-xs text-brand-100 hover:text-white hidden md:block transition-colors"
            >
              Startseite
            </Link>
            <Link
              to="/konto"
              className={`hidden sm:flex items-center gap-1.5 text-sm transition-colors ${
                isActive('/konto') ? 'text-white' : 'text-brand-100 hover:text-white'
              }`}
              title="Konto & Passwort"
            >
              <UserRound size={15} strokeWidth={1.75} />
              <span className="hidden md:inline">{user?.name}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-brand-100 hover:text-white border border-brand-200 hover:border-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
