import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Home, Bath, Shield, AlertTriangle, Plus, Save, Upload, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import faqService from '../../services/faqService';
import './FAQ.css';

const FAQ = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [activeIndex, setActiveIndex] = useState(null);
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showReferenceGuide, setShowReferenceGuide] = useState(false);
  const [uploadingToFirebase, setUploadingToFirebase] = useState(false);

  // Long Home Reference Guide Data
  const referenceGuideData = {
    title: "Long Home Reference Guide",
    lastUpdated: new Date().toLocaleDateString(),
    sections: {
      roof: {
        title: "Roof Services",
        icon: <Home className="section-icon" />,
        canDo: {
          title: "Can Do",
          items: [
            "Total replacement of roof:",
            "• Asphalt Shingle roof",
            "• Metal Roof", 
            "• Flat roof",
            "• (Synthetic) Cedar Shake",
            "• (Synthetic) Slate",
            "• Modular home same as Single Family",
            "• Mobile home (Asphalt shingle Only)",
            "• 2 car lengths wide garage (Must be detached from home)",
            "• Barns (Asphalt shingle. Must be on Plywood)"
          ]
        },
        cantDo: {
          title: "Can't Do",
          items: [
            "Cedar Shake",
            "Slate",
            "Partial Replacement",
            "Roof Repairs",
            "Structural work/Framing",
            "Shed",
            "Single car garage",
            "Mobile home (Metal, flat roof, etc.)",
            "Roof that covers multiple properties (Example: Condos, Apartments, etc.)",
            "Insurance (No open claims)",
            "Commercial Properties",
            "Shingle Lay over"
          ]
        }
      },
      bath: {
        title: "Bath Services",
        icon: <Bath className="section-icon" />,
        canDo: {
          title: "Can Do",
          items: [
            "Must have existing Tub/Shower (Wet Area)",
            "• Tub/shower replacement",
            "• Tub to Shower Conversion", 
            "• Walk in Tubs (Excludes NH, RI)",
            "• Modular home same as Single Family",
            "• Mobile home (No walk in Tub)",
            "• Full bathroom extras (Wet area must be included)",
            "  - Toilet",
            "  - Vanity",
            "  - Flooring (Vinyl tile)",
            "  - Mirror"
          ]
        },
        cantDo: {
          title: "Can't Do",
          items: [
            "Half Bathrooms",
            "Partial Replacement, Repairs, Liners",
            "Plumbing/Demolition",
            "Lighting",
            "Ceramic Tile",
            "Mobile home (Walk in tubs)",
            "Insurance (No open claims)",
            "Commercial Properties",
            "Free standing/Claw Tub"
          ]
        }
      }
    }
  };

  useEffect(() => {
    loadFAQs();
    checkAdminStatus();
  }, [currentUser]);

  const checkAdminStatus = () => {
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

  // Optimized toggle function with useCallback
  const toggleAccordion = useCallback((index) => {
    setActiveIndex(prevIndex => prevIndex === index ? null : index);
  }, []);

  const handleDashboardClick = () => {
    if (isAdmin) {
      onNavigate('admin/dashboard');
    } else {
      onNavigate('admin/login');
    }
  };

  const downloadReferenceGuide = () => {
    try {
      // Create a link element
      const link = document.createElement('a');
      link.href = '/Can-Can\'t do.pdf';
      link.download = 'Long-Home-Can-Cant-Do-Reference-Guide.pdf';
      link.target = '_blank';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Try alternative method
      try {
        window.open('/Can-Can\'t do.pdf', '_blank');
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        alert('Failed to download the reference guide. Please try again.');
      }
    }
  };

  const downloadSchedulingScript = () => {
    try {
      // Create a link element
      const link = document.createElement('a');
      link.href = '/Scheduling Script Update 2025 - Jill Approved.docx';
      link.download = 'Long-Home-Scheduling-Script-2025.docx';
      link.target = '_blank';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Try alternative method
      try {
        window.open('/Scheduling Script Update 2025 - Jill Approved.docx', '_blank');
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        alert('Failed to download the scheduling script. Please try again.');
      }
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
      {/* Removed admin dashboard button */}
      
      <div className="faq-header">
        <motion.h1 
          className="faq-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Frequently Asked Questions
        </motion.h1>
        <motion.p 
          className="faq-subtitle"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          FAQ for Reps
        </motion.p>
        
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
            <button
              onClick={() => onNavigate('scheduleScript')}
              className="nav-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Schedule Script
            </button>
          </div>
        </div>
      </div>

      <div className="faq-content">
        {/* Reference Guide Section */}
        <motion.div 
          className="reference-guide-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="reference-guide-header">
            <div className="reference-guide-title">
              <Shield className="reference-guide-icon" />
              <div>
                <h2>{referenceGuideData.title}</h2>
                <p className="last-updated">Last Updated: {referenceGuideData.lastUpdated}</p>
              </div>
            </div>
            
            <div className="reference-guide-actions">
              <motion.button
                className="download-reference-button"
                onClick={downloadReferenceGuide}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Download className="button-icon" />
                Download
              </motion.button>
              
              <motion.button
                className="download-script-button"
                onClick={downloadSchedulingScript}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Download className="button-icon" />
                Download Script
              </motion.button>
            </div>
          </div>

          <div className="reference-guide-content">
            {Object.entries(referenceGuideData.sections).map(([key, section]) => (
              <motion.div
                key={key}
                className="reference-section"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="section-header">
                  {section.icon}
                  <h3>{section.title}</h3>
                </div>
                <div className="section-cards-flex">
                  {/* Can Do Card */}
                  <div className="can-do-card">
                    <div className="section-subheader">
                      <CheckCircle className="check-icon" />
                      <h4>{section.canDo.title}</h4>
                    </div>
                    {/* Main item and sub-items logic */}
                    {section.canDo.items.map((item, idx) => {
                      if (!item.startsWith('•')) {
                        // Find sub-items for this main item
                        const subItems = [];
                        for (let i = idx + 1; i < section.canDo.items.length; i++) {
                          if (section.canDo.items[i].startsWith('•')) {
                            subItems.push(section.canDo.items[i]);
                          } else {
                            break;
                          }
                        }
                        return (
                          <div key={idx} className="main-with-subs">
                            <div className="main-item">{item}</div>
                            {subItems.length > 0 && (
                              <ul className="service-list sub-items">
                                {subItems.map((sub, subIdx) => (
                                  <li key={subIdx} className="sub-item">{sub}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                  {/* Can't Do Card */}
                  <div className="cant-do-card">
                    <div className="section-subheader">
                      <XCircle className="x-icon" />
                      <h4>{section.cantDo.title}</h4>
                    </div>
                    <ul className="service-list cant-do-list">
                      {section.cantDo.items.map((item, index) => (
                        <li key={index} className="sub-item">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Existing FAQ Section */}
        <motion.div 
          className="faq-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="faq-section-title">General FAQs</h2>
          <div className="faq-grid">
            {faqData.length > 0 ? (
              faqData.map((item, index) => (
                <motion.div 
                  key={index} 
                  className={`faq-card-public${activeIndex === index ? ' expanded' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                >
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
                  <AnimatePresence mode="wait">
                    {activeIndex === index && (
                      <motion.div 
                        className="faq-answer-public active"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <p>{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
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
        </motion.div>

        <div className="faq-footer">
          <div className="contact-section">
            <h3>Still have questions?</h3>
            <p>Contact our support team for additional assistance.</p>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-label">Email:</span>
                <span className="contact-value">contactsupervisors@longhome.com</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Phone:</span>
                <span className="contact-value">1-800-LONG-HOME</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ; 