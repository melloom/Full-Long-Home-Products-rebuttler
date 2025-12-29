import React from 'react';
import './CompanyLanding.css';

const CompanyLanding = ({ company, onLogin, onStartTraining }) => {
  return (
    <div className="company-landing">
      {/* Header */}
      <header className="company-header">
        <div className="header-container">
          <div className="company-logo">
            <div className="logo-icon">🏢</div>
            <div className="logo-text">
              <h1>{company.name}</h1>
              <span className="tagline">Training Platform</span>
            </div>
          </div>
          <nav className="header-nav">
            <button className="nav-btn" onClick={onLogin}>
              Login
            </button>
            <button className="nav-btn primary" onClick={onStartTraining}>
              Start Training
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h2 className="hero-title">
              Welcome to {company.name}'s
              <span className="gradient-text"> Training Platform</span>
            </h2>
            <p className="hero-description">
              Access your personalized training materials, rebuttals, and resources 
              designed specifically for {company.name} team members.
            </p>
            <div className="hero-actions">
              <button className="cta-primary" onClick={onStartTraining}>
                Start Training Now
              </button>
              <button className="cta-secondary" onClick={onLogin}>
                Login to Continue
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="training-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="preview-title">{company.name} Training</div>
              </div>
              <div className="preview-content">
                <div className="preview-sidebar">
                  <div className="sidebar-item active">📚 Training</div>
                  <div className="sidebar-item">🎯 Rebuttals</div>
                  <div className="sidebar-item">📊 Progress</div>
                  <div className="sidebar-item">❓ FAQ</div>
                </div>
                <div className="preview-main">
                  <div className="preview-cards">
                    <div className="preview-card">
                      <div className="card-icon">📈</div>
                      <div className="card-content">
                        <div className="card-title">Your Progress</div>
                        <div className="card-value">85%</div>
                      </div>
                    </div>
                    <div className="preview-card">
                      <div className="card-icon">🎯</div>
                      <div className="card-content">
                        <div className="card-title">Rebuttals</div>
                        <div className="card-value">24</div>
                      </div>
                    </div>
                  </div>
                  <div className="preview-chart">
                    <div className="chart-bars">
                      <div className="bar" style={{height: '60%'}}></div>
                      <div className="bar" style={{height: '80%'}}></div>
                      <div className="bar" style={{height: '45%'}}></div>
                      <div className="bar" style={{height: '90%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">What You'll Learn</h2>
            <p className="section-description">
              Comprehensive training designed for {company.name} team members
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Smart Rebuttals</h3>
              <p className="feature-description">
                Learn effective responses to common objections and customer concerns.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Lead Management</h3>
              <p className="feature-description">
                Master lead disposition tracking and follow-up strategies.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3 className="feature-title">Customer Service</h3>
              <p className="feature-description">
                Develop excellent customer service skills and problem-solving techniques.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">❓</div>
              <h3 className="feature-title">FAQ Knowledge</h3>
              <p className="feature-description">
                Access comprehensive answers to frequently asked questions.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3 className="feature-title">Scheduling</h3>
              <p className="feature-description">
                Learn efficient scheduling and appointment management techniques.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3 className="feature-title">Analytics</h3>
              <p className="feature-description">
                Track your progress and performance with detailed analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Start Your Training?</h2>
          <p className="cta-description">
            Join your {company.name} teammates and start improving your skills today.
          </p>
          <div className="cta-buttons">
            <button className="cta-primary" onClick={onStartTraining}>
              Start Training Now
            </button>
            <button className="cta-secondary" onClick={onLogin}>
              Login to Continue
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="company-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section footer-brand">
              <div className="footer-logo">
                <span className="logo-icon">🏢</span>
                <span className="logo-text">{company.name}</span>
              </div>
              <p className="footer-description">
                Professional training platform for {company.name} team members
              </p>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Training</h4>
              <ul className="footer-links">
                <li><a href="#features"><span className="link-icon">✨</span> Features</a></li>
                <li><a href="#training"><span className="link-icon">📚</span> Training Modules</a></li>
                <li><a href="#rebuttals"><span className="link-icon">💬</span> Rebuttals</a></li>
                <li><a href="#support"><span className="link-icon">🆘</span> Support</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Resources</h4>
              <ul className="footer-links">
                <li><a href="#help"><span className="link-icon">❓</span> Help Center</a></li>
                <li><a href="#contact"><span className="link-icon">📧</span> Contact</a></li>
                <li><a href="#privacy"><span className="link-icon">🔒</span> Privacy</a></li>
                <li><a href="#terms"><span className="link-icon">📄</span> Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-divider"></div>
            <p className="footer-copyright">
              © 2024 {company.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CompanyLanding;