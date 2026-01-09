import { useState } from 'react';

export const useSaasAdminUI = () => {
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      return localStorage.getItem('saas-admin-active-tab') || 'dashboard';
    } catch (err) {
      console.warn('Could not read saas-admin-active-tab from localStorage:', err);
      return 'dashboard';
    }
  });

  // Setter that keeps localStorage in sync
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('saas-admin-active-tab', tab);
    } catch (err) {
      console.warn('Could not persist saas-admin-active-tab to localStorage:', err);
    }
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [expandedCompanies, setExpandedCompanies] = useState(new Set());
  
  // Modal states
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreatePlatform, setShowCreatePlatform] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [showEditPlatform, setShowEditPlatform] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  
  // Form states
  const [editingCompany, setEditingCompany] = useState(null);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [modalType, setModalType] = useState(''); // 'create-user' or 'edit-admin'
  
  // Platform builder states
  const [activePageBuilderTab, setActivePageBuilderTab] = useState('pages');
  const [selectedPage, setSelectedPage] = useState('dashboard');
  const [selectedSection, setSelectedSection] = useState(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user',
    companyId: '',
    isActive: true,
    permissions: []
  });
  
  const [editCompanyForm, setEditCompanyForm] = useState({
    name: '',
    email: '',
    industry: '',
    plan: 'starter',
    status: 'active',
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.'
  });
  
  const [showPassword, setShowPassword] = useState(false);

  // Impersonation states
  const [impersonateMode, setImpersonateMode] = useState(() => {
    try {
      const saved = localStorage.getItem('impersonation');
      const parsed = saved ? JSON.parse(saved) : null;
      return !!parsed?.enabled;
    } catch { return false; }
  });
  
  const [impersonateCompanyId, setImpersonateCompanyId] = useState(() => {
    try {
      const saved = localStorage.getItem('impersonation');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed?.companyId || '';
    } catch { return ''; }
  });

  const toggleCompanyExpansion = (companyId) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  const openDeleteConfirm = (item, type) => {
    setItemToDelete({ item, type });
    setShowDeleteConfirm(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDeleteConfirm = () => {
    setItemToDelete(null);
    setShowDeleteConfirm(false);
    document.body.style.overflow = 'auto';
  };

  const openCreateUser = () => {
    setModalType('create-user');
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'user',
      companyId: '',
      isActive: true,
      permissions: []
    });
    setShowNewModal(true);
    document.body.style.overflow = 'hidden';
  };

  const openEditAdmin = (admin) => {
    setModalType('edit-admin');
    setEditingAdmin(admin);
    setFormData({
      email: admin.email || '',
      name: admin.name || '',
      password: '',
      role: admin.role || 'admin',
      companyId: admin.companyId || '',
      isActive: admin.isActive !== false,
      permissions: admin.permissions || []
    });
    setShowNewModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeNewModal = () => {
    setShowNewModal(false);
    setModalType('');
    setEditingAdmin(null);
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'user',
      companyId: '',
      isActive: true,
      permissions: []
    });
    document.body.style.overflow = 'auto';
  };

  const openEditCompany = (company) => {
    console.log('🔍 Opening edit company modal for:', company);
    console.log('🔍 Company status:', company.status);
    setEditingCompany(company);
    setEditCompanyForm({
      name: company.name || '',
      email: company.email || '',
      industry: company.industry || '',
      plan: company.plan || 'starter',
      status: company.status || 'active',
      maintenanceMode: company.maintenanceMode || false,
      maintenanceMessage: company.maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon.'
    });
    setShowEditCompany(true);
    document.body.style.overflow = 'hidden';
  };

  const closeEditCompany = () => {
    setShowEditCompany(false);
    setEditingCompany(null);
    setEditCompanyForm({
      name: '',
      email: '',
      industry: '',
      plan: 'starter',
      status: 'active',
      maintenanceMode: false,
      maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.'
    });
    document.body.style.overflow = 'auto';
  };

  const openEditPlatform = (platform) => {
    setEditingPlatform(platform);
    setShowEditPlatform(true);
    document.body.style.overflow = 'hidden';
  };

  const closeEditPlatform = () => {
    setShowEditPlatform(false);
    setEditingPlatform(null);
    setActivePageBuilderTab('pages');
    setSelectedPage('dashboard');
    setSelectedSection(null);
    setShowLivePreview(false);
    document.body.style.overflow = 'auto';
  };

  const toggleImpersonation = () => {
    const newMode = !impersonateMode;
    console.log('🔄 Toggling impersonation:', { 
      currentMode: impersonateMode, 
      newMode, 
      companyId: impersonateCompanyId 
    });
    
    setImpersonateMode(newMode);
    
    if (newMode && impersonateCompanyId) {
      const impersonationData = { enabled: true, companyId: impersonateCompanyId };
      localStorage.setItem('impersonation', JSON.stringify(impersonationData));
      console.log('✅ Impersonation enabled:', impersonationData);
    } else {
      localStorage.removeItem('impersonation');
      console.log('❌ Impersonation disabled');
    }
  };

  return {
    // State
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
    
    // Setters
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
    
    // Actions
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
  };
};