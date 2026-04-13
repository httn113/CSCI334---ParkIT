import { useState, Suspense, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import './DashboardLayout.css';

export default function DashboardLayout({ navItems, title, subtitle, avatarLetter, badgeText, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeLabel = navItems.find((item) => item.path === location.pathname)?.label || navItems[0]?.label;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div className="parkit-layout">
      {/* Sidebar */}
      <aside className={`parkit-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">{title}</span>
            <span className="brand-sub">{subtitle}</span>
          </div>
        </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-section-label">Menu</span>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                id={`nav-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                className={`nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {isActive && <span className="nav-active-dot" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-footer">
          <div className="sidebar-divider" />
          <button id="nav-logout" className="nav-item login-item" onClick={logout}>
            <span className="nav-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="parkit-main">
        <header className="topbar">
          <button
            className={`mobile-menu-btn${mobileMenuOpen ? ' menu-open' : ''}`}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span /><span /><span />
          </button>
          <h1 className="topbar-title">{activeLabel}</h1>
          <div className="topbar-right">
            <div className="topbar-badge">{badgeText}</div>
            <div className="topbar-avatar" aria-hidden="true">{avatarLetter}</div>
          </div>
        </header>

        <section className="page-body">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="page-loader">
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
              </div>
            }>
              {children}
            </Suspense>
          </ErrorBoundary>
        </section>
      </main>
    </div>
  );
}
