import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { useSaasAdminData } from '../../../hooks/useSaasAdminData';
import { useSaasAdminUI } from '../../../hooks/useSaasAdminUI';
import { generatePlatformForm, generateAppPageContent } from '../../../utils/saasAdminUtils';
import userService from '../../../services/userService';
import { getDb } from '../../../services/firebase/config';

// Components
import SaasDashboardOverview from './SaasDashboardOverview';
import SaasCompaniesManagement from './SaasCompaniesManagement';
import SaasPlatformsManagement from './SaasPlatformsManagement';
import SaasUsersManagement from './SaasUsersManagement';
import SaasDeletedCompanies from './SaasDeletedCompanies';
import RegistrationRequestsManagement from './RegistrationRequestsManagement';

// Modals
import DeleteConfirmModal from './modals/DeleteConfirmModal';
import CompanyModal from './modals/CompanyModal';
import CreatePlatformModal from './modals/CreatePlatformModal';
import EditAdminModal from './modals/EditAdminModal';

// Platform Builder
import PlatformBuilder from './PlatformBuilder';

import './SaasAdminDashboard.css';

const SaasAdminDashboard = () => {
  const { currentUser, authLoading, logout } = useAuth();
  const navigate = useNavigate();
  
  // Custom hooks
  const {
    loading,
    error,
    adminUser,
    companies,
    platforms,
    users,
    companyAdmins,
    deletedCompanies,
    registrationRequests,
    createCompany,
    createPlatform,
    updateCompany,
    updatePlatform,
    deleteCompany,
    restoreCompany,
    loadData
  } = useSaasAdminData();

  const {
    activeTab,
    sidebarCollapsed,
    selectedCompany,
    expandedCompanies,
    showCreateCompany,
    showCreatePlatform,
    showEditCompany,
    showEditPlatform,
    showDeleteConfirm,
    showNewModal,
    editingCompany,
    editingPlatform,
    editingAdmin,
    itemToDelete,
    modalType,
    activePageBuilderTab,
    selectedPage,
    selectedSection,
    showLivePreview,
    formData,
    editCompanyForm,
    showPassword,
    impersonateMode,
    impersonateCompanyId,
    setActiveTab,
    setSidebarCollapsed,
    setSelectedCompany,
    setExpandedCompanies,
    setShowCreateCompany,
    setShowCreatePlatform,
    setShowEditCompany,
    setShowEditPlatform,
    setShowDeleteConfirm,
    setShowNewModal,
    setEditingCompany,
    setEditingPlatform,
    setEditingAdmin,
    setItemToDelete,
    setModalType,
    setActivePageBuilderTab,
    setSelectedPage,
    setSelectedSection,
    setShowLivePreview,
    setFormData,
    setEditCompanyForm,
    setShowPassword,
    setImpersonateMode,
    setImpersonateCompanyId,
    toggleCompanyExpansion,
    openDeleteConfirm,
    closeDeleteConfirm,
    openCreateUser,
    openEditAdmin,
    closeNewModal,
    openEditCompany,
    closeEditCompany,
    openEditPlatform,
    closeEditPlatform,
    toggleImpersonation
  } = useSaasAdminUI();

  // Platform form state
  const [platformForm, setPlatformForm] = useState(generatePlatformForm());

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      const { item, type } = itemToDelete;
      
      if (type === 'company') {
        await deleteCompany(item.id);
      } else if (type === 'platform') {
        // Handle platform deletion
        console.log('Delete platform:', item.id);
      } else if (type === 'user') {
        await handleDeleteUser(item);
      }
      
      closeDeleteConfirm();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (user) => {
    try {
      console.log('🔍 SaasAdminDashboard: Attempting to delete user:', user);
      await userService.deleteUser(user.id);
      console.log('🔍 SaasAdminDashboard: User deleted successfully');
      // Reload data to refresh the user list
      await loadData();
    } catch (error) {
      console.error('🔍 SaasAdminDashboard: Error deleting user:', error);
      
      if (error.message.includes('must be logged in')) {
        alert('You must be logged in to delete users');
      } else if (error.message.includes('Firebase Auth session required')) {
        alert('Your session has expired. Please log in again to continue.');
      } else if (error.message.includes('permission-denied')) {
        alert('You do not have permission to delete users');
      } else if (error.message.includes('not found')) {
        alert('User not found. They may have already been deleted.');
      } else {
        alert(`Failed to delete user: ${error.message}`);
      }
    }
  };

  // Handle user deletion with confirmation
  const onDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.name || user.email}"?`)) {
      openDeleteConfirm({ item: user, type: 'user' });
    }
  };

  // Handle company creation
  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await createCompany(editCompanyForm);
      setShowCreateCompany(false);
      setEditCompanyForm({
    name: '',
    email: '',
    industry: '',
    plan: 'starter',
    status: 'active',
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.'
  });
    } catch (err) {
      console.error('Create company error:', err);
    }
  };

  // Handle company editing
  const handleEditCompany = async (e) => {
    e.preventDefault();
    try {
      console.log('🔍 Editing company with form data:', editCompanyForm);
      console.log('🔍 Status in form:', editCompanyForm.status);
      await updateCompany(editingCompany.id, editCompanyForm);
      closeEditCompany();
    } catch (err) {
      console.error('Edit company error:', err);
    }
  };

  // Handle platform creation
  const handleCreatePlatform = async (e) => {
    e.preventDefault();
    try {
      await createPlatform(platformForm);
      setShowCreatePlatform(false);
      setPlatformForm(generatePlatformForm());
    } catch (err) {
      console.error('Create platform error:', err);
    }
  };

  // Handle platform editing
  const handleEditPlatform = async (e) => {
    e.preventDefault();
    try {
      await updatePlatform(editingPlatform.id, platformForm);
      closeEditPlatform();
    } catch (err) {
      console.error('Edit platform error:', err);
    }
  };

  // Handle user creation/editing
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      // Handle user creation/editing logic here
      console.log('Form submit:', formData);
      closeNewModal();
    } catch (err) {
      console.error('Form submit error:', err);
    }
  };

  // Handle company status toggle
  const toggleCompanyStatus = async (company) => {
    try {
      const newStatus = company.status === 'active' ? 'inactive' : 'active';
      await updateCompany(company.id, { status: newStatus });
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  // Handle approve registration request
  const handleApproveRequest = async (request) => {
    try {
      const db = getDb();
      
      // Update request status to approved
      const requestRef = doc(db, 'company-registration-requests', request.id);
      await updateDoc(requestRef, {
        status: 'approved',
        updatedAt: serverTimestamp(),
        approvedAt: serverTimestamp()
      });

      // Create the company
      const companyData = {
        name: request.companyName,
        email: request.email,
        slug: request.slug,
        plan: request.plan || 'starter',
        status: 'active',
        industry: 'Other',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const companyRef = doc(collection(db, 'companies'));
      await setDoc(companyRef, companyData);
      
      // Reload data
      await loadData();
      
      alert(`Registration request approved! Company "${request.companyName}" has been created.`);
    } catch (err) {
      console.error('Error approving request:', err);
      alert(`Failed to approve request: ${err.message}`);
    }
  };

  // Handle reject registration request
  const handleRejectRequest = async (request) => {
    if (!window.confirm(`Are you sure you want to reject the registration request from "${request.companyName}"?`)) {
      return;
    }

    try {
      const db = getDb();
      
      const requestRef = doc(db, 'company-registration-requests', request.id);
      await updateDoc(requestRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
        rejectedAt: serverTimestamp()
      });

      // Reload data
      await loadData();
      
      alert(`Registration request from "${request.companyName}" has been rejected.`);
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert(`Failed to reject request: ${err.message}`);
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Clear impersonation data
    localStorage.removeItem('impersonation');
    
    // Use AuthContext logout to clear all auth data
    logout();
    
    // Navigate to login
    navigate('/admin/login');
  };

  // Handle impersonation navigation
  const goToImpersonatedDashboard = () => {
    console.log('🚀 Impersonation navigation:', { impersonateMode, impersonateCompanyId });
    if (impersonateMode && impersonateCompanyId) {
      // Find the company to get its slug
      const company = companies.find(c => c.id === impersonateCompanyId);
      if (company) {
        const slugOrId = company.slug || company.id;
        let targetUrl;
        
        // For Long Home Products, go to admin dashboard with impersonation
        if (slugOrId === 'long-home') {
          targetUrl = `/admin/dashboard?impersonate=${impersonateCompanyId}`;
        } else {
          targetUrl = `/company/${slugOrId}`;
        }
        
        console.log('🚀 Navigating to company dashboard:', targetUrl);
        // Set impersonation data in localStorage
        localStorage.setItem('impersonation', JSON.stringify({ 
          enabled: true, 
          companyId: impersonateCompanyId 
        }));
        navigate(targetUrl);
      } else {
        console.warn('🚀 Company not found for impersonation:', impersonateCompanyId);
      }
    } else {
      console.warn('🚀 Impersonation navigation failed:', { impersonateMode, impersonateCompanyId });
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <SaasDashboardOverview 
            companies={companies}
            platforms={platforms}
            users={users}
            adminUser={adminUser}
          />
        );
      
      case 'companies':
        return (
          <SaasCompaniesManagement
            companies={companies}
            companyAdmins={companyAdmins}
            expandedCompanies={expandedCompanies}
            onToggleExpansion={toggleCompanyExpansion}
            onViewPlatforms={(company) => {
              setSelectedCompany(company);
              setActiveTab('platforms');
            }}
            onEditCompany={openEditCompany}
            onToggleStatus={toggleCompanyStatus}
            onDeleteCompany={openDeleteConfirm}
            onCreateCompany={() => setShowCreateCompany(true)}
          />
        );
      
      case 'platforms':
        return (
          <SaasPlatformsManagement
            platforms={platforms}
            companies={companies}
            selectedCompany={selectedCompany}
            onCreatePlatform={() => setShowCreatePlatform(true)}
            onEditPlatform={openEditPlatform}
            onDeletePlatform={openDeleteConfirm}
          />
        );
      
      case 'users':
        return (
          <SaasUsersManagement
            users={users}
            companies={companies}
            companyAdmins={companyAdmins}
            onCreateUser={openCreateUser}
            onEditAdmin={openEditAdmin}
            onDeleteUser={onDeleteUser}
          />
        );
      
      case 'deleted':
        return (
          <SaasDeletedCompanies
            deletedCompanies={deletedCompanies}
            onRestoreCompany={restoreCompany}
          />
        );
      
      case 'requests':
        return (
          <RegistrationRequestsManagement
            registrationRequests={registrationRequests}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
          />
        );
      
      default:
        return <div>Unknown tab</div>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/admin/login')}>Go to Login</button>
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
    <div className="saas-admin-dashboard dark-mode">
      <header className="saas-admin-header">
        <div className="header-left">
          <h1>🚀 SaaS Admin Dashboard</h1>
          <span className="subtitle">Multi-Tenant Training Platform Management</span>
        </div>
        <div className="header-right">
          <span className="welcome-user">Welcome, {adminUser.email}</span>
          {adminUser.role === 'super-admin' && (
            <div className="impersonate-controls" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={impersonateMode} onChange={toggleImpersonation} />
                <span>Impersonator Mode</span>
              </label>
              <select
                value={impersonateCompanyId}
                onChange={(e) => {
                  setImpersonateCompanyId(e.target.value);
                  if (impersonateMode) {
                    localStorage.setItem('impersonation', JSON.stringify({ enabled: true, companyId: e.target.value }));
                  }
                }}
                disabled={!impersonateMode}
                style={{ padding: '6px 10px', borderRadius: 6 }}
              >
                <option value="">Select company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.id}</option>
                ))}
              </select>
              <button className="header-button" onClick={goToImpersonatedDashboard} disabled={!impersonateMode || !impersonateCompanyId}>
                {impersonateCompanyId && companies.find(c => c.id === impersonateCompanyId)?.slug === 'long-home' ? 'Visit Admin Dashboard' : 'Visit Training'}
              </button>
            </div>
          )}
          <button className="header-button" onClick={() => navigate('/')}>SaaS Landing</button>
          <button className="header-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="saas-admin-layout">
        <aside className={`saas-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            {!sidebarCollapsed && <h3>🚀 SaaS Admin</h3>}
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          
          <nav className="sidebar-nav">
            <button 
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="sidebar-icon">🏠</span>
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>
            
            <button 
              className={`sidebar-item ${activeTab === 'companies' ? 'active' : ''}`}
              onClick={() => setActiveTab('companies')}
            >
              <span className="sidebar-icon">🏢</span>
              {!sidebarCollapsed && <span>Companies</span>}
            </button>
            
            <button 
              className={`sidebar-item ${activeTab === 'platforms' ? 'active' : ''}`}
              onClick={() => setActiveTab('platforms')}
            >
              <span className="sidebar-icon">🎯</span>
              {!sidebarCollapsed && <span>Platforms</span>}
            </button>
            
            <button 
              className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="sidebar-icon">👥</span>
              {!sidebarCollapsed && <span>Users</span>}
            </button>
            
            <button 
              className={`sidebar-item ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <span className="sidebar-icon">📋</span>
              {!sidebarCollapsed && <span>Registration Requests</span>}
            </button>
            
            <button 
              className={`sidebar-item ${activeTab === 'deleted' ? 'active' : ''}`}
              onClick={() => setActiveTab('deleted')}
            >
              <span className="sidebar-icon">🗑️</span>
              {!sidebarCollapsed && <span>Deleted</span>}
            </button>
          </nav>
        </aside>

        <main className="saas-main">
          {renderContent()}
        </main>
      </div>

      {/* Modals */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        itemToDelete={itemToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteConfirm}
      />

      <CompanyModal
        isOpen={showCreateCompany}
        isEdit={false}
        formData={editCompanyForm}
        onFormChange={setEditCompanyForm}
        onSubmit={handleCreateCompany}
        onCancel={() => setShowCreateCompany(false)}
      />

      <CompanyModal
        isOpen={showEditCompany}
        isEdit={true}
        company={editingCompany}
        formData={editCompanyForm}
        onFormChange={setEditCompanyForm}
        onSubmit={handleEditCompany}
        onCancel={closeEditCompany}
      />

      <CreatePlatformModal
        isOpen={showCreatePlatform}
        companies={companies}
        onClose={() => setShowCreatePlatform(false)}
        onSuccess={(newPlatform) => {
          console.log('Platform created successfully:', newPlatform);
          setShowCreatePlatform(false);
          // Refresh data to show the new platform
          loadData();
        }}
      />

      <EditAdminModal
        isOpen={showNewModal}
        isEdit={modalType === 'edit-admin'}
        companies={companies}
        formData={formData}
        showPassword={showPassword}
        onFormChange={setFormData}
        onTogglePassword={() => setShowPassword(!showPassword)}
        onSubmit={handleFormSubmit}
        onCancel={closeNewModal}
      />

      {/* Platform Builder Modal */}
      {showEditPlatform && (
        <PlatformBuilder
          isOpen={showEditPlatform}
          platform={editingPlatform}
          platformForm={platformForm}
          setPlatformForm={setPlatformForm}
          activePageBuilderTab={activePageBuilderTab}
          setActivePageBuilderTab={setActivePageBuilderTab}
          selectedPage={selectedPage}
          setSelectedPage={setSelectedPage}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          showLivePreview={showLivePreview}
          setShowLivePreview={setShowLivePreview}
          onSave={handleEditPlatform}
          onCancel={closeEditPlatform}
          companies={companies}
        />
      )}
    </div>
  );
};

export default SaasAdminDashboard;