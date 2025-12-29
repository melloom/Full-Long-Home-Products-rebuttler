import React, { useState } from 'react';

const CompanyModal = ({ 
  isOpen, 
  isEdit, 
  company, 
  formData, 
  onFormChange, 
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
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };
    console.log('🔍 Form change:', name, '=', type === 'checkbox' ? checked : value);
    console.log('🔍 New form data:', newFormData);
    onFormChange(newFormData);
  };

  const sections = [
    { id: 'basic', label: 'Company Details', icon: '🏢', description: 'Basic information' },
    { id: 'settings', label: 'Configuration', icon: '⚙️', description: 'Settings & status' }
  ];

  const industryOptions = [
    { value: 'Technology', label: 'Technology' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Education', label: 'Education' },
    { value: 'Real Estate', label: 'Real Estate' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Home Improvement', label: 'Home Improvement' },
    { value: 'Other', label: 'Other' }
  ];

  const planOptions = [
    { 
      value: 'starter', 
      label: 'Starter', 
      price: '$99/month', 
      description: 'Perfect for small teams getting started',
      features: ['Up to 10 users', 'Basic features', 'Email support'],
      icon: '⭐'
    },
    { 
      value: 'professional', 
      label: 'Professional', 
      price: '$199/month', 
      description: 'Advanced features for growing businesses',
      features: ['Up to 50 users', 'Advanced analytics', 'Priority support'],
      icon: '🚀'
    },
    { 
      value: 'enterprise', 
      label: 'Enterprise', 
      price: '$399/month', 
      description: 'Full features for large organizations',
      features: ['Unlimited users', 'Custom integrations', '24/7 support'],
      icon: '💎'
    }
  ];

  return (
    <div className="edit-admin-modal-overlay" onClick={onCancel}>
      <div className="edit-admin-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-admin-modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-section">
              <div className="modal-main-icon">
                {isEdit ? '✏️' : '🏢'}
              </div>
              <div className="modal-title-group">
                <h2>{isEdit ? 'Edit Company' : 'Create New Company'}</h2>
                <p>Manage company information and settings</p>
                {isEdit && company && (
                  <div className="company-status-badge">
                    <span className={`status-indicator ${formData.status || 'active'}`}></span>
                    <span className="status-text">{formData.status || 'active'}</span>
                  </div>
                )}
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
              <div className="nav-tab-content">
                <span className="nav-tab-icon">{section.icon}</span>
                <div className="nav-tab-text">
                  <span className="nav-tab-label">{section.label}</span>
                  <span className="nav-tab-description">{section.description}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="edit-admin-form">
          <div className="modal-body">
            {activeSection === 'basic' && (
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">🏢</div>
                  <h3>Company Information</h3>
                  <p>Essential company details and identification</p>
                </div>
                
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="name">
                      <span className="label-icon">🏢</span>
                      <span className="label-text">Company Name</span>
                      <span className="required-indicator">*</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter company name"
                        className="form-input"
                      />
                      <div className="input-icon">🏢</div>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="email">
                      <span className="label-icon">📧</span>
                      <span className="label-text">Contact Email</span>
                      <span className="required-indicator">*</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter contact email"
                        className="form-input"
                      />
                      <div className="input-icon">📧</div>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="industry">
                      <span className="label-icon">🏭</span>
                      <span className="label-text">Industry</span>
                    </label>
                    <div className="input-wrapper">
                      <select
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        <option value="">Select industry</option>
                        {industryOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="input-icon">🏭</div>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="plan">
                      <span className="label-icon">💎</span>
                      <span className="label-text">Subscription Plan</span>
                    </label>
                    <div className="plan-selector">
                      {planOptions.map(option => (
                        <div
                          key={option.value}
                          className={`plan-option ${formData.plan === option.value ? 'selected' : ''}`}
                          onClick={() => handleInputChange({ target: { name: 'plan', value: option.value } })}
                        >
                          <div className="plan-header">
                            <span className="plan-icon">{option.icon}</span>
                            <div className="plan-info">
                              <span className="plan-label">{option.label}</span>
                              <span className="plan-price">{option.price}</span>
                            </div>
                            <div className="plan-radio">
                              <input
                                type="radio"
                                name="plan"
                                value={option.value}
                                checked={formData.plan === option.value}
                                onChange={handleInputChange}
                                className="radio-input"
                              />
                              <span className="radio-custom"></span>
                            </div>
                          </div>
                          <p className="plan-description">{option.description}</p>
                          <ul className="plan-features">
                            {option.features.map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">⚙️</div>
                  <h3>Company Settings</h3>
                  <p>Configure company status and maintenance options</p>
                </div>
                
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="status">
                      <span className="label-icon">📊</span>
                      <span className="label-text">Company Status</span>
                    </label>
                    <div className="status-selector">
                      {[
                        { value: 'active', label: 'Active', icon: '✅', color: 'green', description: 'Company is fully operational' },
                        { value: 'inactive', label: 'Inactive', icon: '⏸️', color: 'yellow', description: 'Company is temporarily disabled' },
                        { value: 'suspended', label: 'Suspended', icon: '🚫', color: 'red', description: 'Company access is suspended' }
                      ].map(status => (
                        <div
                          key={status.value}
                          className={`status-option ${formData.status === status.value ? 'selected' : ''} ${status.color}`}
                          onClick={() => handleInputChange({ target: { name: 'status', value: status.value } })}
                        >
                          <div className="status-header">
                            <span className="status-icon">{status.icon}</span>
                            <div className="status-info">
                              <span className="status-label">{status.label}</span>
                              <span className="status-description">{status.description}</span>
                            </div>
                            <div className="status-radio">
                              <input
                                type="radio"
                                name="status"
                                value={status.value}
                                checked={formData.status === status.value}
                                onChange={handleInputChange}
                                className="radio-input"
                              />
                              <span className="radio-custom"></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-field full-width">
                    <div className="maintenance-section">
                      <div className="maintenance-header">
                        <span className="maintenance-icon">🔧</span>
                        <div className="maintenance-info">
                          <h4>Maintenance Mode</h4>
                          <p>Control company access during maintenance periods</p>
                        </div>
                      </div>
                      
                      <div className="checkbox-field">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            name="maintenanceMode"
                            checked={formData.maintenanceMode}
                            onChange={handleInputChange}
                            className="checkbox-input"
                          />
                          <span className="checkbox-custom"></span>
                          <div className="checkbox-content">
                            <span className="checkbox-title">Enable Maintenance Mode</span>
                            <span className="checkbox-description">Temporarily disable company access for maintenance</span>
                          </div>
                        </label>
                      </div>

                      {formData.maintenanceMode && (
                        <div className="maintenance-message-field">
                          <label htmlFor="maintenanceMessage">
                            <span className="label-icon">📝</span>
                            <span className="label-text">Maintenance Message</span>
                          </label>
                          <div className="input-wrapper">
                            <textarea
                              id="maintenanceMessage"
                              name="maintenanceMessage"
                              value={formData.maintenanceMessage}
                              onChange={handleInputChange}
                              rows="3"
                              placeholder="Enter maintenance message for users"
                              className="form-textarea"
                            />
                            <div className="input-icon">📝</div>
                          </div>
                          <div className="field-help">
                            <span className="help-icon">💡</span>
                            <span className="help-text">This message will be displayed to users when they try to access the company platform</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="footer-actions">
              <button 
                type="button"
                className="modal-btn secondary"
                onClick={onCancel}
              >
                <span className="btn-icon">❌</span>
                <span className="btn-text">Cancel</span>
              </button>
              <button 
                type="submit"
                className="modal-btn primary"
              >
                <span className="btn-icon">{isEdit ? '💾' : '✨'}</span>
                <span className="btn-text">{isEdit ? 'Update Company' : 'Create Company'}</span>
              </button>
            </div>
            {isEdit && (
              <div className="footer-info">
                <span className="info-icon">ℹ️</span>
                <span className="info-text">Changes will be applied immediately</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyModal;