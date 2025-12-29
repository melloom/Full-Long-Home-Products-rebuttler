import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './SaaSLandingPage.css';

const SaaSLandingPage = () => {
  const navigate = useNavigate();
  const { hasPersistentSession, getUserType } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardPath, setDashboardPath] = useState('/admin/login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Detect existing session and set dashboard path
    console.log('🔄 SaaSLandingPage: Checking for persistent session...');
    
    if (hasPersistentSession()) {
      const userType = getUserType();
      console.log('🔄 SaaSLandingPage: Found user type:', userType);
      
      if (userType) {
        setIsLoggedIn(true);
        
        if (userType.type === 'admin') {
          // Set appropriate admin dashboard path but don't auto-redirect
          // Allow users to stay on landing page if they explicitly navigate here
          switch (userType.role) {
            case 'super-admin':
              console.log('🔄 SaaSLandingPage: Super admin detected, setting dashboard path to SaaS dashboard');
              setDashboardPath('/admin/saas');
              break;
            case 'company-admin':
              console.log('🔄 SaaSLandingPage: Company admin detected, setting dashboard path to admin dashboard');
              setDashboardPath('/admin/dashboard');
              break;
            default:
              console.log('🔄 SaaSLandingPage: Regular admin detected, setting dashboard path to admin dashboard');
              setDashboardPath('/admin/dashboard');
              break;
          }
        } else if (userType.type === 'company-user') {
          // Set company landing page path but don't auto-redirect
          const currentCompanySlug = localStorage.getItem('currentCompanySlug');
          if (currentCompanySlug) {
            console.log('🔄 SaaSLandingPage: Company user detected, setting dashboard path to company landing page:', currentCompanySlug);
            setDashboardPath(`/company/${currentCompanySlug}`);
          } else {
            setDashboardPath('/');
          }
        }
      }
    } else {
      console.log('🔄 SaaSLandingPage: No persistent session found');
      setIsLoggedIn(false);
    }
  }, [hasPersistentSession, getUserType]);

  const handleGetStarted = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to company registration with email prefilled
      navigate(`/company/register?email=${encodeURIComponent(email)}`);
    }, 1000);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleAdminLogin = () => {
    // Regular admin login - handles all admin types and redirects appropriately
    navigate('/admin/login');
    setShowLoginModal(false);
  };

  const closeModal = () => {
    setShowLoginModal(false);
  };

  const handleCompanyAdminLogin = () => {
    // Company admin login - use SaaS admin login which supports company admins
    navigate('/admin/saas-login');
    setShowLoginModal(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const features = [
    {
      icon: '🎯',
      title: 'Smart Rebuttal System',
      description: 'AI-powered rebuttal suggestions that help your team handle objections effectively and close more deals.'
    },
    {
      icon: '📊',
      title: 'Advanced Analytics',
      description: 'Track performance, conversion rates, and objection handling to continuously improve your sales outcomes.'
    },
    {
      icon: '🤝',
      title: 'Team Collaboration',
      description: 'Share best responses across your team and maintain consistent messaging with shared rebuttal libraries.'
    },
    {
      icon: '⚙️',
      title: 'Easy Integration',
      description: 'Works with your existing tools and processes with minimal setup.'
    }
  ];

  const testimonials = [
    {
      name: 'Alex Johnson',
      role: 'Sales Director',
      company: 'GrowthLabs',
      content: 'This platform transformed our team\'s objection handling. Our close rates improved within weeks.',
      avatar: '🧑‍💼'
    },
    {
      name: 'Maria Garcia',
      role: 'Head of Sales Enablement',
      company: 'RevBoost',
      content: 'The structured rebuttal library and analytics helped us standardize our approach and train faster.',
      avatar: '👩‍💼'
    },
    {
      name: 'Sam Patel',
      role: 'VP of Operations',
      company: 'ScaleUp Inc',
      content: 'The analytics and insights helped us optimize our entire customer journey. Highly recommended!',
      avatar: '👩‍💼'
    }
  ];

  return (
    <div className="saas-landing-page">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="brand">
              <span className="brand-icon">⚡</span>
              <span className="brand-name">PitchPerfect</span>
            </div>
            <div className="mobile-header-wrapper">
              <h1 className="mobile-header-title">PitchPerfect</h1>
              {/* Mobile Menu Toggle */}
              <button 
                className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>

          <nav className="header-nav">
            <a href="#features" className="nav-item nav-feature">Features</a>
            <a href="#pricing" className="nav-item nav-pricing">Pricing</a>
            <a href="#testimonials" className="nav-item nav-testimonials">Testimonials</a>
          </nav>

          <div className="header-actions">
            {isLoggedIn ? (
              <button className="btn btn-primary" onClick={() => navigate(dashboardPath)}>
                Dashboard
              </button>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={handleLoginClick}>
                  Sign In
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/company/register')}>
                  Register Company
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={closeMobileMenu}
        ></div>
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content">
            <div className="mobile-menu-header">
              <h2 className="mobile-menu-title">Menu</h2>
              <button className="mobile-menu-close" onClick={closeMobileMenu} aria-label="Close menu">
                ✕
              </button>
            </div>
            <nav className="mobile-nav">
              <a href="#features" className="mobile-nav-item" onClick={closeMobileMenu}>Features</a>
              <a href="#pricing" className="mobile-nav-item" onClick={closeMobileMenu}>Pricing</a>
              <a href="#testimonials" className="mobile-nav-item" onClick={closeMobileMenu}>Testimonials</a>
            </nav>
            <div className="mobile-menu-actions">
              {isLoggedIn ? (
                <button className="btn btn-primary mobile-btn" onClick={() => { navigate(dashboardPath); closeMobileMenu(); }}>
                  Dashboard
                </button>
              ) : (
                <>
                  <button className="btn btn-ghost mobile-btn" onClick={() => { handleLoginClick(); closeMobileMenu(); }}>
                    Sign In
                  </button>
                  <button className="btn btn-primary mobile-btn" onClick={() => { navigate('/company/register'); closeMobileMenu(); }}>
                    Register Company
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-title-wrapper">
              <h1 className="hero-title">Rebuttal — Sales Training</h1>
            </div>

            <div className="hero-description-wrapper">
              <p className="hero-description">Reusable rebuttals, training modules and analytics to help teams close more deals.</p>
            </div>

            <div className="hero-cta">
              <form onSubmit={handleGetStarted} className="email-form">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Getting Started...' : 'Start Free Trial'}
                </button>
              </form>
              <p className="cta-note">No credit card required • 14-day free trial</p>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Companies</span>
              </div>
              <div className="stat">
                <span className="stat-number">40%</span>
                <span className="stat-label">Avg. Close Rate Increase</span>
              </div>
              <div className="stat">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Uptime</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="mini-dashboard">
              <div className="mini-header">
                <span className="mini-title">Dashboard</span>
                <div className="mini-icons">
                  <span>⚙️</span>
                  <span>👤</span>
                </div>
                <div className="mini-status">
                  <span className="live">Live</span>
                  <span className="sync">Sync On</span>
                </div>
              </div>
              
              <div className="mini-nav">
                <span className="nav active">📊 Overview</span>
                <span className="nav">🎯 Rebuttals</span>
                <span className="nav">📈 Analytics</span>
                <span className="nav">💬 Support</span>
              </div>

              <div className="mini-content">
                <div className="mini-title-bar">
                  <span>Weekly Overview</span>
                  <span className="date">Aug 1-7</span>
                </div>
                
                <div className="mini-stats">
                  <div className="mini-stat">
                    <span className="icon">📈</span>
                    <span className="value">1,284</span>
                    <span className="label">Leads</span>
                    <span className="trend">+12%</span>
                  </div>
                  <div className="mini-stat">
                    <span className="icon">🤝</span>
                    <span className="value">431</span>
                    <span className="label">Meetings</span>
                    <span className="trend">+9%</span>
                  </div>
                </div>

                <div className="mini-chart">
                  <div className="chart-title">Performance</div>
                  <div className="mini-bars">
                    <div className="bar" style={{ height: '60%' }}></div>
                    <div className="bar" style={{ height: '75%' }}></div>
                    <div className="bar" style={{ height: '50%' }}></div>
                  </div>
                </div>

                <div className="mini-footer">
                  <span>🧑‍💼👩‍💻🧑‍🔧</span>
                  <span>Synced 2m ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features-section">
        <div className="features-container">
          <div className="features-header">
            <h2 className="section-title">Powerful Features</h2>
            <p className="section-subtitle">Everything you need to empower your sales team and close more deals</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index}>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing-section">
        <div className="pricing-container">
          <div className="pricing-header">
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-subtitle">Choose a plan that fits your team's needs</p>
          </div>
          <div className="pricing-grid">
            {/* Starter Plan */}
            <div className="pricing-card">
              <div className="plan-header">
                <div className="plan-name">Starter</div>
                <div className="plan-price">
                  <span className="price">$199</span>
                  <span className="period">/mo</span>
                </div>
                <div className="plan-description">Perfect for small teams getting started</div>
              </div>
              <ul className="plan-features">
                <li className="feature-item"><span className="check-icon">✓</span> Up to 10 users</li>
                <li className="feature-item"><span className="check-icon">✓</span> Basic training modules</li>
                <li className="feature-item"><span className="check-icon">✓</span> Email support</li>
                <li className="feature-item"><span className="check-icon">✓</span> Basic analytics</li>
              </ul>
              <button className="plan-button" onClick={() => navigate('/company/register?plan=starter')}>
                Register Company
              </button>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card popular">
              <div className="popular-badge">Most Popular</div>
              <div className="plan-header">
                <div className="plan-name">Professional</div>
                <div className="plan-price">
                  <span className="price">$499</span>
                  <span className="period">/mo</span>
                </div>
                <div className="plan-description">Best for growing teams that need advanced features</div>
              </div>
              <ul className="plan-features">
                <li className="feature-item"><span className="check-icon">✓</span> Up to 50 users</li>
                <li className="feature-item"><span className="check-icon">✓</span> Advanced training modules</li>
                <li className="feature-item"><span className="check-icon">✓</span> Priority support</li>
                <li className="feature-item"><span className="check-icon">✓</span> Custom branding</li>
                <li className="feature-item"><span className="check-icon">✓</span> Advanced analytics</li>
              </ul>
              <button className="plan-button" onClick={() => navigate('/company/register?plan=pro')}>
                Register Company
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="pricing-card">
              <div className="plan-header">
                <div className="plan-name">Enterprise</div>
                <div className="plan-price">
                  <span className="price">$1,299</span>
                  <span className="period">/mo</span>
                </div>
                <div className="plan-description">For larger orgs with advanced requirements</div>
              </div>
              <ul className="plan-features">
                <li className="feature-item"><span className="check-icon">✓</span> Up to 200 users</li>
                <li className="feature-item"><span className="check-icon">✓</span> All training modules</li>
                <li className="feature-item"><span className="check-icon">✓</span> 24/7 support</li>
                <li className="feature-item"><span className="check-icon">✓</span> White-label solution</li>
                <li className="feature-item"><span className="check-icon">✓</span> API access</li>
                <li className="feature-item"><span className="check-icon">✓</span> Dedicated success manager</li>
              </ul>
              <button className="plan-button" onClick={() => window.location.href = 'mailto:sales@longhome.com?subject=Enterprise%20Plan%20Inquiry'}>
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials-section">
        <div className="testimonials-container">
          <div className="testimonials-header">
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">Trusted by teams across industries</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div className="testimonial-card" key={i}>
                <div className="testimonial-rating">
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                </div>
                <div className="testimonial-content">
                  <p className="testimonial-text">"{t.content}"</p>
                </div>
                <div className="testimonial-footer">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div className="testimonial-author">
                    <span className="author-name">{t.name}</span>
                    <span className="author-meta">{t.role} • {t.company}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section footer-brand">
              <div className="footer-logo">
                <span className="logo-icon">🚀</span>
              </div>
              <p className="footer-description">
                The complete SaaS platform for modern sales teams
              </p>
              <div className="footer-social">
                <a href="#" className="social-link" aria-label="Twitter">
                  <span>🐦</span>
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <span>💼</span>
                </a>
                <a href="#" className="social-link" aria-label="GitHub">
                  <span>💻</span>
                </a>
              </div>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Product</h4>
              <ul className="footer-links">
                <li><a href="#features"><span className="link-icon">✨</span> Features</a></li>
                <li><a href="#pricing"><span className="link-icon">💰</span> Pricing</a></li>
                <li><a href="#"><span className="link-icon">🔗</span> Integrations</a></li>
                <li><a href="#"><span className="link-icon">📊</span> Analytics</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Company</h4>
              <ul className="footer-links">
                <li><a href="#"><span className="link-icon">ℹ️</span> About</a></li>
                <li><a href="#"><span className="link-icon">📝</span> Blog</a></li>
                <li><a href="#"><span className="link-icon">💼</span> Careers</a></li>
                <li><a href="#"><span className="link-icon">📧</span> Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Support</h4>
              <ul className="footer-links">
                <li><a href="#"><span className="link-icon">❓</span> Help Center</a></li>
                <li><a href="#"><span className="link-icon">📚</span> Documentation</a></li>
                <li><a href="#"><span className="link-icon">🔒</span> Privacy</a></li>
                <li><a href="#"><span className="link-icon">📄</span> Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-divider"></div>
            <p className="footer-copyright">
              © 2024. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Enhanced Login Modal */}
      {showLoginModal && (
        <div className="enhanced-login-modal-overlay" onClick={closeModal}>
          <div className="enhanced-login-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="enhanced-modal-header">
              <div className="header-content">
                <div className="header-icon">🔐</div>
                <div className="header-text">
                  <h2>Choose Your Access Level</h2>
                  <p>Select the appropriate login type for your role</p>
                </div>
              </div>
              <button className="enhanced-modal-close" onClick={closeModal}>
                <span>✕</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="enhanced-modal-content">
              <div className="login-options-grid">
                <div className="enhanced-login-option admin" onClick={handleAdminLogin}>
                  <div className="option-background"></div>
                  <div className="option-content">
                    <div className="option-header">
                      <div className="option-icon">👨‍💼</div>
                      <div className="option-badge admin-badge">Admin</div>
                    </div>
                    <div className="option-body">
                      <h3>Regular Admin</h3>
                      <p>Access your company's admin dashboard and manage your team's training materials, rebuttals, and user settings. Handles all admin types automatically.</p>
                    </div>
                    <div className="option-footer">
                      <span className="option-arrow">→</span>
                    </div>
                  </div>
                </div>

                <div className="enhanced-login-option company" onClick={handleCompanyAdminLogin}>
                  <div className="option-background"></div>
                  <div className="option-content">
                    <div className="option-header">
                      <div className="option-icon">🏢</div>
                      <div className="option-badge company-badge">Company</div>
                    </div>
                    <div className="option-body">
                      <h3>Company Admin</h3>
                      <p>Manage your entire company's settings, users, training platform, and oversee all administrative functions. For company admins and super admins.</p>
                    </div>
                    <div className="option-footer">
                      <span className="option-arrow">→</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <div className="help-text">
                  <span className="help-icon">💡</span>
                  <span>Not sure which option to choose? Contact your system administrator for guidance.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaaSLandingPage;