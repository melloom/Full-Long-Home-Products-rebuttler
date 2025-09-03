import React from 'react';
import UniversalModal from './UniversalModal';

const PlatformModal = ({ 
  isOpen, 
  companies, 
  formData, 
  onFormChange, 
  onSubmit, 
  onCancel 
}) => {
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

  const handleFeatureChange = (feature) => {
    onFormChange({
      ...formData,
      features: {
        ...formData.features,
        [feature]: !formData.features[feature]
      }
    });
  };

  const modalFooter = (
    <>
      <button 
        type="button"
        className="universal-modal-button secondary"
        onClick={onCancel}
      >
        Cancel
      </button>
      <button 
        type="submit"
        className="universal-modal-button primary"
        onClick={handleSubmit}
      >
        Create Platform
      </button>
    </>
  );

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onCancel}
      title="🎯 Create New Platform"
      footer={modalFooter}
      size="large"
    >
      <form onSubmit={handleSubmit}>
        <div className="universal-form-group">
          <label htmlFor="name">Platform Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter platform name"
          />
        </div>
        
        <div className="universal-form-group">
          <label htmlFor="companyId">Company *</label>
          <select
            id="companyId"
            name="companyId"
            value={formData.companyId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select company</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="universal-form-group">
          <label htmlFor="domain">Domain</label>
          <input
            type="text"
            id="domain"
            name="domain"
            value={formData.domain}
            onChange={handleInputChange}
            placeholder="e.g., training.company.com"
          />
        </div>
        
        <div className="universal-form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            placeholder="Enter platform description"
          />
        </div>
        
        <div className="universal-form-group">
          <label htmlFor="theme">Theme</label>
          <select
            id="theme"
            name="theme"
            value={formData.theme}
            onChange={handleInputChange}
          >
            <option value="default">Default</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="corporate">Corporate</option>
          </select>
        </div>
        
        <div className="universal-form-group">
          <label>Features</label>
          <div className="universal-checkbox-group">
            {Object.entries(formData.features).map(([feature, enabled]) => (
              <label key={feature} className="universal-checkbox-label">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => handleFeatureChange(feature)}
                />
                <span>
                  {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}
                </span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="universal-form-group">
          <label htmlFor="primaryColor">Primary Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="color"
              id="primaryColor"
              name="primaryColor"
              value={formData.branding.primaryColor}
              onChange={(e) => onFormChange({
                ...formData,
                branding: {
                  ...formData.branding,
                  primaryColor: e.target.value
                }
              })}
              style={{
                width: '60px',
                height: '60px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                padding: '0'
              }}
            />
            <span style={{ 
              color: '#64748b', 
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              {formData.branding.primaryColor}
            </span>
          </div>
        </div>
      </form>
    </UniversalModal>
  );
};

export default PlatformModal;