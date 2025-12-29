import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '../services/firebase/config';
import './MaintenanceMode.css';

const MaintenanceMode = () => {
  const [maintenanceData, setMaintenanceData] = useState({
    enabled: false,
    message: 'We are currently performing scheduled maintenance. Please check back soon.',
    updatedAt: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const db = getDb();
        const maintenanceRef = doc(db, 'system', 'maintenance');
        const maintenanceSnap = await getDoc(maintenanceRef);
        
        if (maintenanceSnap.exists()) {
          const data = maintenanceSnap.data();
          setMaintenanceData({
            enabled: data.enabled || false,
            message: data.message || 'We are currently performing scheduled maintenance. Please check back soon.',
            updatedAt: data.updatedAt
          });
        }
        setLoading(false);
      } catch (error) {
        // Silently handle permission errors - assume maintenance mode is disabled
        if (error.code === 'permission-denied') {
          setMaintenanceData({
            enabled: false,
            message: 'We are currently performing scheduled maintenance. Please check back soon.',
            updatedAt: null
          });
        } else {
          console.error('❌ Error checking maintenance mode:', error);
        }
        setLoading(false);
      }
    };

    checkMaintenanceMode();
  }, []);

  if (loading) {
    return (
      <div className="maintenance-container">
        <div className="maintenance-content">
          <div className="maintenance-spinner">
            <div className="spinner"></div>
            <p>Checking system status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!maintenanceData.enabled) {
    return null; // Don't show maintenance page if not enabled
  }

  return (
    <div className="maintenance-container">
      <div className="maintenance-content">
        <div className="maintenance-icon">
          🔧
        </div>
        
        <h1 className="maintenance-title">
          System Maintenance
        </h1>
        
        <p className="maintenance-message">
          {maintenanceData.message}
        </p>
        
        <div className="maintenance-details">
          <div className="maintenance-info">
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value maintenance">Under Maintenance</span>
            </div>
            {maintenanceData.updatedAt && (
              <div className="info-item">
                <span className="info-label">Started:</span>
                <span className="info-value">
                  {maintenanceData.updatedAt.toDate ? 
                    maintenanceData.updatedAt.toDate().toLocaleString() : 
                    'Recently'
                  }
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="maintenance-actions">
          <button 
            className="refresh-button"
            onClick={() => window.location.reload()}
          >
            🔄 Refresh Page
          </button>
        </div>
        
        <div className="maintenance-footer">
          <p>We apologize for any inconvenience. Please check back soon.</p>
          <p className="contact-info">
            For urgent matters, please contact support.
          </p>
        </div>
      </div>
      
      <div className="maintenance-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
    </div>
  );
};

export default MaintenanceMode;