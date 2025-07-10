import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/rebuttals', label: 'Rebuttals', icon: '💬' },
    { path: '/disposition', label: 'Disposition', icon: '📋' },
    { path: '/customerService', label: 'Customer Service', icon: '👥' },
    { path: '/faq', label: 'FAQ', icon: '❓' },
    { path: '/scheduleScript', label: 'Schedule Script', icon: '📅' }
  ];

  const handleDownload = () => {
    setShowComingSoon(true);
  };

  const closeComingSoon = () => {
    setShowComingSoon(false);
  };

  const toggleNav = () => {
    setIsNavCollapsed(!isNavCollapsed);
  };

  const toggleHide = () => {
    setIsNavHidden(!isNavHidden);
  };

  return (
    <div className="layout">
      <main className={`main-content ${isNavCollapsed ? 'expanded' : ''} ${isNavHidden ? 'full-width' : ''}`}>
        {children}
      </main>
      {!isNavHidden && (
        <nav className={`side-nav ${isNavCollapsed ? 'collapsed' : ''}`}>
          <div className="nav-header">
            <h2>CloseLoop</h2>
            <div className="nav-buttons">
              <button className="nav-toggle" onClick={toggleNav} aria-label={isNavCollapsed ? 'Expand navigation' : 'Collapse navigation'}>
                {isNavCollapsed ? '→' : '←'}
              </button>
              {isNavCollapsed && (
                <button className="nav-hide" onClick={toggleHide} aria-label="Hide navigation">
                  ✕
                </button>
              )}
            </div>
          </div>
          <ul className="nav-items">
            {navItems.map((item) => (
              <li
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isNavCollapsed && <span className="nav-label">{item.label}</span>}
              </li>
            ))}
          </ul>
          <div className="nav-footer">
            <button 
              className="download-button"
              onClick={handleDownload}
              title="Download Desktop App"
            >
              <span className="download-icon">⬇️</span>
              {!isNavCollapsed && <span className="download-text">Download App</span>}
            </button>
          </div>
        </nav>
      )}
      {isNavHidden && (
        <button className="show-nav-button" onClick={toggleHide} aria-label="Show navigation">
          →
        </button>
      )}

      {/* Coming Soon Popup */}
      {showComingSoon && (
        <div className="coming-soon-overlay" onClick={closeComingSoon}>
          <div className="coming-soon-popup" onClick={(e) => e.stopPropagation()}>
            <div className="coming-soon-header">
              <h2>🚀 Coming Soon!</h2>
              <button className="coming-soon-close" onClick={closeComingSoon}>
                ✕
              </button>
            </div>
            <div className="coming-soon-content">
              <div className="coming-soon-icon">💻</div>
              <h3>Desktop App</h3>
              <p>We're working hard to bring you the desktop version of CloseLoop. Stay tuned for updates!</p>
              <div className="coming-soon-features">
                <div className="feature">
                  <span className="feature-icon">⚡</span>
                  <span>Faster Performance</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔒</span>
                  <span>Enhanced Security</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔄</span>
                  <span>Offline Access</span>
                </div>
              </div>
            </div>
            <div className="coming-soon-footer">
              <button className="coming-soon-button" onClick={closeComingSoon}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout; 