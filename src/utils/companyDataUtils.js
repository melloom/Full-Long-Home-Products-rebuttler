// Utility functions for company and admin data management

/**
 * Formats user data with consistent structure
 * @param {Object} userData - Raw user data from Firestore
 * @param {string} type - 'admin' or 'user'
 * @returns {Object} Formatted user data
 */
export const formatUserData = (userData, type = 'user') => {
  return {
    ...userData,
    type,
    displayRole: type === 'admin' ? 'Company Admin' : (userData.role || 'User'),
    status: userData.status || 'active',
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt || userData.createdAt
  };
};

/**
 * Calculates company statistics
 * @param {Array} companies - Array of company objects
 * @param {Object} companyAdmins - Object mapping company IDs to user arrays
 * @returns {Object} Statistics object
 */
export const calculateCompanyStats = (companies = [], companyAdmins = {}) => {
  const stats = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter(c => c?.status === 'active').length,
    inactiveCompanies: companies.filter(c => c?.status === 'inactive').length,
    totalUsers: 0,
    totalAdmins: 0,
    companiesWithNoUsers: 0,
    averageUsersPerCompany: 0
  };

  // Safely calculate user statistics
  if (companyAdmins && typeof companyAdmins === 'object') {
    Object.values(companyAdmins).forEach(users => {
      if (Array.isArray(users)) {
        stats.totalUsers += users.length;
        stats.totalAdmins += users.filter(u => u?.type === 'admin').length;
      }
    });

    // Count companies with no users
    stats.companiesWithNoUsers = companies.filter(
      company => !companyAdmins[company?.id] || !Array.isArray(companyAdmins[company.id]) || companyAdmins[company.id].length === 0
    ).length;
  } else {
    // If companyAdmins is null/undefined, all companies have no users
    stats.companiesWithNoUsers = companies.length;
  }

  // Calculate average
  stats.averageUsersPerCompany = stats.totalCompanies > 0 
    ? Math.round(stats.totalUsers / stats.totalCompanies) 
    : 0;

  return stats;
};

/**
 * Filters companies and users based on search term
 * @param {Array} companies - Array of company objects
 * @param {Object} companyAdmins - Object mapping company IDs to user arrays
 * @param {string} searchTerm - Search term to filter by
 * @returns {Array} Filtered companies array
 */
export const filterCompaniesAndUsers = (companies = [], companyAdmins = {}, searchTerm = '') => {
  if (!searchTerm || searchTerm.trim() === '') return companies;

  const term = searchTerm.toLowerCase().trim();

  return companies.filter(company => {
    if (!company) return false;

    // Check company name and email
    const companyMatch = 
      company.name?.toLowerCase().includes(term) ||
      company.email?.toLowerCase().includes(term) ||
      company.industry?.toLowerCase().includes(term);

    // Check users within the company
    const companyUsers = companyAdmins && companyAdmins[company.id] ? companyAdmins[company.id] : [];
    const usersMatch = Array.isArray(companyUsers) && companyUsers.some(user =>
      user?.name?.toLowerCase().includes(term) ||
      user?.email?.toLowerCase().includes(term) ||
      user?.displayRole?.toLowerCase().includes(term)
    );

    return companyMatch || usersMatch;
  });
};

/**
 * Sorts companies by various criteria
 * @param {Array} companies - Array of company objects
 * @param {string} sortBy - Sort criteria ('name', 'created', 'users', 'status')
 * @param {string} sortOrder - 'asc' or 'desc'
 * @param {Object} companyAdmins - Object mapping company IDs to user arrays
 * @returns {Array} Sorted companies array
 */
export const sortCompanies = (companies, sortBy = 'created', sortOrder = 'desc', companyAdmins = {}) => {
  return [...companies].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'users':
        aValue = (companyAdmins[a.id] || []).length;
        bValue = (companyAdmins[b.id] || []).length;
        break;
      case 'status':
        aValue = a.status || 'active';
        bValue = b.status || 'active';
        break;
      case 'created':
      default:
        aValue = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        bValue = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        break;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Formats date for display
 * @param {*} date - Date object, Firestore timestamp, or date string
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  
  const d = date.toDate ? date.toDate() : new Date(date);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return d.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Formats date with time for display
 * @param {*} date - Date object, Firestore timestamp, or date string
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Gets user initials for avatar display
 * @param {string} name - User's full name
 * @returns {string} User initials (up to 2 characters)
 */
export const getUserInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  
  return name
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Gets CSS class for status badges
 * @param {string} status - Status value
 * @returns {string} CSS class name
 */
export const getStatusBadgeClass = (status) => {
  const baseClass = 'status-badge';
  
  switch (status?.toLowerCase()) {
    case 'active':
      return `${baseClass} active`;
    case 'inactive':
      return `${baseClass} inactive`;
    case 'pending':
      return `${baseClass} pending`;
    default:
      return baseClass;
  }
};

/**
 * Gets CSS class for role badges
 * @param {string} type - User type ('admin' or 'user')
 * @param {string} role - User role
 * @returns {string} CSS class name
 */
export const getRoleBadgeClass = (type, role) => {
  const baseClass = 'role-badge';
  
  if (type === 'admin') return `${baseClass} admin`;
  if (role === 'super-admin') return `${baseClass} super-admin`;
  return `${baseClass} user`;
};

/**
 * Validates company data
 * @param {Object} companyData - Company data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateCompanyData = (companyData) => {
  const errors = [];

  if (!companyData.name || companyData.name.trim() === '') {
    errors.push('Company name is required');
  }

  if (!companyData.email || companyData.email.trim() === '') {
    errors.push('Company email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates user data
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateUserData = (userData) => {
  const errors = [];

  if (!userData.name || userData.name.trim() === '') {
    errors.push('User name is required');
  }

  if (!userData.email || userData.email.trim() === '') {
    errors.push('User email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push('Invalid email format');
  }

  if (!userData.companyId) {
    errors.push('Company is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};