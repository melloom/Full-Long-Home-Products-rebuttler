import React, { useState } from 'react';

const EditAdminModal = ({ 
  isOpen, 
  isEdit, 
  companies, 
  formData, 
  showPassword,
  onFormChange, 
  onTogglePassword,
  onSubmit, 
  onCancel 
}) => {
  const [activeSection, setActiveSection] = useState('basic');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    onFormChange({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePermissionChange = (permission) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission];
    
    onFormChange({
      ...formData,
      permissions: newPermissions
    });
  };

  const availablePermissions = [
    { id: 'manage_users', label: 'Manage Users', icon: '👥', description: 'Create, edit, and delete users' },
    { id: 'manage_content', label: 'Manage Content', icon: '📝', description: 'Edit rebuttals, FAQs, and categories' },
    { id: 'view_analytics', label: 'View Analytics', icon: '📊', description: 'Access reports and analytics' },
    { id: 'manage_settings', label: 'Manage Settings', icon: '⚙️', description: 'Configure system settings' },
    { id: 'manage_billing', label: 'Manage Billing', icon: '💳', description: 'Handle billing and subscriptions' }
  ];

  const roleOptions = [
    { value: 'user', label: 'User', icon: '👤', description: 'Basic access level' },
    { value: 'admin', label: 'Company Admin', icon: '🛡️', description: 'Administrative privileges' },
    { value: 'super-admin', label: 'Super Admin', icon: '👑', description: 'Full system access' }
  ];

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'permissions', label: 'Permissions', icon: '🛡️' }
  ];

  return (
    <div className="edit-admin-modal-overlay" onClick={onCancel}>
      <div className="edit-admin-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-admin-modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-section">
              <div className="modal-main-icon">
                ✏️
              </div>
              <div className="modal-title-group">
                <h2>{isEdit ? 'Edit Administrator' : 'Create New User'}</h2>
                <p>Manage user information and permissions</p>
              </div>
            </div>
            <button 
              className="modal-close-btn"
              onClick={onCancel}
              aria-label="Close modal"
            >
              <span>✕</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="modal-nav-tabs">
          {sections.map(section => (
            <button
              key={section.id}
              className={`nav-tab ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="nav-tab-icon">{section.icon}</span>
              <span className="nav-tab-label">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="edit-admin-form">
          <div className="modal-body">
            {activeSection === 'basic' && (
              <div className="form-section">
                <div className="section-header">
                  <h3>👤 Basic Information</h3>
                  <p>Essential user details and identification</p>
                </div>
                
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="name">
                      <span className="label-icon">👤</span>
                      Full Name *
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter full name"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="email">
                      <span className="label-icon">📧</span>
                      Email Address *
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter email address"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="companyId">
                      <span className="label-icon">🏢</span>
                      Company *
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="companyId"
                        name="companyId"
                        value={formData.companyId}
                        onChange={handleInputChange}
                        required
                        className="form-select"
                      >
                        <option value="">Select company</option>
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="role">
                      <span className="label-icon">🛡️</span>
                      User Role *
                    </label>
                    <div className="role-selector">
                      {roleOptions.map(role => (
                        <div
                          key={role.value}
                          className={`role-option ${formData.role === role.value ? 'selected' : ''}`}
                          onClick={() => handleInputChange({ target: { name: 'role', value: role.value } })}
                        >
                          <div className="role-icon">{role.icon}</div>
                          <div className="role-info">
                            <div className="role-label">{role.label}</div>
                            <div className="role-description">{role.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="status-section">
                  <div className="status-toggle">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="toggle-input"
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-text">
                        <span className="toggle-icon">{formData.isActive ? '✅' : '❌'}</span>
                        {formData.isActive ? 'Active User' : 'Inactive User'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="form-section">
                <div className="section-header">
                  <h3>🔒 Security Settings</h3>
                  <p>Password and authentication configuration</p>
                </div>

                <div className="security-card">
                  <div className="form-field">
                    <label htmlFor="password">
                      <span className="label-icon">🔑</span>
                      Password {isEdit ? '(leave blank to keep current)' : '*'}
                    </label>
                    <div className="password-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!isEdit}
                        placeholder={isEdit ? "Enter new password to change" : "Enter password"}
                        className="form-input password-input"
                      />
                      <button
                        type="button"
                        onClick={onTogglePassword}
                        className="password-toggle"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="security-tips">
                    <div className="tips-header">
                      <span className="tips-icon">💡</span>
                      <span>Password Requirements</span>
                    </div>
                    <ul className="tips-list">
                      <li>At least 8 characters long</li>
                      <li>Include uppercase and lowercase letters</li>
                      <li>Include at least one number</li>
                      <li>Include at least one special character</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'permissions' && (
              <div className="form-section">
                <div className="section-header">
                  <h3>🛡️ Permissions & Access</h3>
                  <p>Configure what this user can access and modify</p>
                </div>

                {formData.role === 'admin' ? (
                  <div className="permissions-grid">
                    {availablePermissions.map(permission => (
                      <div
                        key={permission.id}
                        className={`permission-card ${formData.permissions.includes(permission.id) ? 'selected' : ''}`}
                        onClick={() => handlePermissionChange(permission.id)}
                      >
                        <div className="permission-header">
                          <span className="permission-icon">{permission.icon}</span>
                          <div className="permission-checkbox">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.id)}
                              onChange={() => handlePermissionChange(permission.id)}
                              className="checkbox-input"
                            />
                            <span className="checkbox-custom"></span>
                          </div>
                        </div>
                        <div className="permission-content">
                          <h4>{permission.label}</h4>
                          <p>{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="permissions-notice">
                    <div className="notice-icon">ℹ️</div>
                    <div className="notice-content">
                      <h4>Role-Based Permissions</h4>
                      <p>
                        {formData.role === 'super-admin' 
                          ? 'Super Administrators have full access to all features and settings.'
                          : 'Regular users have limited access based on their assigned role.'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="footer-actions">
              <button 
                type="button"
                className="btn-secondary"
                onClick={onCancel}
              >
                <span className="btn-icon">❌</span>
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary"
              >
                <span className="btn-icon">{isEdit ? '💾' : '➕'}</span>
                {isEdit ? 'Update Administrator' : 'Create User'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdminModal;