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
  const [scopedCompanyId, setScopedCompanyId] = useState('');
  const [isImpersonating, setIsImpersonating] = useState(false);

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

          // If super admin, stay here only if impersonating, else go to SaaS
          if (parsedAdmin.role === 'super-admin') {
            const url = new URL(window.location.href);
            const impersonateCompanyId = url.searchParams.get('impersonate');
            let impersonation = null;
            try { impersonation = JSON.parse(localStorage.getItem('impersonation') || 'null'); } catch {}

            if (impersonateCompanyId || impersonation?.enabled) {
              const targetCompanyId = impersonateCompanyId || impersonation?.companyId || '';
              setScopedCompanyId(targetCompanyId);
              setIsImpersonating(true);
              // Persist for downstream usage
              localStorage.setItem('impersonation', JSON.stringify({ enabled: true, companyId: targetCompanyId }));
              console.log('🔍 AdminDashboard: Super admin impersonating company:', targetCompanyId);
            } else {
              console.log('🔍 AdminDashboard: Super admin (no impersonation), redirecting to SaaS dashboard');
              navigate('/admin/saas');
              return;
            }
          }

          setAdminUser(parsedAdmin);
          setLoading(false);
        } else {
          console.log('🔍 AdminDashboard: No admin user in localStorage, checking Firestore...');

          // First check if user is a super admin
          const superAdminRef = doc(getFirestore(), 'super-admins', currentUser.uid);
          const superAdminDoc = await getDoc(superAdminRef);

          if (superAdminDoc.exists()) {
            const superAdminData = superAdminDoc.data();
            console.log('🔍 AdminDashboard: Found super admin in Firestore, redirecting to SaaS dashboard');

            const adminUser = {
              uid: currentUser.uid,
              email: currentUser.email,
              role: 'super-admin',
              ...superAdminData
            };
            localStorage.setItem('adminUser', JSON.stringify(adminUser));

            navigate('/admin/saas');
            return;
          }

          // Check if user exists in regular admins collection
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
    // do not clear impersonation here; managed from SaaS dashboard
    navigate('/admin/login');
  };

  const exitImpersonation = () => {
    try { localStorage.removeItem('impersonation'); } catch {}
    setIsImpersonating(false);
    navigate('/admin/saas');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onGoTab={(tab) => setActiveTab(tab)} />;
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
          {adminUser?.role === 'super-admin' && isImpersonating && (
            <button className="admin-header-button" onClick={exitImpersonation}>Back to My Dashboard</button>
          )}
          <span>Welcome, {adminUser.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <div className="dashboard-container">
        <aside className="sidebar">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button className={activeTab === 'rebuttals' ? 'active' : ''} onClick={() => setActiveTab('rebuttals')}>Rebuttals</button>
          <button className={activeTab === 'categories' ? 'active' : ''} onClick={() => setActiveTab('categories')}>Categories</button>
          <button className={activeTab === 'dispositions' ? 'active' : ''} onClick={() => setActiveTab('dispositions')}>Lead Dispositions</button>
          <button className={activeTab === 'customer-service' ? 'active' : ''} onClick={() => setActiveTab('customer-service')}>Customer Service</button>
          <button className={activeTab === 'faq' ? 'active' : ''} onClick={() => setActiveTab('faq')}>FAQ</button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users</button>
          <button className={activeTab === 'time-blocks' ? 'active' : ''} onClick={() => setActiveTab('time-blocks')}>Time Blocks</button>
        </aside>
        <main className="dashboard-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard; 