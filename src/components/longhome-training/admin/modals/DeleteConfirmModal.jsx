import React from 'react';
import UniversalModal from './UniversalModal';

const DeleteConfirmModal = ({ 
  isOpen, 
  itemToDelete, 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen || !itemToDelete) return null;

  const { item, type } = itemToDelete;

  const getItemName = () => {
    if (type === 'company') return item.name;
    if (type === 'platform') return item.name;
    if (type === 'user') return item.name || item.email;
    return 'item';
  };

  const getItemType = () => {
    if (type === 'company') return 'company';
    if (type === 'platform') return 'platform';
    if (type === 'user') return 'user';
    return 'item';
  };

  const modalFooter = (
    <>
      <button 
        className="universal-modal-button secondary"
        onClick={onCancel}
      >
        Cancel
      </button>
      <button 
        className="universal-modal-button danger"
        onClick={onConfirm}
      >
        Delete {getItemType().charAt(0).toUpperCase() + getItemType().slice(1)}
      </button>
    </>
  );

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onCancel}
      title="⚠️ Confirm Deletion"
      footer={modalFooter}
      size="medium"
    >
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ 
          fontSize: '4rem', 
          marginBottom: '1rem',
          filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))'
        }}>
          ⚠️
        </div>
        
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#374151', 
          marginBottom: '1.5rem',
          lineHeight: '1.6'
        }}>
          Are you sure you want to delete this <strong>{getItemType()}</strong>? 
          <br />
          <span style={{ color: '#ef4444', fontWeight: '600' }}>
            This action cannot be undone.
          </span>
        </p>
        
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
          border: '2px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h4 style={{ 
            color: '#dc2626', 
            margin: '0 0 1rem 0',
            fontSize: '1.2rem',
            fontWeight: '700'
          }}>
            {getItemName()}
          </h4>
          
          {type === 'company' && (
            <div>
              <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '1rem' }}>
                ⚠️ This will also delete:
              </p>
              <ul style={{ 
                textAlign: 'left', 
                color: '#374151',
                margin: '0 0 1rem 0',
                paddingLeft: '1.5rem'
              }}>
                <li>All associated platforms</li>
                <li>All users in this company</li>
                <li>All training data and content</li>
              </ul>
              <p style={{ 
                color: '#059669', 
                fontWeight: '500',
                fontSize: '0.9rem',
                background: 'rgba(5, 150, 105, 0.1)',
                padding: '0.75rem',
                borderRadius: '8px',
                margin: 0
              }}>
                💾 A backup will be created before deletion for recovery purposes.
              </p>
            </div>
          )}
          
          {type === 'platform' && (
            <div>
              <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '1rem' }}>
                ⚠️ This will delete the entire platform including:
              </p>
              <ul style={{ 
                textAlign: 'left', 
                color: '#374151',
                margin: 0,
                paddingLeft: '1.5rem'
              }}>
                <li>All training content</li>
                <li>All user progress</li>
                <li>All platform settings</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </UniversalModal>
  );
};

export default DeleteConfirmModal;