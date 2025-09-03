import React, { useEffect } from 'react';

const UniversalModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'medium',
  className = ''
}) => {
  useEffect(() => {
    if (isOpen) {
      // Add modal-open class to body to blur background
      document.body.classList.add('modal-open');
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Remove modal-open class from body
      document.body.classList.remove('modal-open');
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'universal-modal-small';
      case 'large': return 'universal-modal-large';
      case 'extra-large': return 'universal-modal-extra-large';
      default: return 'universal-modal-medium';
    }
  };

  return (
    <div className="universal-modal-overlay" onClick={onClose}>
      <div 
        className={`universal-modal-container ${getSizeClass()} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="universal-modal-header">
          <div className="universal-modal-title">
            <h2>{title}</h2>
          </div>
          <button 
            className="universal-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        <div className="universal-modal-body">
          {children}
        </div>
        
        {footer && (
          <div className="universal-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalModal;