import React, { useState, useEffect } from 'react';
import { checkServiceWorkerStatus } from '../utils/pwa';

const PWAStatus = ({ isCollapsed = false }) => {
  const [pwaStatus, setPwaStatus] = useState({
    isInstalled: false,
    isStandalone: false,
    hasServiceWorker: false,
    isOnline: navigator.onLine,
    cacheSize: '0 MB',
    swRegistered: false,
    swActive: false,
    swError: null
  });

  useEffect(() => {
    const checkPWAStatus = async () => {
      const status = {
        isInstalled: window.matchMedia('(display-mode: standalone)').matches || 
                    window.navigator.standalone === true,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        hasServiceWorker: 'serviceWorker' in navigator && navigator.serviceWorker.controller,
        isOnline: navigator.onLine
      };

      // Check service worker status
      try {
        const swStatus = await checkServiceWorkerStatus();
        status.swRegistered = swStatus.registered;
        status.swActive = swStatus.active;
        status.swError = swStatus.error;
      } catch (error) {
        status.swError = error.message;
      }

      // Check cache size if possible
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          let totalSize = 0;
          
          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            totalSize += keys.length; // Rough estimate
          }
          
          status.cacheSize = `${Math.round(totalSize / 10)} MB`;
        } catch (error) {
          status.cacheSize = 'Unknown';
        }
      }

      setPwaStatus(status);
    };

    checkPWAStatus();

    // Listen for online/offline changes
    const handleOnlineStatus = () => {
      setPwaStatus(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const getStatusIcon = () => {
    if (pwaStatus.isInstalled) return '✅';
    if (pwaStatus.swActive) return '⚡';
    if (pwaStatus.swRegistered) return '🔄';
    if (pwaStatus.swError) return '❌';
    return '📱';
  };

  const getStatusText = () => {
    if (pwaStatus.isInstalled) return 'App Installed';
    if (pwaStatus.swActive) return 'SW Active';
    if (pwaStatus.swRegistered) return 'SW Registered';
    if (pwaStatus.swError) return 'SW Error';
    return 'Install Available';
  };

  const getStatusColor = () => {
    if (pwaStatus.isInstalled) return '#10B981'; // Green
    if (pwaStatus.swActive) return '#3B82F6'; // Blue
    if (pwaStatus.swRegistered) return '#F59E0B'; // Yellow
    if (pwaStatus.swError) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const handleRefresh = async () => {
    console.log('Refreshing PWA status...');
    const swStatus = await checkServiceWorkerStatus();
    console.log('Updated SW Status:', swStatus);
    
    // Force a page reload to re-register service worker
    if (swStatus.error) {
      console.log('Service worker error detected, reloading page...');
      window.location.reload();
    }
  };

  // Center icon when collapsed
  if (isCollapsed) {
    return (
      <div className="pwa-status-collapsed-center" style={{ color: getStatusColor() }}>
        <span className="pwa-status-icon" style={{ fontSize: '2rem', display: 'block', textAlign: 'center' }}>{getStatusIcon()}</span>
      </div>
    );
  }

  return (
    <div className="pwa-status" style={{ color: getStatusColor() }}>
      <span className="pwa-status-icon">{getStatusIcon()}</span>
      {!isCollapsed && <span className="pwa-status-text">{getStatusText()}</span>}
      
      {/* Show additional info on hover */}
      <div className="pwa-status-tooltip">
        <div className="tooltip-content">
          <h4>PWA Status</h4>
          <ul>
            <li>Installed: {pwaStatus.isInstalled ? 'Yes' : 'No'}</li>
            <li>Standalone: {pwaStatus.isStandalone ? 'Yes' : 'No'}</li>
            <li>Service Worker: {pwaStatus.swActive ? 'Active' : pwaStatus.swRegistered ? 'Registered' : 'Inactive'}</li>
            <li>Online: {pwaStatus.isOnline ? 'Yes' : 'No'}</li>
            <li>Cache: {pwaStatus.cacheSize}</li>
            {pwaStatus.swError && <li style={{color: 'red'}}>Error: {pwaStatus.swError}</li>}
          </ul>
          <button 
            onClick={handleRefresh}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAStatus; 