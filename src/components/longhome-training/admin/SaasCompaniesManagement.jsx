import React, { useState } from 'react';
import { copyToClipboard } from '../../../utils/saasAdminUtils';

const SaasCompaniesManagement = ({ 
  companies, 
  companyAdmins, 
  expandedCompanies,
  onToggleExpansion,
  onViewPlatforms,
  onEditCompany,
  onToggleStatus,
  onDeleteCompany,
  onCreateCompany
}) => {
  const [expandedInfo, setExpandedInfo] = useState({});

  const toggleInfoExpansion = (companyId, field) => {
    const key = `${companyId}-${field}`;
    console.log('Toggling expansion for:', key);
    setExpandedInfo(prev => {
      const newState = {
        ...prev,
        [key]: !prev[key]
      };
      console.log('New expanded state:', newState);
      return newState;
    });
  };
  return (
    <div className="saas-content">
      <div className="content-header">
        <h2>Companies</h2>
        <button 
          className="create-button"
          onClick={() => {
            onCreateCompany();
            document.body.style.overflow = 'hidden';
          }}
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
              {/* Modern Company Information Grid */}
              <div className="company-info-grid">
                <div 
                  className={`info-card clickable-info ${expandedInfo[`${company.id}-email`] ? 'expanded' : ''}`}
                  onClick={() => toggleInfoExpansion(company.id, 'email')}
                >
                  <div className="info-icon">📧</div>
                  <div className="info-content">
                    <div className="info-label">Contact</div>
                    <div className="info-value">
                      {company.email || 'Not specified'}
                    </div>
                    {expandedInfo[`${company.id}-email`] && (
                      <div className="info-expanded">
                        <div className="expanded-content">
                          <strong>Full Email:</strong> {company.email || 'Not specified'}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="expand-icon">🔍</div>
                </div>
                
                <div 
                  className={`info-card clickable-info ${expandedInfo[`${company.id}-industry`] ? 'expanded' : ''}`}
                  onClick={() => toggleInfoExpansion(company.id, 'industry')}
                >
                  <div className="info-icon">🏢</div>
                  <div className="info-content">
                    <div className="info-label">Sector</div>
                    <div className="info-value">
                      {company.industry || 'General'}
                    </div>
                    {expandedInfo[`${company.id}-industry`] && (
                      <div className="info-expanded">
                        <div className="expanded-content">
                          <strong>Industry Details:</strong> {company.industry || 'General'}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="expand-icon">🔍</div>
                </div>
                
                <div 
                  className={`info-card clickable-info ${expandedInfo[`${company.id}-plan`] ? 'expanded' : ''}`}
                  onClick={() => toggleInfoExpansion(company.id, 'plan')}
                >
                  <div className="info-icon">💎</div>
                  <div className="info-content">
                    <div className="info-label">Tier</div>
                    <div className="info-value">
                      {company.plan || 'Standard'}
                    </div>
                    {expandedInfo[`${company.id}-plan`] && (
                      <div className="info-expanded">
                        <div className="expanded-content">
                          <strong>Plan Details:</strong> {company.plan || 'Standard'}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="expand-icon">🔍</div>
                </div>
                
                <div 
                  className={`info-card clickable-info ${expandedInfo[`${company.id}-date`] ? 'expanded' : ''}`}
                  onClick={() => toggleInfoExpansion(company.id, 'date')}
                >
                  <div className="info-icon">📅</div>
                  <div className="info-content">
                    <div className="info-label">Joined</div>
                    <div className="info-value">
                      {company.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </div>
                    {expandedInfo[`${company.id}-date`] && (
                      <div className="info-expanded">
                        <div className="expanded-content">
                          <strong>Join Date:</strong> {company.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                          <br />
                          <strong>Account Age:</strong> {company.createdAt ? 
                            Math.floor((new Date() - company.createdAt.toDate()) / (1000 * 60 * 60 * 24)) + ' days' : 
                            'Unknown'
                          }
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="expand-icon">🔍</div>
                </div>
              </div>
              
              <div className="url-section">
                <span className="detail-label">Public URL</span>
                <div className="url-container">
                  {(() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    const slugOrId = company.slug || company.id;
                    const url = `${origin}/company/${slugOrId}`;
                    return (
                      <>
                        <input
                          value={url}
                          readOnly
                          className="url-input"
                          title={url}
                        />
                        <button
                          className="action-button primary"
                          onClick={() => copyToClipboard(url)}
                        >
                          📋 Copy
                        </button>
                        <button
                          className="action-button secondary"
                          onClick={() => {
                            // For Long Home Products, go to admin dashboard with impersonation
                            if (company.slug === 'long-home' || company.id === 'long-home') {
                              // Set impersonation data
                              localStorage.setItem('impersonation', JSON.stringify({ 
                                enabled: true, 
                                companyId: company.id 
                              }));
                              window.open(`/admin/dashboard?impersonate=${company.id}`, '_blank');
                            } else {
                              window.open(url, '_blank');
                            }
                          }}
                        >
                          {company.slug === 'long-home' || company.id === 'long-home' ? '🚀 Visit Admin Dashboard' : '🚀 Visit Training'}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            <div className="company-actions">
              <button 
                className="action-button primary"
                onClick={() => onViewPlatforms(company)}
              >
                🎯 View Platforms
              </button>
              <button 
                className="action-button secondary"
                onClick={() => onEditCompany(company)}
              >
                ✏️ Edit
              </button>
              <button 
                className="action-button warning"
                onClick={() => onToggleStatus(company)}
              >
                {company.status === 'active' ? '⏸️ Disable' : '▶️ Enable'}
              </button>
              <button 
                className="action-button danger"
                onClick={() => onDeleteCompany(company, 'company')}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SaasCompaniesManagement;