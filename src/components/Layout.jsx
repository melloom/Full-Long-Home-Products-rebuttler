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
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Use custom hook for scroll to top
  useScrollToTop();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Help Me modal (Ctrl/Cmd + Shift + H)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        setShowComingSoon(true);
      }
      
      // Clear company token and return to SaaS landing page (Ctrl/Cmd + Shift + R)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        clearCompanyToken();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Function to clear company token and return to SaaS landing page
  const clearCompanyToken = () => {
    console.log('🧹 Clearing company token and returning to SaaS landing page...');
    localStorage.removeItem('companyUser');
    localStorage.removeItem('currentCompanySlug');
    localStorage.removeItem('adminUser'); // Also clear admin user to ensure clean state
    window.location.href = '/';
  };

  const currentSlug = (location.pathname.startsWith('/company/') ? location.pathname.split('/')[2] : (localStorage.getItem('currentCompanySlug') || null));
  const homePath = currentSlug ? (currentSlug === 'long-home' ? '/app' : `/company/${currentSlug}`) : '/';

  // Company status checking is now handled in CompanyPlatform component
  const isDev = import.meta.env.DEV;
  const isAdmin = localStorage.getItem('adminUser') || localStorage.getItem('saasAdminUser');
  const showScheduleScript = isDev || isAdmin;
  
  const navItems = [
    { path: homePath, label: 'Home', icon: '🏠' },
    { path: '/rebuttals', label: 'Rebuttals', icon: '💬' },
    { path: '/disposition', label: 'Disposition', icon: '📋' },
    { path: '/customerService', label: 'Customer Service', icon: '👥' },
    { path: '/faq', label: 'FAQ', icon: '❓' },
    { path: '/scheduleScript', label: 'Schedule Script', icon: '📅', comingSoon: !showScheduleScript }
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
    try {
      const currentPath = location.pathname;
      const currentSlug = localStorage.getItem('currentCompanySlug');
      console.log('🧭 Layout: handleNavigation', { path, currentPath, currentSlug });

      // Prevent redundant navigation (avoid unintended redirects causing flicker)
      if (path === currentPath) {
        console.log('🧭 Layout: navigation skipped, already on path', path);
        return;
      }

      navigate(path);
      setTimeout(scrollToTop, 0);    // After navigation
      setTimeout(scrollToTop, 200);  // After render
    } catch (err) {
      console.error('🧭 Layout: navigation error', err);
      navigate(path);
    }
  };

  return (
    <div className="layout">
      <main className={`main-content ${isNavCollapsed ? 'expanded' : ''}`}>
        {children}
      </main>
      {!isNavHidden && (
        <nav className={`side-nav ${isNavCollapsed ? 'collapsed' : ''}`}>
          <div className="nav-header">
            {!isNavCollapsed && (
              <h2 className="nav-title">Navigation</h2>
            )}
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
                {!isNavCollapsed && (
                  <span className="nav-label">
                    {item.label}
                    {item.comingSoon && (
                      <span style={{
                        fontSize: '0.7rem',
                        color: '#fbbf24',
                        marginLeft: '0.5rem',
                        fontWeight: 600
                      }}>🚀 Soon</span>
                    )}
                  </span>
                )}
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
                <p><strong>Example:</strong> <code>https://longhome-rebuttal-hub.netlify.app/admin</code></p>
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
                <p><strong>Reset Company Token:</strong> Press <code>Ctrl + Shift + R</code> (or <code>Cmd + Shift + R</code> on Mac)</p>
                <p style={{fontSize: '0.9em', color: '#666', marginTop: '8px'}}>
                  <em>Use "Reset Company Token" to clear your company association and return to the SaaS landing page</em>
                </p>
              </div>
              <div className="help-step">
                <h4>For Company Users</h4>
                <p><strong>Reset Company Association:</strong> If you're trained to a specific company and want to return to the main SaaS landing page, use the keyboard shortcut above.</p>
                <p>This will clear your company token and take you back to the main landing page where you can access different company training platforms.</p>
              </div>
              <div className="help-step">
                <h4>SaaS Admin Dashboard</h4>
                <p>For managing multiple companies and platforms, visit: <code>/admin/saas</code></p>
                <p>This allows you to create and manage training platforms for different companies.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout; 