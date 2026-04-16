import { Link, useNavigate, useLocation } from 'react-router-dom';
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
              className="h-9 w-auto"
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
            <span className="text-brand-100 text-sm hidden sm:block">
              {user?.name}
            </span>
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
