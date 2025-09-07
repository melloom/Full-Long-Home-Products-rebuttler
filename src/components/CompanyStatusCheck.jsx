import React from 'react';
import './CompanyStatusCheck.css';

const CompanyStatusCheck = ({ company, children }) => {
  // If no company data, show children (let other error handling take care of it)
  if (!company) {
    return children;
  }

  // If company is active, show children
  if (company.status === 'active') {
    return children;
  }

  // If company is inactive or suspended, show status message
  const getStatusInfo = (status) => {
    switch (status) {
      case 'inactive':
        return {
          icon: '⏸️',
          title: 'Service Temporarily Unavailable',
          message: company.maintenanceMessage || 'This service is currently inactive. Please check back later.',
          color: 'yellow'
        };
      case 'suspended':
        return {
          icon: '🚫',
          title: 'Access Suspended',
          message: company.maintenanceMessage || 'Access to this service has been suspended. Please contact support for assistance.',
          color: 'red'
        };
      default:
        return {
          icon: '⚠️',
          title: 'Service Unavailable',
          message: 'This service is currently unavailable. Please check back later.',
          color: 'gray'
        };
    }
  };

  const statusInfo = getStatusInfo(company.status);

  return (
    <div className="company-status-check">
      <div className="status-container">
        <div className="status-content">
          <div className={`status-icon ${statusInfo.color}`}>
            {statusInfo.icon}
          </div>
          
          <h1 className="status-title">
            {statusInfo.title}
          </h1>
          
          <p className="status-message">
            {statusInfo.message}
          </p>
          
          <div className="status-details">
            <div className="status-info">
              <div className="info-item">
                <span className="info-label">Company:</span>
                <span className="info-value">{company.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className={`info-value status-${company.status}`}>
                  {company.status?.charAt(0).toUpperCase() + company.status?.slice(1)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="status-actions">
            <button 
              className="refresh-button"
              onClick={() => window.location.reload()}
            >
              🔄 Refresh Page
            </button>
            <button 
              className="contact-button"
              onClick={() => window.open('mailto:support@example.com', '_blank')}
            >
              📧 Contact Support
            </button>
          </div>
          
          <div className="status-footer">
            <p>We apologize for any inconvenience.</p>
            {company.status === 'suspended' && (
              <p className="suspended-note">
                If you believe this is an error, please contact our support team.
              </p>
            )}
          </div>
        </div>
        
        <div className="status-background">
          <div className="bg-shape shape-1"></div>
          <div className="bg-shape shape-2"></div>
          <div className="bg-shape shape-3"></div>
        </div>
      </div>
    </div>
  );
};

export default CompanyStatusCheck;