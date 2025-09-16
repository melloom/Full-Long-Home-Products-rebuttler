import React, { useState, useMemo } from 'react';
import { 
  calculateCompanyStats, 
  filterCompaniesAndUsers, 
  formatDate, 
  getUserInitials, 
  getStatusBadgeClass, 
  getRoleBadgeClass 
} from '../../../utils/companyDataUtils';


const SaasUsersManagement = ({ companies = [], companyAdmins = {}, onCreateUser, onEditAdmin, onDeleteUser }) => {
  const [viewMode, setViewMode] = useState('hierarchical'); // 'hierarchical' or 'table'
  const [expandedCompanies, setExpandedCompanies] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Expand/Collapse functions
  const expandAll = () => {
    if (companies && Array.isArray(companies)) {
      setExpandedCompanies(new Set(companies.map(c => c?.id).filter(Boolean)));
    }
  };

  const collapseAll = () => {
    setExpandedCompanies(new Set());
  };

  const toggleCompany = (companyId) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  // Calculate statistics using utility function
  const stats = useMemo(() => {
    return calculateCompanyStats(companies, companyAdmins);
  }, [companies, companyAdmins]);

  // Filter companies based on search using utility function
  const filteredCompanies = useMemo(() => {
    return filterCompaniesAndUsers(companies, companyAdmins, searchTerm);
  }, [companies, companyAdmins, searchTerm]);



  const renderHierarchicalView = () => (
    <div className="hierarchical-users">
      {filteredCompanies.map(company => {
        const companyUsers = companyAdmins[company.id] || [];
        const isExpanded = expandedCompanies.has(company.id);
        const adminCount = companyUsers.filter(u => u.type === 'admin').length;
        const userCount = companyUsers.filter(u => u.type === 'user').length;

        return (
          <div key={company.id} className="company-section">
            <div 
              className="company-header"
              onClick={() => toggleCompany(company.id)}
            >
              <div className="company-info">
                <span className="expand-icon">
                  {isExpanded ? '🔽' : '▶️'}
                </span>
                <div className="company-details">
                  <h3 className="company-name">{company.name}</h3>
                  <div className="company-stats">
                    <span className="user-count">
                      👥 {companyUsers.length} users ({adminCount} admins, {userCount} users)
                    </span>
                    <span className={getStatusBadgeClass(company.status)}>
                      {company.status || 'active'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="company-actions">
                <span className="total-users">
                  Total: {companyUsers.length}
                </span>
              </div>
            </div>

            {isExpanded && (
              <div className="company-users">
                <div className="table-header">
                  <div className="table-cell">User</div>
                  <div className="table-cell">Email</div>
                  <div className="table-cell">Role</div>
                  <div className="table-cell">Status</div>
                  <div className="table-cell">Created</div>
                  <div className="table-cell">Actions</div>
                </div>
                
                {companyUsers.length > 0 ? (
                  companyUsers.map(user => (
                    <div key={user.id} className="table-row user-row">
                      <div className="table-cell">
                        <div className="user-info">
                          <div className={`user-avatar ${user.type}`}>
                            {getUserInitials(user.name)}
                          </div>
                          <div className="user-details">
                            <span className="user-name">
                              {user.name || 'Unknown User'}
                              {user.type === 'admin' && (
                                <span className="admin-badge">👑</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="table-cell">
                        <span className="user-email">{user.email}</span>
                      </div>
                      <div className="table-cell">
                        <span className={getRoleBadgeClass(user.type, user.role)}>
                          {user.displayRole}
                        </span>
                      </div>
                      <div className="table-cell">
                        <span className={getStatusBadgeClass(user.status || 'active')}>
                          {user.status || 'active'}
                        </span>
                      </div>
                      <div className="table-cell">
                        <span className="date-text">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                      <div className="table-cell">
                        <div className="action-buttons">
                          <button 
                            className="action-button secondary compact"
                            onClick={() => onEditAdmin && onEditAdmin(user)}
                            title="Edit User"
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-button danger compact"
                            onClick={() => onDeleteUser && onDeleteUser(user)}
                            title="Delete User"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="table-row">
                    <div className="table-cell" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                      <span style={{ color: '#94a3b8' }}>No users found for this company</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <div className="users-table-container">
      <div className="table-header">
        <div className="table-cell">User</div>
        <div className="table-cell">Company</div>
        <div className="table-cell">Role</div>
        <div className="table-cell">Status</div>
        <div className="table-cell">Created</div>
        <div className="table-cell">Actions</div>
      </div>
      
      {filteredCompanies.flatMap(company => 
        (companyAdmins[company.id] || []).map(user => (
          <div key={`${company.id}-${user.id}`} className="table-row">
            <div className="table-cell">
              <div className="user-info">
                <div className={`user-avatar ${user.type}`}>
                  {getUserInitials(user.name)}
                </div>
                <div className="user-details">
                  <span className="user-name">
                    {user.name || 'Unknown User'}
                    {user.type === 'admin' && (
                      <span className="admin-badge">👑</span>
                    )}
                  </span>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>
            </div>
            <div className="table-cell">
              <span className="company-name">{company.name}</span>
            </div>
            <div className="table-cell">
              <span className={getRoleBadgeClass(user.type, user.role)}>
                {user.displayRole}
              </span>
            </div>
            <div className="table-cell">
              <span className={getStatusBadgeClass(user.status || 'active')}>
                {user.status || 'active'}
              </span>
            </div>
            <div className="table-cell">
              <span className="date-text">
                {formatDate(user.createdAt)}
              </span>
            </div>
            <div className="table-cell">
              <div className="action-buttons">
                <button 
                  className="action-button secondary compact"
                  onClick={() => onEditAdmin && onEditAdmin(user)}
                  title="Edit User"
                >
                  ✏️
                </button>
                <button 
                  className="action-button danger compact"
                  onClick={() => onDeleteUser && onDeleteUser(user)}
                  title="Delete User"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Handle loading state
  if (!companies) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Loading companies and users...</p>
      </div>
    );
  }

  // Handle empty state
  if (companies.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏢</div>
        <h3>No Companies Found</h3>
        <p>There are no companies in the system yet.</p>
        <button 
          className="create-button"
          onClick={() => onCreateUser && onCreateUser()}
        >
          Create First Company
        </button>
      </div>
    );
  }

  return (
    <div className="users-management">
      {/* Header */}
      <div className="content-header">
        <div className="header-left">
          <div>
            <h2>Users Management</h2>
            <p>Manage company administrators and users</p>
          </div>
          
          {/* Search */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search users, companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="header-right">
          {/* View Toggle */}
          <div className="view-toggle">
            <button 
              className={`toggle-button ${viewMode === 'hierarchical' ? 'active' : ''}`}
              onClick={() => setViewMode('hierarchical')}
            >
              📋 Hierarchical
            </button>
            <button 
              className={`toggle-button ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              📊 Table
            </button>
          </div>
          
          {/* Expand Controls */}
          {viewMode === 'hierarchical' && (
            <div className="expand-controls">
              <button className="expand-button" onClick={expandAll}>
                Expand All
              </button>
              <button className="expand-button" onClick={collapseAll}>
                Collapse All
              </button>
            </div>
          )}
          


          {/* Create User Button */}
          <button 
            className="create-button"
            onClick={() => onCreateUser && onCreateUser()}
          >
            ➕ Add User
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="users-stats">
        <div className="stat-item">
          <span className="stat-number">{stats.totalCompanies}</span>
          <span className="stat-label">Companies</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.activeCompanies}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.totalUsers}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.totalAdmins}</span>
          <span className="stat-label">Admins</span>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'hierarchical' ? renderHierarchicalView() : renderTableView()}
    </div>
  );
};

export default SaasUsersManagement;