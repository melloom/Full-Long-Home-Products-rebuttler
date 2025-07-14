import React, { useState, useEffect } from 'react';

const PWAInstall = ({ onInstall, isCollapsed = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('Install prompt available');
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
      showInstallSuccess();
      
      // Request notification permission after installation
      setTimeout(() => {
        requestNotificationPermission();
      }, 1000);
    };

    // Try to trigger install prompt if conditions are met
    const checkInstallability = () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // Check if we meet the criteria for installation
        const hasManifest = document.querySelector('link[rel="manifest"]');
        const hasServiceWorker = navigator.serviceWorker.controller;
        
        if (hasManifest && hasServiceWorker) {
          console.log('App is installable');
          setIsInstallable(true);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check installability after a short delay
    setTimeout(checkInstallability, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          showNotification('CloseLoop Installed!', {
            body: 'You can now receive notifications for updates and new features.',
            icon: '/icons/icon-192x192.png'
          });
        }
      } catch (error) {
        console.log('Notification permission denied');
      }
    }
  };

  const showNotification = (title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const defaultOptions = {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        ...options
      };
      
      return new Notification(title, defaultOptions);
    }
  };

  const handleInstallClick = async () => {
    // Try multiple installation methods
    if (deferredPrompt) {
      try {
        // Method 1: Use the deferred prompt
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setIsInstalled(true);
          setIsInstallable(false);
          showInstallSuccess();
        } else {
          console.log('User dismissed the install prompt');
          handleManualInstall();
        }

        setDeferredPrompt(null);
        
        if (onInstall) {
          onInstall(outcome);
        }
        return;
      } catch (error) {
        console.error('Deferred prompt failed:', error);
      }
    }

    // Method 2: Try to trigger install prompt programmatically
    try {
      // Check if we can trigger the install prompt
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // Try to trigger the beforeinstallprompt event
        const installEvent = new Event('beforeinstallprompt');
        window.dispatchEvent(installEvent);
        
        // Wait a bit and try manual install if no prompt appears
        setTimeout(() => {
          if (!deferredPrompt) {
            handleManualInstall();
          }
        }, 1000);
      } else {
        handleManualInstall();
      }
    } catch (error) {
      console.error('Programmatic install failed:', error);
      handleManualInstall();
    }
  };

  const showInstallSuccess = () => {
    // Show a success notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('CloseLoop Installed!', {
        body: 'The app has been successfully installed on your device.',
        icon: '/icons/icon-192x192.png'
      });
    } else {
      alert('✅ CloseLoop has been successfully installed on your device!\n\nYou can now:\n• Use the app offline\n• Access it from your Start Menu/Home Screen\n• Enjoy faster loading times');
    }
  };

  const handleManualInstall = () => {
    // Detect the user's browser and device
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    let instructions = '📱 Install CloseLoop App\n\n';
    
    if (isMobile) {
      if (isIOS) {
        instructions += `📱 iPhone/iPad Installation:
1. Tap the share button (📤) in Safari
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to install the app

The app will appear on your home screen like a native app!`;
      } else {
        instructions += `📱 Android Installation:
1. Tap the menu (⋮) in Chrome
2. Tap "Install app" or "Add to Home screen"
3. Tap "Install" to confirm

The app will appear on your home screen!`;
      }
    } else {
      // Desktop instructions
      if (isChrome) {
        instructions += `💻 Chrome Desktop Installation:
1. Look for the install icon (📱) in the address bar
2. Click the install icon
3. Click "Install" in the popup

The app will install and appear in your Start Menu!`;
      } else if (isEdge) {
        instructions += `💻 Edge Desktop Installation:
1. Look for the install icon (📱) in the address bar
2. Click the install icon
3. Click "Install" in the popup

The app will install and appear in your Start Menu!`;
      } else if (isFirefox) {
        instructions += `💻 Firefox Desktop Installation:
1. Look for the install icon (📱) in the address bar
2. Click the install icon
3. Click "Install" in the popup

The app will install and appear in your Start Menu!`;
      } else {
        instructions += `💻 Desktop Installation:
• Chrome/Edge: Look for install icon (📱) in address bar
• Firefox: Look for install icon (📱) in address bar
• Safari: Not supported for PWA installation

The app will install and appear in your Start Menu!`;
      }
    }

    instructions += '\n\n✨ Once installed, the app will work offline and feel like a native app!';
    
    alert(instructions);
  };

  if (isInstalled) {
    return (
      <div className="pwa-installed" style={{ display: 'flex', alignItems: 'center', gap: '0.5em', background: '#22c55e', color: 'white', borderRadius: '8px', padding: isCollapsed ? '0.25em 0.75em' : '0.5em 1em', fontWeight: 600, fontSize: isCollapsed ? '0.95em' : '1.1em', justifyContent: 'center' }}>
        <span className="pwa-installed-icon" style={{ fontSize: isCollapsed ? '1.1em' : '1.2em' }}>✅</span>
        <span className="pwa-installed-text">Installed</span>
      </div>
    );
  }

  // Show loading state while checking installability
  if (!isInstallable && !isInstalled) {
    return (
      <button 
        className="pwa-loading"
        onClick={handleManualInstall}
        title="Install App"
      >
        <span className="pwa-icon">⏳</span>
        {!isCollapsed && <span className="pwa-text">Checking...</span>}
      </button>
    );
  }

  if (!isInstallable) {
    return (
      <button 
        className="pwa-manual-install"
        onClick={handleManualInstall}
        title="Install App"
      >
        <span className="pwa-icon">📱</span>
        {!isCollapsed && <span className="pwa-text">Install App</span>}
      </button>
    );
  }

  return (
    <button 
      className="pwa-install-button"
      onClick={handleInstallClick}
      title="Install CloseLoop App"
    >
      <span className="pwa-icon">⬇️</span>
      {!isCollapsed && <span className="pwa-text">Install App</span>}
    </button>
  );
};

export default PWAInstall; 