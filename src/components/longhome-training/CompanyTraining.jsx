import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getDb } from '../../services/firebase/config';
import './CompanyTraining.css';

const CompanyTraining = ({ company, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rebuttals, setRebuttals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUserData = () => {
      const userData = localStorage.getItem('companyUser');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };

    const loadCompanyData = async () => {
      try {
        const db = getDb();
        
        // Load rebuttals for this company
        const rebuttalsQuery = query(
          collection(db, 'rebuttals'),
          where('companyId', '==', company.id),
          orderBy('createdAt', 'desc')
        );
        const rebuttalsSnapshot = await getDocs(rebuttalsQuery);
        const rebuttalsData = rebuttalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRebuttals(rebuttalsData);

        // Load categories for this company
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('companyId', '==', company.id),
          orderBy('createdAt', 'desc')
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);

        // Load FAQs for this company
        const faqsQuery = query(
          collection(db, 'faqs'),
          where('companyId', '==', company.id),
          orderBy('createdAt', 'desc')
        );
        const faqsSnapshot = await getDocs(faqsQuery);
        const faqsData = faqsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFaqs(faqsData);

      } catch (error) {
        console.error('Error loading company data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    loadCompanyData();
  }, [company.id]);

  const handleLogout = () => {
    onLogout();
    navigate(`/company/${company.slug || company.id}`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'rebuttals':
        return (
          <div className="training-content">
            <div className="content-header">
              <h2>Rebuttals</h2>
              <p>Learn effective responses to common objections</p>
            </div>
            <div className="rebuttals-grid">
              {rebuttals.map((rebuttal) => (
                <div key={rebuttal.id} className="rebuttal-card">
                  <div className="rebuttal-header">
                    <h3>{rebuttal.summary}</h3>
                    <span className="category-badge">{rebuttal.category}</span>
                  </div>
                  <div className="rebuttal-content">
                    <p>{rebuttal.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="training-content">
            <div className="content-header">
              <h2>Frequently Asked Questions</h2>
              <p>Find answers to common questions</p>
            </div>
            <div className="faq-list">
              {faqs.map((faq) => (
                <div key={faq.id} className="faq-item">
                  <h3 className="faq-question">{faq.question}</h3>
                  <p className="faq-answer">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="training-content">
            <div className="content-header">
              <h2>Your Progress</h2>
              <p>Track your training progress and achievements</p>
            </div>
            <div className="progress-cards">
              <div className="progress-card">
                <div className="progress-icon">📚</div>
                <div className="progress-content">
                  <h3>Training Modules</h3>
                  <div className="progress-value">8/10</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '80%'}}></div>
                  </div>
                </div>
              </div>
              <div className="progress-card">
                <div className="progress-icon">🎯</div>
                <div className="progress-content">
                  <h3>Rebuttals Mastered</h3>
                  <div className="progress-value">24/30</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '80%'}}></div>
                  </div>
                </div>
              </div>
              <div className="progress-card">
                <div className="progress-icon">⭐</div>
                <div className="progress-content">
                  <h3>Overall Score</h3>
                  <div className="progress-value">85%</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '85%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="training-content">
            <div className="content-header">
              <h2>Welcome to {company.name} Training</h2>
              <p>Your personalized learning dashboard</p>
            </div>
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-icon">🎯</div>
                <div className="card-content">
                  <h3>Rebuttals</h3>
                  <p>{rebuttals.length} available</p>
                  <button onClick={() => setActiveTab('rebuttals')}>
                    View Rebuttals
                  </button>
                </div>
              </div>
              <div className="dashboard-card">
                <div className="card-icon">❓</div>
                <div className="card-content">
                  <h3>FAQ</h3>
                  <p>{faqs.length} questions</p>
                  <button onClick={() => setActiveTab('faq')}>
                    View FAQ
                  </button>
                </div>
              </div>
              <div className="dashboard-card">
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <h3>Progress</h3>
                  <p>Track your learning</p>
                  <button onClick={() => setActiveTab('progress')}>
                    View Progress
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="company-training loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="company-training">
      {/* Header */}
      <header className="training-header">
        <div className="header-container">
          <div className="company-info">
            <div className="company-logo">
              <span className="logo-icon">🏢</span>
              <span className="company-name">{company.name}</span>
            </div>
            <span className="training-badge">Training Platform</span>
          </div>
          <div className="user-info">
            <span className="welcome-text">Welcome, {user?.name || user?.email}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="training-layout">
        {/* Sidebar */}
        <nav className="training-sidebar">
          <div className="sidebar-nav">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'rebuttals' ? 'active' : ''}`}
              onClick={() => setActiveTab('rebuttals')}
            >
              <span className="nav-icon">🎯</span>
              <span className="nav-text">Rebuttals</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              <span className="nav-icon">❓</span>
              <span className="nav-text">FAQ</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'progress' ? 'active' : ''}`}
              onClick={() => setActiveTab('progress')}
            >
              <span className="nav-icon">📈</span>
              <span className="nav-text">Progress</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="training-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CompanyTraining;