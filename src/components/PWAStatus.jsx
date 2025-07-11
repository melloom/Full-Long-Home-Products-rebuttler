import React, { useState, useEffect } from 'react';

const PWAStatus = ({ isCollapsed = false }) => {
  const [pwaStatus, setPwaStatus] = useState({
    isInstalled: false,
    isStandalone: false,
    hasServiceWorker: false,
    isOnline: navigator.onLine,
    cacheSize: '0 MB'
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
    if (pwaStatus.hasServiceWorker) return '⚡';
    return '📱';
  };

  const getStatusText = () => {
    if (pwaStatus.isInstalled) return 'App Installed';
    if (pwaStatus.hasServiceWorker) return 'Ready to Install';
    return 'Install Available';
  };

  const getStatusColor = () => {
    if (pwaStatus.isInstalled) return '#10B981'; // Green
    if (pwaStatus.hasServiceWorker) return '#3B82F6'; // Blue
    return '#6B7280'; // Gray
  };

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
            <li>Service Worker: {pwaStatus.hasServiceWorker ? 'Active' : 'Inactive'}</li>
            <li>Online: {pwaStatus.isOnline ? 'Yes' : 'No'}</li>
            <li>Cache: {pwaStatus.cacheSize}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PWAStatus; 