import React, { useState } from 'react';
import { formatDate } from '../../../utils/companyDataUtils';

const RegistrationRequestsManagement = ({ 
  registrationRequests = [],
  onApproveRequest,
  onRejectRequest
}) => {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  const filteredRequests = registrationRequests.filter(request => {
    if (filterStatus === 'all') return true;
    return request.status === filterStatus;
  });

  const pendingCount = registrationRequests.filter(r => r.status === 'pending').length;
  const approvedCount = registrationRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = registrationRequests.filter(r => r.status === 'rejected').length;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-badge pending';
      case 'approved': return 'status-badge approved';
      case 'rejected': return 'status-badge rejected';
      default: return 'status-badge';
    }
  };

  return (
    <div className="saas-content">
      <div className="content-header">
        <h2>Registration Requests</h2>
          <div className="status-filter-tabs">
          <button 
            className={`status-filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({registrationRequests.length})
          </button>
          <button 
            className={`status-filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button 
            className={`status-filter-tab ${filterStatus === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('approved')}
          >
            Approved ({approvedCount})
          </button>
          <button 
            className={`status-filter-tab ${filterStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Registration Requests</h3>
          <p>
            {filterStatus === 'all' 
              ? "No registration requests have been submitted yet."
              : `No ${filterStatus} registration requests found.`}
          </p>
        </div>
      ) : (
        <div className="registration-requests-grid">
          {filteredRequests.map((request) => (
            <div key={request.id} className="registration-request-card">
              <div className="request-header">
                <div className="request-title-section">
                  <h3>{request.companyName}</h3>
                  <span className={getStatusBadgeClass(request.status)}>
                    {request.status}
                  </span>
                </div>
                {request.createdAt && (
                  <div className="request-date">
                    {formatDate(request.createdAt)}
                  </div>
                )}
              </div>

              <div className="request-details">
                <div className="detail-row">
                  <span className="detail-label">👤 Owner/Admin:</span>
                  <span className="detail-value">{request.ownerName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📧 Email:</span>
                  <span className="detail-value">{request.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">💎 Plan:</span>
                  <span className="detail-value capitalize">{request.plan || 'starter'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🔗 Slug:</span>
                  <span className="detail-value code">{request.slug}</span>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button
                    className="action-button approve"
                    onClick={() => onApproveRequest(request)}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="action-button reject"
                    onClick={() => onRejectRequest(request)}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}

              {request.status === 'approved' && (
                <div className="request-approved-note">
                  ✓ This request has been approved and the company account has been created.
                </div>
              )}

              {request.status === 'rejected' && (
                <div className="request-rejected-note">
                  ✗ This request has been rejected.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegistrationRequestsManagement;

