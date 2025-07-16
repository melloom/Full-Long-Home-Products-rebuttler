// PWA Service Worker Registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('Registering service worker...');
      
      // Check if we're in production
      const isProduction = window.location.hostname !== 'localhost' && 
                          window.location.hostname !== '127.0.0.1';
      
      console.log('Environment:', isProduction ? 'Production' : 'Development');
      console.log('Current URL:', window.location.href);
      
      // In development, service workers might not work properly
      if (!isProduction) {
        console.log('Development mode detected - service worker registration may be limited');
      }
      
      // Check if service worker is already registered
      const existingRegistration = await navigator.serviceWorker.getRegistration();
      if (existingRegistration) {
        console.log('Service worker already registered:', existingRegistration);
        return existingRegistration;
      }
      
      // Check if service worker file exists
      try {
        const swResponse = await fetch('/sw.js', { method: 'HEAD' });
        if (!swResponse.ok) {
          throw new Error(`Service worker file not found: ${swResponse.status} ${swResponse.statusText}`);
        }
      } catch (fetchError) {
        console.warn('Could not check service worker file:', fetchError.message);
        // Continue anyway - the registration might still work
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Don't cache the service worker itself
      });
      
      console.log('SW registered successfully:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        console.log('Service worker update found');
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          console.log('Service worker state changed:', newWorker.state);
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, show update notification
            console.log('New service worker installed, showing update notification');
            showUpdateNotification(registration);
          }
        });
      });
      
      // Handle service worker errors
      registration.addEventListener('error', (error) => {
        console.error('Service worker registration error:', error);
      });
      
      return registration;
    } catch (error) {
      console.error('SW registration failed:', error);
      
      // Log specific error details
      if (error.name === 'SecurityError') {
        console.error('Security error - service worker must be served over HTTPS in production');
      } else if (error.name === 'NetworkError') {
        console.error('Network error - service worker file not found');
      } else if (error.name === 'TypeError') {
        console.error('Type error - service worker script has syntax errors');
        console.error('Error details:', error.message);
      } else if (error.name === 'InvalidStateError') {
        console.error('Invalid state error - service worker already registered');
      }
      
      // Try to get more details about the error
      if (error.message) {
        console.error('Error message:', error.message);
      }
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      
      throw error; // Re-throw the error so it can be handled by the caller
    }
  } else {
    console.log('Service Worker not supported in this browser');
  }
};

// Show update notification
const showUpdateNotification = (registration) => {
  if (confirm('New version available! Reload to update?')) {
    console.log('User accepted update, skipping waiting and reloading');
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  } else {
    console.log('User dismissed update notification');
  }
};

// Handle service worker updates
export const handleServiceWorkerUpdates = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New service worker activated');
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Message from service worker:', event.data);
      if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('Skipping waiting and reloading');
        window.location.reload();
      }
    });
    
    // Handle service worker errors
    navigator.serviceWorker.addEventListener('error', (error) => {
      console.error('Service worker error:', error);
    });
  }
};

// Check if app is installed
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
};

// Check if app is installable
export const isAppInstallable = () => {
  return 'serviceWorker' in navigator && 
         'PushManager' in window &&
         !isAppInstalled();
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  return false;
};

// Show notification
export const showNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const defaultOptions = {
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      vibrate: [100, 50, 100],
      ...options
    };
    
    try {
      return new Notification(title, defaultOptions);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
};

// Check service worker status
export const checkServiceWorkerStatus = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log('Service worker registration found:', registration);
        console.log('Service worker state:', registration.active ? 'active' : 'inactive');
        return {
          registered: true,
          active: !!registration.active,
          waiting: !!registration.waiting,
          installing: !!registration.installing
        };
      } else {
        console.log('No service worker registration found');
        return { registered: false };
      }
    } catch (error) {
      console.error('Error checking service worker status:', error);
      return { registered: false, error: error.message };
    }
  }
  return { registered: false, supported: false };
}; 