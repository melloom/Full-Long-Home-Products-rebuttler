import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { getDb } from '../../services/firebase/config';
import './SaasAdminDashboard.css';

const SaasAdminDashboard = () => {
  const { currentUser, authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('companies');
  const [companies, setCompanies] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreatePlatform, setShowCreatePlatform] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Form states
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    industry: '',
    plan: 'basic',
    status: 'active'
  });

  const [platformForm, setPlatformForm] = useState({
    name: '',
    companyId: '',
    domain: '',
    theme: 'default',
    features: {
      rebuttals: true,
      dispositions: true,
      customerService: true,
      faq: true,
      scheduling: true
    }
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authLoading) return;
        
        if (!currentUser) {
          navigate('/admin/login');
          return;
        }

        // Check if user is super admin
        const adminUser = localStorage.getItem('adminUser');
        if (adminUser) {
          const parsedAdmin = JSON.parse(adminUser);
          if (parsedAdmin.role === 'super-admin') {
            setAdminUser(parsedAdmin);
            await loadData();
            setLoading(false);
          } else {
            setError('Access denied. Super admin privileges required.');
            setLoading(false);
          }
        } else {
          navigate('/admin/login');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Authentication error');
        setLoading(false);
      }
    };

    checkAuth();
  }, [currentUser, authLoading, navigate]);

  const loadData = async () => {
    try {
      const db = getDb();
      
      // Load companies
      const companiesQuery = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
      const companiesSnapshot = await getDocs(companiesQuery);
      const companiesData = companiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(companiesData);

      // Load platforms
      const platformsQuery = query(collection(db, 'platforms'), orderBy('createdAt', 'desc'));
      const platformsSnapshot = await getDocs(platformsQuery);
      const platformsData = platformsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlatforms(platformsData);

      // Load users
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      const db = getDb();
      const companyData = {
        ...companyForm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'companies'), companyData);
      setShowCreateCompany(false);
      setCompanyForm({ name: '', email: '', industry: '', plan: 'basic', status: 'active' });
      await loadData();
    } catch (err) {
      console.error('Error creating company:', err);
      setError('Failed to create company');
    }
  };

  const handleCreatePlatform = async (e) => {
    e.preventDefault();
    try {
      const db = getDb();
      const platformData = {
        ...platformForm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'platforms'), platformData);
      setShowCreatePlatform(false);
      setPlatformForm({
        name: '',
        companyId: '',
        domain: '',
        theme: 'default',
        features: {
          rebuttals: true,
          dispositions: true,
          customerService: true,
          faq: true,
          scheduling: true
        }
      });
      await loadData();
    } catch (err) {
      console.error('Error creating platform:', err);
      setError('Failed to create platform');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'companies':
        return (
          <div className="saas-content">
            <div className="content-header">
              <h2>Companies</h2>
              <button 
                className="create-button"
                onClick={() => setShowCreateCompany(true)}
              >
                + Create Company
              </button>
            </div>
            
            <div className="companies-grid">
              {companies.map(company => (
                <div key={company.id} className="company-card">
                  <div className="company-header">
                    <h3>{company.name}</h3>
                    <span className={`status-badge ${company.status}`}>
                      {company.status}
                    </span>
                  </div>
                  <div className="company-details">
                    <p><strong>Email:</strong> {company.email}</p>
                    <p><strong>Industry:</strong> {company.industry}</p>
                    <p><strong>Plan:</strong> {company.plan}</p>
                    <p><strong>Created:</strong> {company.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                  </div>
                  <div className="company-actions">
                    <button 
                      className="action-button primary"
                      onClick={() => {
                        setSelectedCompany(company);
                        setActiveTab('platforms');
                      }}
                    >
                      View Platforms
                    </button>
                    <button className="action-button secondary">Edit</button>
                    <button className="action-button danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'platforms':
        return (
          <div className="saas-content">
            <div className="content-header">
              <h2>Training Platforms</h2>
              <button 
                className="create-button"
                onClick={() => setShowCreatePlatform(true)}
              >
                + Create Platform
              </button>
            </div>
            
            <div className="platforms-grid">
              {platforms.map(platform => {
                const company = companies.find(c => c.id === platform.companyId);
                return (
                  <div key={platform.id} className="platform-card">
                    <div className="platform-header">
                      <h3>{platform.name}</h3>
                      <span className="company-name">{company?.name || 'Unknown Company'}</span>
                    </div>
                    <div className="platform-details">
                      <p><strong>Domain:</strong> {platform.domain}</p>
                      <p><strong>Theme:</strong> {platform.theme}</p>
                      <p><strong>Features:</strong> {Object.keys(platform.features).filter(f => platform.features[f]).join(', ')}</p>
                    </div>
                    <div className="platform-actions">
                      <button className="action-button primary">View</button>
                      <button className="action-button secondary">Edit</button>
                      <button className="action-button danger">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="saas-content">
            <div className="content-header">
              <h2>All Users</h2>
            </div>
            
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const company = companies.find(c => c.id === user.companyId);
                    return (
                      <tr key={user.id}>
                        <td>{user.name || 'N/A'}</td>
                        <td>{user.email}</td>
                        <td>{company?.name || 'N/A'}</td>
                        <td>{user.role || 'user'}</td>
                        <td>
                          <span className={`status-badge ${user.status || 'active'}`}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td>
                          <button className="action-button secondary">Edit</button>
                          <button className="action-button danger">Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="saas-content">
            <div className="content-header">
              <h2>Analytics & Reports</h2>
            </div>
            
            <div className="analytics-grid">
              <div className="stat-card">
                <h3>Total Companies</h3>
                <div className="stat-number">{companies.length}</div>
              </div>
              <div className="stat-card">
                <h3>Total Platforms</h3>
                <div className="stat-number">{platforms.length}</div>
              </div>
              <div className="stat-card">
                <h3>Total Users</h3>
                <div className="stat-number">{users.length}</div>
              </div>
              <div className="stat-card">
                <h3>Active Platforms</h3>
                <div className="stat-number">{platforms.filter(p => p.status === 'active').length}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Loading SaaS Admin Dashboard...</h2>
        <p>Please wait while we initialize your super admin panel</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="error-container">
        <h2>Access Denied</h2>
        <p>You don't have permission to access the SaaS admin dashboard.</p>
        <button onClick={() => navigate('/admin/login')}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="saas-admin-dashboard">
      <header className="saas-admin-header">
        <div className="header-left">
          <h1>🚀 SaaS Admin Dashboard</h1>
          <span className="subtitle">Multi-Tenant Training Platform Management</span>
        </div>
        <div className="header-right">
          <span>Welcome, {adminUser.email}</span>
          <button className="header-button" onClick={() => navigate('/')}>Main App</button>
          <button className="header-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav className="saas-admin-nav">
        <button 
          className={`nav-tab ${activeTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveTab('companies')}
        >
          🏢 Companies
        </button>
        <button 
          className={`nav-tab ${activeTab === 'platforms' ? 'active' : ''}`}
          onClick={() => setActiveTab('platforms')}
        >
          🎯 Platforms
        </button>
        <button 
          className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
      </nav>

      <main className="saas-admin-content">
        {renderContent()}
      </main>

      {/* Create Company Modal */}
      {showCreateCompany && (
        <div className="modal-overlay" onClick={() => setShowCreateCompany(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Company</h3>
              <button className="modal-close" onClick={() => setShowCreateCompany(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCompany} className="modal-body">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({...companyForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <select
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm({...companyForm, industry: e.target.value})}
                  required
                >
                  <option value="">Select Industry</option>
                  <option value="home-improvement">Home Improvement</option>
                  <option value="sales">Sales</option>
                  <option value="customer-service">Customer Service</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Plan</label>
                <select
                  value={companyForm.plan}
                  onChange={(e) => setCompanyForm({...companyForm, plan: e.target.value})}
                >
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateCompany(false)}>Cancel</button>
                <button type="submit">Create Company</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Platform Modal */}
      {showCreatePlatform && (
        <div className="modal-overlay" onClick={() => setShowCreatePlatform(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Platform</h3>
              <button className="modal-close" onClick={() => setShowCreatePlatform(false)}>×</button>
            </div>
            <form onSubmit={handleCreatePlatform} className="modal-body">
              <div className="form-group">
                <label>Platform Name</label>
                <input
                  type="text"
                  value={platformForm.name}
                  onChange={(e) => setPlatformForm({...platformForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Company</label>
                <select
                  value={platformForm.companyId}
                  onChange={(e) => setPlatformForm({...platformForm, companyId: e.target.value})}
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Domain</label>
                <input
                  type="text"
                  value={platformForm.domain}
                  onChange={(e) => setPlatformForm({...platformForm, domain: e.target.value})}
                  placeholder="company-name.trainingplatform.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Theme</label>
                <select
                  value={platformForm.theme}
                  onChange={(e) => setPlatformForm({...platformForm, theme: e.target.value})}
                >
                  <option value="default">Default</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
              <div className="form-group">
                <label>Features</label>
                <div className="checkbox-group">
                  {Object.keys(platformForm.features).map(feature => (
                    <label key={feature} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={platformForm.features[feature]}
                        onChange={(e) => setPlatformForm({
                          ...platformForm,
                          features: {
                            ...platformForm.features,
                            [feature]: e.target.checked
                          }
                        })}
                      />
                      {feature.charAt(0).toUpperCase() + feature.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreatePlatform(false)}>Cancel</button>
                <button type="submit">Create Platform</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaasAdminDashboard;