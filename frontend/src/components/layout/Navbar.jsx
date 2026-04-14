import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Info, Compass, LogOut, GraduationCap } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GraduationCap size={22} color="var(--blue)" />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>OrientIA</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4 }}>
          <NavLink to="/information" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
            borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--bg-hover)' : 'transparent',
            transition: 'all 0.15s'
          })}>
            <Info size={16} />
            Information
          </NavLink>
          <NavLink to="/orientation" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
            borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--bg-hover)' : 'transparent',
            transition: 'all 0.15s'
          })}>
            <Compass size={16} />
            Orientation
          </NavLink>
        </div>

        {/* User + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {user?.firstName} {user?.lastName}
          </span>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Se déconnecter">
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}