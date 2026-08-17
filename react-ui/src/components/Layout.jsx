import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../api';
import './Layout.css';

const tabs = [
  { path: '/',        label: 'Explore', icon: 'explore' },
  { path: '/create',  label: 'Create',  icon: 'add_circle_outline' },
  { path: '/history', label: 'History', icon: 'history' },
  { path: '/profile', label: 'Profile', icon: 'person_outline' },
];

const getBadgeTierInfo = (qCount) => {
  if (qCount >= 10000) return { name: 'Conqueror', icon: '⚔️', color: '#EF4444' };
  if (qCount >= 5000)  return { name: 'Quiz Master', icon: '⚡', color: '#8B5CF6' };
  if (qCount >= 1000)  return { name: 'Master', icon: '👑', color: '#F59E0B' };
  if (qCount >= 500)   return { name: 'Diamond', icon: '💎', color: '#06B6D4' };
  if (qCount >= 250)   return { name: 'Gold', icon: '🥇', color: '#EAB308' };
  if (qCount >= 100)   return { name: 'Silver', icon: '🥈', color: '#94A3B8' };
  if (qCount >= 50)    return { name: 'Bronze', icon: '🥉', color: '#D97706' };
  return { name: 'Novice', icon: '🎯', color: '#64748B' };
};

export default function Layout() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchBadgeData = async () => {
      try {
        const query = user?.email ? `?user_email=${encodeURIComponent(user.email)}` : '';
        const statsData = await apiGet(`/api/student/profile${query}`);
        const totalQ = statsData?.stats?.total_questions ?? 0;
        setTotalQuestions(totalQ);
      } catch (e) {
        // quiet fallback
      }
    };
    fetchBadgeData();
  }, [isAuthenticated, user?.email]);

  const currentBadge = getBadgeTierInfo(totalQuestions);

  return (
    <div className="app-container">
      <div className="app-layout">
        {/* Top bar */}
        <header className="top-bar">
          <div className="top-bar-inner">
            {/* Left: Brand Logo */}
            <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <span className="material-symbols-outlined brand-icon">psychology</span>
              <span className="brand-text">QuizAI</span>
            </div>
            
            {/* Center: Desktop Navigation Links */}
            <nav className="desktop-nav">
              {tabs.map(tab => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end={tab.path === '/'}
                  className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>

            {/* Right: Auth Section */}
            <div className="header-auth-section">
              {isAuthenticated ? (
                <div className="user-nav-pill">
                  <NavLink to="/profile" className="nav-profile-link">
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
                      alt={user.name}
                      className="nav-user-avatar"
                    />
                    <div className="nav-user-details-col">
                      <span className="nav-user-name">{user.name}</span>
                      <span className="nav-user-badge-tag" style={{ color: currentBadge.color }}>
                        {currentBadge.icon} {currentBadge.name}
                      </span>
                    </div>
                  </NavLink>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 22px',
                    borderRadius: '10px',
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#2563EB'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#3B82F6'; }}
                >
                  Sign In
                </NavLink>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet />
        </main>
        
        {/* Desktop Footer */}
        <footer className="desktop-footer">
          <a>Terms of Service</a> <a>Privacy Policy</a> <a>Academic Integrity</a> <a>Support</a>
        </footer>

        {/* Bottom navigation — Mobile only */}
        <nav className="bottom-nav">
          {tabs.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
            >
              <div className="nav-tab-icon-wrap">
                <span className="material-symbols-outlined nav-tab-icon">
                  {tab.icon}
                </span>
              </div>
              <span className="nav-tab-label">{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
