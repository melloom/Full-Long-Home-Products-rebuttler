import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import RebuttalManagement from './RebuttalManagement';
import CategoryManagement from './CategoryManagement';
import LeadDispositionManagement from './LeadDispositionManagement';
import CustomerServiceManagement from './CustomerServiceManagement';
import FAQManagement from './FAQManagement';
import UserManagement from './UserManagement';
import DashboardView from './DashboardView';
import TimeBlockManagement from './TimeBlockManagement';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser, authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 AdminDashboard: Starting auth check...');
        console.log('🔍 AdminDashboard: Current user:', currentUser);
        console.log('🔍 AdminDashboard: Auth loading:', authLoading);

        if (authLoading) {
          console.log('🔍 AdminDashboard: Auth is still loading...');
          return;
        }

        if (!currentUser) {
          console.log('🔍 AdminDashboard: No current user, redirecting to login');
          navigate('/admin/login');
          return;
        }

        // Check if user is admin
        const adminUser = localStorage.getItem('adminUser');
        if (adminUser) {
          const parsedAdmin = JSON.parse(adminUser);
          console.log('🔍 AdminDashboard: Found admin user in localStorage:', parsedAdmin);
          setAdminUser(parsedAdmin);
          setLoading(false);
        } else {
          console.log('🔍 AdminDashboard: No admin user in localStorage, checking Firestore...');
          // Check if user exists in admins collection
          const adminRef = doc(getFirestore(), 'admins', currentUser.uid);
          const adminDoc = await getDoc(adminRef);
          
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            console.log('🔍 AdminDashboard: Found admin in Firestore:', adminData);
            setAdminUser({ ...currentUser, ...adminData });
            localStorage.setItem('adminUser', JSON.stringify({ ...currentUser, ...adminData }));
            setLoading(false);
          } else {
            console.log('🔍 AdminDashboard: User is not admin, redirecting to login');
            navigate('/admin/login');
            return;
          }
        }

        console.log('🔍 AdminDashboard: Auth check completed successfully');
      } catch (error) {
        console.error('🔍 AdminDashboard: Auth check error:', error);
        setError('Authentication error: ' + error.message);
        setLoading(false);
      }
    };

    checkAuth();
  }, [currentUser, authLoading, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'rebuttals':
        return <RebuttalManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'dispositions':
        return <LeadDispositionManagement />;
      case 'customer-service':
        return <CustomerServiceManagement />;
      case 'faq':
        return <FAQManagement />;
      case 'users':
        return <UserManagement />;
      case 'time-blocks':
        return <TimeBlockManagement />;
      default:
        return null;
  }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading Admin Dashboard...</div>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>Please wait while we initialize your admin panel</div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem'
      }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem'
      }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access the admin dashboard.</p>
        <button onClick={() => navigate('/admin/login')}>Go to Login</button>
      </div>
    );
  }

  return (
      <div className="admin-dashboard">
      <header className="admin-header">
            <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <span>Welcome, {adminUser.email}</span>
          <button className="admin-header-button" onClick={() => navigate('/')}>Main Page</button>
          <button className="admin-header-button" onClick={handleLogout}>Logout</button>
          </div>
      </header>

      <nav className="admin-nav">
            <button 
          className={`nav-tab${activeTab === 'dashboard' ? ' active' : ''}`} 
              onClick={() => setActiveTab('dashboard')}
            >
          <span role="img" aria-label="Dashboard">🏠</span> Dashboard
            </button>
            <button 
          className={`nav-tab${activeTab === 'rebuttals' ? ' active' : ''}`} 
          onClick={() => setActiveTab('rebuttals')}
            >
          <span role="img" aria-label="Rebuttals">📝</span> Rebuttals
            </button>
            <button 
          className={`nav-tab${activeTab === 'categories' ? ' active' : ''}`} 
          onClick={() => setActiveTab('categories')}
            >
          <span role="img" aria-label="Categories">🏷️</span> Categories
            </button>
            <button 
          className={`nav-tab${activeTab === 'dispositions' ? ' active' : ''}`} 
          onClick={() => setActiveTab('dispositions')}
            >
          <span role="img" aria-label="Dispositions">📋</span> Dispositions
            </button>
            <button 
          className={`nav-tab${activeTab === 'customer-service' ? ' active' : ''}`} 
          onClick={() => setActiveTab('customer-service')}
            >
          <span role="img" aria-label="Customer Service">👥</span> Customer Service
            </button>
            <button 
          className={`nav-tab${activeTab === 'faq' ? ' active' : ''}`} 
          onClick={() => setActiveTab('faq')}
            >
          <span role="img" aria-label="FAQ">❓</span> FAQ
            </button>
            <button 
          className={`nav-tab${activeTab === 'users' ? ' active' : ''}`} 
          onClick={() => setActiveTab('users')}
            >
          <span role="img" aria-label="Users">👤</span> Users
            </button>
            <button 
          className={`nav-tab${activeTab === 'time-blocks' ? ' active' : ''}`} 
          onClick={() => setActiveTab('time-blocks')}
            >
          <span role="img" aria-label="Time Blocks">⏰</span> Time Blocks
            </button>
        </nav>

      <main className="admin-content">
          {renderContent()}
      </main>
        </div>
  );
};

export default AdminDashboard; 