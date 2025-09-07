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
import AdminSettings from './AdminSettings';

const AdminDashboard = () => {
  const { currentUser, authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scopedCompanyId, setScopedCompanyId] = useState('');
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [companyName, setCompanyName] = useState('');

  // Function to get company name from ID
  const getCompanyName = (companyId) => {
    // Map known company IDs to names
    const companyMap = {
      'oLuxoJq8SHXXEWm9KSEU': 'Long Home',
      'long-home': 'Long Home'
    };
    return companyMap[companyId] || companyId;
  };

  // Update company name when scopedCompanyId changes
  useEffect(() => {
    if (scopedCompanyId) {
      setCompanyName(getCompanyName(scopedCompanyId));
    }
  }, [scopedCompanyId]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 AdminDashboard: Starting auth check...');
        console.log('🔍 AdminDashboard: Current user:', currentUser);
        console.log('🔍 AdminDashboard: Auth loading:', authLoading);

        // Check if user is admin first (from localStorage) - don't wait for authLoading
        const adminUser = localStorage.getItem('adminUser');
        if (adminUser) {
          const parsedAdmin = JSON.parse(adminUser);
          console.log('🔍 AdminDashboard: Found admin user in localStorage:', parsedAdmin);

          // Handle different admin types
          if (parsedAdmin.role === 'super-admin') {
            const url = new URL(window.location.href);
            const impersonateCompanyId = url.searchParams.get('impersonate');
            let impersonation = null;
            try { impersonation = JSON.parse(localStorage.getItem('impersonation') || 'null'); } catch {}

            console.log('🔍 AdminDashboard: Super admin check:', { 
              impersonateCompanyId, 
              impersonation, 
              url: window.location.href,
              hasImpersonateParam: !!impersonateCompanyId,
              hasImpersonationData: !!impersonation?.enabled
            });

            if (impersonateCompanyId || impersonation?.enabled) {
              const targetCompanyId = impersonateCompanyId || impersonation?.companyId || '';
              setScopedCompanyId(targetCompanyId);
              setIsImpersonating(true);
              // Persist for downstream usage
              localStorage.setItem('impersonation', JSON.stringify({ enabled: true, companyId: targetCompanyId }));
              console.log('🔍 AdminDashboard: Super admin impersonating company:', targetCompanyId);
              console.log('🔍 AdminDashboard: Staying on admin dashboard for impersonation');
            } else {
              console.log('🔍 AdminDashboard: Super admin (no impersonation), redirecting to SaaS dashboard');
              console.log('🔍 AdminDashboard: Redirecting to SaaS dashboard because no impersonation found');
              navigate('/admin/saas');
              return;
            }
          } else if (parsedAdmin.role === 'company-admin') {
            // Company admin should access their company's dashboard
            const companyId = parsedAdmin.companyId;
            if (companyId) {
              setScopedCompanyId(companyId);
              setIsImpersonating(false); // Not impersonating, this is their own company
              console.log('🔍 AdminDashboard: Company admin accessing their company:', companyId);
            } else {
              console.error('🔍 AdminDashboard: Company admin missing companyId');
              setError('Company admin missing company information');
              return;
            }
          }

          setAdminUser(parsedAdmin);
          setLoading(false);
        } else {
          console.log('🔍 AdminDashboard: No admin user in localStorage, checking Firestore...');

          // If no currentUser from Firebase Auth, redirect to login
          if (!currentUser) {
            console.log('🔍 AdminDashboard: No current user from Firebase Auth, redirecting to login');
            navigate('/admin/login');
            return;
          }

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
        return <DashboardView onGoTab={(tab) => setActiveTab(tab)} companyId={scopedCompanyId} />;
      case 'rebuttals':
        return <RebuttalManagement companyId={scopedCompanyId} />;
      case 'categories':
        return <CategoryManagement companyId={scopedCompanyId} />;
      case 'dispositions':
        return <LeadDispositionManagement companyId={scopedCompanyId} />;
      case 'customer-service':
        return <CustomerServiceManagement companyId={scopedCompanyId} />;
      case 'faq':
        return <FAQManagement companyId={scopedCompanyId} />;
      case 'users':
        return <UserManagement companyId={scopedCompanyId} />;
      case 'time-blocks':
        return <TimeBlockManagement companyId={scopedCompanyId} />;
      case 'settings':
        return <AdminSettings companyId={scopedCompanyId} companyName={companyName} />;
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
        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '1rem' }}>
          <div>Current user: {currentUser ? currentUser.email : 'None'}</div>
          <div>Auth loading: {authLoading ? 'Yes' : 'No'}</div>
          <div>Admin user in localStorage: {localStorage.getItem('adminUser') ? 'Yes' : 'No'}</div>
        </div>
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
        {(isImpersonating || (adminUser?.role === 'company-admin' && scopedCompanyId)) && (
          <div className="impersonation-banner">
            <span>
              {isImpersonating ? '🔍 Impersonating Company:' : '🏢 Company Admin for:'} {companyName}
            </span>
          </div>
        )}
        <div className="admin-actions">
          {adminUser?.role === 'super-admin' && isImpersonating && (
            <button className="admin-header-button" onClick={exitImpersonation}>Back to My Dashboard</button>
          )}
          {companyName === 'Long Home' && (
            <button 
              className="admin-header-button training-button" 
              onClick={() => window.open('/app', '_blank')}
            >
              🎓 Visit Training
            </button>
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
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Settings</button>
        </aside>
        <main className="dashboard-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard; 