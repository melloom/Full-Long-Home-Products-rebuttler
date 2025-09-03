import React from 'react';

const SaasDeletedCompanies = ({ 
  deletedCompanies, 
  onRestoreCompany 
}) => {
  return (
    <div className="saas-content">
      <div className="content-header">
        <h2>Deleted Companies</h2>
        <div className="header-info">
          <p>Companies that have been deleted but can be restored from backup</p>
        </div>
      </div>
      
      {deletedCompanies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗑️</div>
          <h3>No Deleted Companies</h3>
          <p>No companies have been deleted yet. All deleted companies will appear here with the option to restore them.</p>
        </div>
      ) : (
        <div className="deleted-companies-grid">
          {deletedCompanies.map(backup => (
            <div key={backup.id} className="deleted-company-card">
              <div className="company-header">
                <h3>{backup.name}</h3>
                <span className="deleted-badge">Deleted</span>
              </div>
              <div className="company-details">
                <p><strong>Email:</strong> {backup.email}</p>
                <p><strong>Industry:</strong> {backup.industry}</p>
                <p><strong>Plan:</strong> {backup.plan}</p>
                <p><strong>Deleted:</strong> {backup.deletedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                <p><strong>Original ID:</strong> {backup.originalId}</p>
              </div>
              <div className="company-actions">
                <button 
                  className="action-button success"
                  onClick={() => onRestoreCompany(backup.id)}
                >
                  Restore Company
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SaasDeletedCompanies;