import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getDb } from '../../services/firebase/config';
import CompanyLanding from './CompanyLanding';
import CompanyTraining from './CompanyTraining';
import CompanyLogin from './CompanyLogin';
import CompanyStatusCheck from './CompanyStatusCheck';
import './CompanyPlatform.css';

const CompanyPlatform = () => {
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // If this is Long Home, redirect straight to /app (we no longer serve the legacy company landing page)
    if (companySlug === 'long-home') {
      try {
        localStorage.setItem('currentCompanySlug', companySlug);
      } catch (e) {
        // ignore storage errors
      }
      navigate('/app', { replace: true });
      return; // skip loading company document
    }

    const loadCompany = async () => {
      try {
        console.log('🔍 Loading company for slug:', companySlug);
        const db = getDb();

        // Persist current company slug for cross-page Home routing
        if (companySlug) {
          localStorage.setItem('currentCompanySlug', companySlug);
        }

        // Try to find company by slug (modular API)
        const q = query(collection(db, 'companies'), where('slug', '==', companySlug));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const companyDoc = snapshot.docs[0];
          const companyData = { id: companyDoc.id, ...companyDoc.data() };
          setCompany(companyData);
          console.log('✅ Company found:', companyData);
        } else {
          // Try by ID (backward compatibility)
          const companyRef = doc(db, 'companies', companySlug);
          const companyDoc = await getDoc(companyRef);
          if (companyDoc.exists()) {
            const companyData = { id: companyDoc.id, ...companyDoc.data() };
            setCompany(companyData);
            console.log('✅ Company found by ID:', companyData);
          } else {
            // Graceful fallback
            const fallback = {
              id: companySlug,
              name: companySlug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            };
            console.warn('⚠️ Company not found in Firestore. Using fallback:', fallback);
            setCompany(fallback);
          }
        }
      } catch (err) {
        console.error('❌ Error loading company:', err);
        const fallback = {
          id: companySlug,
          name: companySlug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        };
        setCompany(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [companySlug]);

  // Check if user is authenticated for this company
  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('companyUser');
      if (user) {
        const userData = JSON.parse(user);
        if (userData.companyId === company?.id) {
          setIsAuthenticated(true);
        }
      }
    };

    if (company) {
      checkAuth();
    }
  }, [company]);

  const handleLogin = (userData) => {
    localStorage.setItem('companyUser', JSON.stringify({
      ...userData,
      companyId: company.id
    }));
    // Save the current company slug for persistent routing
    localStorage.setItem('currentCompanySlug', companySlug);
    setIsAuthenticated(true);
    setCurrentPage('training');
  };

  const handleLogout = () => {
    localStorage.removeItem('companyUser');
    localStorage.removeItem('currentCompanySlug');
    setIsAuthenticated(false);
    setCurrentPage('landing');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="company-platform loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading {companySlug}...</p>
          </div>
        </div>
      );
    }

    if (error || !company) {
      return (
        <div className="company-platform error">
          <div className="error-content">
            <h1>Company Not Found</h1>
            <p>The company "{companySlug}" could not be found.</p>
            <button onClick={() => navigate('/rebuttals')}>Go to Rebuttals</button>
          </div>
        </div>
      );
    }

    // Wrap all content with CompanyStatusCheck to enforce status
    return (
      <CompanyStatusCheck company={company}>
        {(() => {
          switch (currentPage) {
            case 'login':
              return (
                <CompanyLogin 
                  company={company}
                  onLogin={handleLogin}
                  onBack={() => setCurrentPage('landing')}
                />
              );
            case 'training':
              return (
                <CompanyTraining 
                  company={company}
                  onLogout={handleLogout}
                />
              );
            default:
              return (
                <CompanyLanding 
                  company={company}
                  onLogin={() => setCurrentPage('login')}
                  onStartTraining={() => {
                    if (isAuthenticated) {
                      setCurrentPage('training');
                    } else {
                      setCurrentPage('login');
                    }
                  }}
                />
              );
          }
        })()}
      </CompanyStatusCheck>
    );
  };

  return (
    <div className="company-platform">
      {renderContent()}
    </div>
  );
};

export default CompanyPlatform;