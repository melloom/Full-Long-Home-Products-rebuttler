import React, { useState, useEffect } from 'react';
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

  // Keyboard shortcut for Help Me modal (Ctrl/Cmd + Shift + H)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        setShowComingSoon(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
      <main className={`main-content ${isNavCollapsed ? 'expanded' : ''}`}>
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
          
          {/* Help Me Section */}
          <div className="help-me-section">
            <button 
              className="help-me-button"
              onClick={() => setShowComingSoon(true)}
              title="How to access login page (Ctrl/Cmd + Shift + H)"
            >
              <span className="help-icon">🆘</span>
              {!isNavCollapsed && <span className="help-label">Help Me</span>}
            </button>
          </div>
          
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
      
      {/* Help Me Modal */}
      {showComingSoon && (
        <div className="help-modal-overlay" onClick={() => setShowComingSoon(false)}>
          <div className="help-modal-content" onClick={e => e.stopPropagation()}>
            <div className="help-modal-header">
              <h3>How to Access Login Page</h3>
              <button className="help-modal-close" onClick={() => setShowComingSoon(false)}>×</button>
            </div>
            <div className="help-modal-body">
              <div className="help-step">
                <h4>Step 1: Navigate to Admin</h4>
                <p>Add <code>/admin</code> to the end of your current URL</p>
                <p><strong>Example:</strong> <code>https://stayonscript.netlify.app/admin</code></p>
              </div>
              <div className="help-step">
                <h4>Step 2: Login</h4>
                <p>Use your admin credentials to access the admin dashboard</p>
              </div>
              <div className="help-step">
                <h4>Alternative Method</h4>
                <p>You can also bookmark the admin URL for quick access</p>
              </div>
              <div className="help-step">
                <h4>Keyboard Shortcuts</h4>
                <p><strong>Help Modal:</strong> Press <code>Ctrl + Shift + H</code> (or <code>Cmd + Shift + H</code> on Mac)</p>
                <p><strong>Admin Login:</strong> Press <code>Ctrl + Shift + L</code> (or <code>Cmd + Shift + L</code> on Mac)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout; 