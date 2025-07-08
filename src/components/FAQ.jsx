import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import faqService from '../services/faqService';
import '../styles/FAQ.css';

const FAQ = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [activeIndex, setActiveIndex] = useState(null);
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadFAQs();
    checkAdminStatus();
  }, [currentUser]);

  const checkAdminStatus = () => {
    // Check if user is logged in as admin (stored in localStorage)
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      try {
        const adminData = JSON.parse(adminUser);
        setIsAdmin(adminData.role === 'admin');
      } catch (error) {
        console.error('Error parsing admin user data:', error);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  };

  const loadFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedFAQs = await faqService.getAllFAQs();
      setFaqData(fetchedFAQs);
    } catch (err) {
      console.error('Error loading FAQs:', err);
      setError('Failed to load FAQs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleDashboardClick = () => {
    if (isAdmin) {
      // Navigate to admin dashboard
      onNavigate('admin/dashboard');
    } else {
      // Navigate to admin login
      onNavigate('admin/login');
    }
  };

  if (loading) {
    return (
      <div className="faq-container">
        <div className="faq-loading">
          <div className="loading-spinner"></div>
          <p>Loading FAQs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="faq-container">
        <div className="faq-error">
          <span className="error-icon">⚠️</span>
          <h3>Error Loading FAQs</h3>
          <p>{error}</p>
          <button onClick={loadFAQs} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="faq-container">
      {currentUser && isAdmin && (
        <button
          onClick={handleDashboardClick}
          className="dashboard-button-top-left"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3H10V10H3V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 3H21V10H14V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 14H21V21H14V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 14H10V21H3V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Admin Dashboard
        </button>
      )}
      <div className="faq-header">
        <h1 className="faq-title">Frequently Asked Questions</h1>
        <p className="faq-subtitle">FAQ for Reps</p>
        
        <div className="header-navigation">
          <div className="quick-nav">
            <button
              onClick={() => onNavigate('home')}
              className="nav-button home-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Home
            </button>
            <button
              onClick={() => onNavigate('rebuttals')}
              className="nav-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 9H17M7 13H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Rebuttals
            </button>
            <button
              onClick={() => onNavigate('disposition')}
              className="nav-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 3H15V5H9V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Lead Disposition
            </button>
            <button
              onClick={() => onNavigate('customerService')}
              className="nav-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01M16 18H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Customer Service
            </button>
          </div>
        </div>
      </div>

      <div className="faq-content">
        <div className="faq-grid">
          {faqData.length > 0 ? (
            faqData.map((item, index) => (
              <div key={index} className={`faq-card-public${activeIndex === index ? ' expanded' : ''}`}>
                <button
                  className={`faq-question-public ${activeIndex === index ? 'active' : ''}`}
                  onClick={() => toggleAccordion(index)}
                  aria-expanded={activeIndex === index}
                >
                  <span className="faq-q-icon">❓</span>
                  <span className="question-text">{item.question}</span>
                  <span className="expand-icon">
                    {activeIndex === index ? '−' : '+'}
                  </span>
                </button>
                <div className="faq-divider-public" />
                <div className={`faq-answer-public ${activeIndex === index ? 'active' : ''}`}>
                  <p>{item.answer}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-faq">
              <div className="empty-faq-content">
                <h3>No FAQ content available</h3>
                <p>FAQ content will be added here. Please check back later or contact support for assistance.</p>
              </div>
            </div>
          )}
        </div>

        <div className="faq-footer">
          <div className="contact-section">
            <h3>Still have questions?</h3>
            <p>If you couldn't find the answer you're looking for, please contact your system administrator or IT support team for assistance.</p>
            <button
              onClick={() => onNavigate('customerService')}
              className="contact-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Get Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ; 