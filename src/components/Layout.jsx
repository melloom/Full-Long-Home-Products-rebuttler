import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useScrollToTop, scrollToTop } from '../utils/useScrollToTop';
import PWAInstall from './PWAInstall';
import PWAUpdateNotification from './PWAUpdateNotification';
import PWAStatus from './PWAStatus';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Use custom hook for scroll to top
  useScrollToTop();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/rebuttals', label: 'Rebuttals', icon: '💬' },
    { path: '/disposition', label: 'Disposition', icon: '📋' },
    { path: '/customerService', label: 'Customer Service', icon: '👥' },
    { path: '/faq', label: 'FAQ', icon: '❓' },
    { path: '/scheduleScript', label: 'Schedule Script', icon: '📅' }
  ];

  const handleInstallSuccess = (outcome) => {
    if (outcome === 'accepted') {
      console.log('PWA installed successfully!');
    }
  };

  const toggleNav = () => {
    setIsNavCollapsed(!isNavCollapsed);
  };

  const toggleHide = () => {
    setIsNavHidden(!isNavHidden);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setTimeout(scrollToTop, 0);    // After navigation
    setTimeout(scrollToTop, 200);  // After render
  };

  return (
    <div className="layout">
      <main className={`main-content ${isNavCollapsed ? 'expanded' : ''} ${location.pathname === '/' ? 'home-page' : ''}`}>
        {children}
      </main>
      {!isNavHidden && (
        <nav className={`side-nav ${isNavCollapsed ? 'collapsed' : ''}`}>
          <div className="nav-header">
            <h2>StayOnScript</h2>
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
                onClick={() => handleNavigation(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isNavCollapsed && <span className="nav-label">{item.label}</span>}
              </li>
            ))}
          </ul>
          <div className="nav-footer">
            <PWAInstall onInstall={handleInstallSuccess} isCollapsed={isNavCollapsed} />
            <PWAStatus isCollapsed={isNavCollapsed} />
          </div>
        </nav>
      )}
      {isNavHidden && (
        <button className="show-nav-button" onClick={toggleHide} aria-label="Show navigation">
          →
        </button>
      )}

      {/* PWA Update Notification */}
      <PWAUpdateNotification />
    </div>
  );
};

export default Layout; 