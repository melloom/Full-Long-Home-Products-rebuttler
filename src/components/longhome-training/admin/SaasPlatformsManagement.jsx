import React from 'react';

const SaasPlatformsManagement = ({ 
  platforms, 
  companies,
  selectedCompany,
  onCreatePlatform,
  onEditPlatform,
  onDeletePlatform
}) => {
  const filteredPlatforms = selectedCompany 
    ? platforms.filter(p => p.companyId === selectedCompany.id)
    : platforms;

  return (
    <div className="saas-content">
      <div className="content-header">
        <h2>
          {selectedCompany ? `${selectedCompany.name} - Platforms` : 'All Platforms'}
        </h2>
        <button 
          className="create-button"
          onClick={() => {
            onCreatePlatform();
            document.body.style.overflow = 'hidden';
          }}
        >
          + Create Platform
        </button>
      </div>
      
      <div className="platforms-grid">
        {filteredPlatforms.map(platform => {
          const company = companies.find(c => c.id === platform.companyId);
          return (
            <div key={platform.id} className="platform-card">
              <div className="platform-header">
                <h3>{platform.name}</h3>
                <span className={`status-badge ${platform.status || 'active'}`}>
                  {platform.status || 'active'}
                </span>
              </div>
              <div className="platform-details">
                <p><strong>Company:</strong> {company?.name || 'Unknown'}</p>
                <p><strong>Domain:</strong> <span className="domain-text">{platform.domain || 'Not set'}</span></p>
                <p><strong>Theme:</strong> {platform.theme || 'default'}</p>
                <p><strong>Created:</strong> {platform.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                <div className="features-container">
                  <div className="features-label">Features:</div>
                  <div className="features-list">
                    {(() => {
                      // Handle both array and object formats for features
                      let featuresToDisplay = [];
                      
                      if (platform.features) {
                        if (Array.isArray(platform.features)) {
                          // Convert array to object format
                          featuresToDisplay = platform.features.map(feature => [feature, true]);
                        } else if (typeof platform.features === 'object') {
                          // Use object format as-is
                          featuresToDisplay = Object.entries(platform.features);
                        }
                      }
                      
                      if (featuresToDisplay.length > 0) {
                        return featuresToDisplay.map(([feature, enabled]) => (
                          <span 
                            key={feature} 
                            className={`feature-item ${enabled ? 'enabled' : 'disabled'}`}
                          >
                            {feature} {enabled ? '✓' : '✗'}
                          </span>
                        ));
                      } else {
                        return <span className="feature-item disabled">No features configured</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>
              <div className="platform-actions">
                <button 
                  className="action-button primary"
                  onClick={() => onEditPlatform(platform)}
                >
                  Edit Platform
                </button>
                <button 
                  className="action-button danger"
                  onClick={() => onDeletePlatform(platform, 'platform')}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredPlatforms.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>No Platforms Found</h3>
          <p>
            {selectedCompany 
              ? `${selectedCompany.name} doesn't have any platforms yet.`
              : 'No platforms have been created yet.'
            }
          </p>
          <button 
            className="create-button"
            onClick={() => {
              onCreatePlatform();
              document.body.style.overflow = 'hidden';
            }}
          >
            Create First Platform
          </button>
        </div>
      )}
    </div>
  );
};

export default SaasPlatformsManagement;