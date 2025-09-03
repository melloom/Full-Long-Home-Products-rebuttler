import React, { useState } from 'react';
import UniversalModal from './UniversalModal';

const UserModal = ({ 
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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

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
    { key: 'manage_users', label: 'Manage Users', icon: '👥', description: 'Create, edit, and delete user accounts' },
    { key: 'manage_content', label: 'Manage Content', icon: '📝', description: 'Create and edit rebuttals and content' },
    { key: 'view_analytics', label: 'View Analytics', icon: '📊', description: 'Access reports and analytics data' },
    { key: 'manage_settings', label: 'Manage Settings', icon: '⚙️', description: 'Configure system and company settings' },
    { key: 'manage_billing', label: 'Manage Billing', icon: '💳', description: 'Handle billing and subscription management' }
  ];

  const roleDescriptions = {
    'user': { icon: '👤', desc: 'Basic access level' },
    'admin': { icon: '🛡️', desc: 'Administrative privileges' },
    'super-admin': { icon: '👑', desc: 'Full system access' }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.email && (isEdit || formData.password);
      case 2:
        return formData.role && formData.companyId;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="user-modal-steps">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div 
          key={i + 1} 
          className={`step ${currentStep >= i + 1 ? 'active' : ''} ${currentStep === i + 1 ? 'current' : ''}`}
        >
          <div className="step-number">{i + 1}</div>
          <div className="step-label">
            {i === 0 && 'Basic Info'}
            {i === 1 && 'Role & Company'}
            {i === 2 && 'Permissions'}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="user-modal-step">
      <div className="step-header">
        <div className="step-icon">👤</div>
        <div className="step-title">
          <h3>Basic Information</h3>
          <p>Enter the user's personal details and login credentials</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="name">
            <span className="label-icon">📝</span>
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="e.g., John Smith"
            className="modern-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">
            <span className="label-icon">📧</span>
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="e.g., john.smith@company.com"
            className="modern-input"
          />
        </div>
        
        <div className="form-group password-group">
          <label htmlFor="password">
            <span className="label-icon">🔒</span>
            Password {isEdit ? '(leave blank to keep current)' : '*'}
          </label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!isEdit}
              placeholder="Enter a secure password"
              className="modern-input password-input"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="password-toggle"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <div className="password-hint">
            Password should be at least 8 characters long
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="user-modal-step">
      <div className="step-header">
        <div className="step-icon">🏢</div>
        <div className="step-title">
          <h3>Role & Company Assignment</h3>
          <p>Define the user's role and company association</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="role">
            <span className="label-icon">🎭</span>
            User Role *
          </label>
          <div className="role-selector">
            {Object.entries(roleDescriptions).map(([role, { icon, desc }]) => (
              <label key={role} className={`role-option ${formData.role === role ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={formData.role === role}
                  onChange={handleInputChange}
                />
                <div className="role-content">
                  <div className="role-header">
                    <span className="role-icon">{icon}</span>
                    <span className="role-name">
                      {role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </div>
                  <div className="role-description">{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="companyId">
            <span className="label-icon">🏢</span>
            Company *
          </label>
          <select
            id="companyId"
            name="companyId"
            value={formData.companyId}
            onChange={handleInputChange}
            required
            className="modern-select"
          >
            <option value="">Select a company...</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group status-group">
          <div className="status-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <span className="toggle-icon">{formData.isActive ? '✅' : '⏸️'}</span>
                <div>
                  <div className="toggle-title">
                    {formData.isActive ? 'Active User' : 'Inactive User'}
                  </div>
                  <div className="toggle-description">
                    {formData.isActive ? 'User can log in and access the system' : 'User cannot log in or access the system'}
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="user-modal-step">
      <div className="step-header">
        <div className="step-icon">🔐</div>
        <div className="step-title">
          <h3>Permissions & Access Control</h3>
          <p>Configure specific permissions for this user</p>
        </div>
      </div>

      {formData.role === 'admin' ? (
        <div className="permissions-grid">
          {availablePermissions.map(permission => (
            <div key={permission.key} className="permission-card">
              <label className="permission-label">
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(permission.key)}
                  onChange={() => handlePermissionChange(permission.key)}
                />
                <div className="permission-content">
                  <div className="permission-header">
                    <span className="permission-icon">{permission.icon}</span>
                    <span className="permission-name">{permission.label}</span>
                  </div>
                  <div className="permission-description">{permission.description}</div>
                </div>
                <div className="permission-checkbox">
                  <div className="checkbox-indicator">
                    {formData.permissions.includes(permission.key) && '✓'}
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className="permissions-info">
          <div className="info-card">
            <div className="info-icon">ℹ️</div>
            <div className="info-content">
              <h4>Default Permissions</h4>
              <p>
                {formData.role === 'super-admin' 
                  ? 'Super admins have full access to all system features and capabilities.'
                  : 'Regular users have access to basic features based on their company settings.'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const modalFooter = (
    <div className="user-modal-footer">
      <div className="footer-left">
        {currentStep > 1 && (
          <button 
            type="button"
            className="modal-button secondary"
            onClick={prevStep}
          >
            ← Previous
          </button>
        )}
      </div>
      
      <div className="footer-right">
        <button 
          type="button"
          className="modal-button tertiary"
          onClick={onCancel}
        >
          Cancel
        </button>
        
        {currentStep < totalSteps ? (
          <button 
            type="button"
            className="modal-button primary"
            onClick={nextStep}
            disabled={!canProceed()}
          >
            Next →
          </button>
        ) : (
          <button 
            type="submit"
            className="modal-button success"
            onClick={handleSubmit}
            disabled={!canProceed()}
          >
            {isEdit ? '✅ Update User' : '🎉 Create User'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onCancel}
      title={isEdit ? '✏️ Edit User' : '👤 Create New User'}
      footer={modalFooter}
      size="extra-large"
      className="user-modal-redesigned"
    >
      <div className="user-modal-content">
        {!isEdit && renderStepIndicator()}
        
        <form onSubmit={handleSubmit} className="user-form">
          {(isEdit || currentStep === 1) && renderStep1()}
          {(isEdit || currentStep === 2) && renderStep2()}
          {(isEdit || currentStep === 3) && renderStep3()}
        </form>
      </div>
    </UniversalModal>
  );
};

export default UserModal;