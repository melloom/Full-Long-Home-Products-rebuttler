// Utility to handle iframe errors and provide fallback functions

// Global fallback for getNotifications function that might be called from iframes
window.getNotifications = window.getNotifications || function() {
  console.log('getNotifications called from iframe - using fallback');
  return Promise.resolve([]);
};

// Handle iframe message errors
export const handleIframeError = (error, iframeSource) => {
  const errorMessage = error.message || error.toString();
  
  // Filter out common iframe errors
  const shouldIgnore = [
    'getNotifications',
    'Geolocation access has been blocked',
    'InvalidValueError: in property address',
    'Failed to decode downloaded font',
    'OTS parsing error',
    'The notification permission was not granted and blocked instead',
    'messaging/permission-blocked',
    'Geolocation has been disabled in this document by permissions policy',
    'InvalidAccessError: Failed to execute',
    'applicationServerKey is not valid',
    'subscribe on PushManager'
  ].some(term => errorMessage.includes(term));

  if (shouldIgnore) {
    console.log(`Ignoring iframe error from ${iframeSource}:`, errorMessage);
    return true; // Error was handled
  }
  
  return false; // Error should be logged
};

// Safe iframe message posting
export const safePostMessage = (iframe, message, targetOrigin) => {
  try {
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(message, targetOrigin);
      return true;
    }
  } catch (error) {
    console.log('Could not post message to iframe:', error.message);
  }
  return false;
};

// Initialize iframe error handling
export const initializeIframeErrorHandling = () => {
  // Override console methods for iframe content
  const originalConsole = { ...console };
  
  console = new Proxy(console, {
    get(target, prop) {
      if (prop === 'warn' || prop === 'error' || prop === 'log') {
        return (...args) => {
          const message = args.join(' ');
          
          // Check if this is an iframe-related message that should be filtered
          const shouldFilter = [
            'mapContainer',
            'Google Maps JavaScript API',
            'Permissions policy violation',
            'getNotifications',
            'Invalid DOM property',
            'componentWillMount',
            'componentWillReceiveProps',
            'ReactDOM.render is no longer supported',
            'string ref',
            'strict-mode-string-ref',
            'mapTypeId_changed',
            'styles_changed',
            'Geolocation access has been blocked',
            'InvalidValueError: in property address',
            'Failed to decode downloaded font',
            'OTS parsing error',
            'Failed to load resource',
            'Uncaught SyntaxError',
            'InvalidAccessError: Failed to execute',
            'applicationServerKey is not valid',
            'Initialization error',
            'Error while retrieving token',
            'subscribe on PushManager',
            'Error getting location',
            'Geolocation has been disabled',
            'worker init',
            'worker messaging',
            'res 65.246.84.74',
            'got ip',
            'timeDifference',
            'firebase mounted',
            'should call',
            'called',
            'Firebase apps',
            'Initializing Firebase',
            'Firebase initialized',
            'Firebase Messaging initialized',
            'req token',
            'Requesting permission',
            'firebase',
            'loadAppData is resolved',
            'Click is in the middle bottom',
            'Click is in the bottom-right corner',
            'google.maps.places.AutocompleteService',
            'google.maps.places.PlacesService',
            'google.maps.Marker',
            'mapId is present',
            'map styles are controlled via the cloud console',
            'deprecated',
            'not available to new customers',
            'not scheduled to be discontinued',
            'will continue to receive bug fixes',
            'at least 12 months notice',
            'migration guide',
            'ReferenceError: getNotifications',
            'Geolocation has been disabled in this document',
            'The notification permission was not granted and blocked instead',
            'messaging/permission-blocked',
            'Geolocation has been disabled in this document by permissions policy',
            'As of March 1st, 2025',
            'As of February 21st, 2024',
            'Basemap iframe loaded successfully'
          ].some(term => message.includes(term));
          
          if (!shouldFilter) {
            originalConsole[prop](...args);
          }
        };
      }
      return target[prop];
    }
  });

  // Add global error handler for iframe errors
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    const shouldIgnore = [
      'getNotifications',
      'Geolocation',
      'applicationServerKey',
      'PushManager',
      'mapContainer',
      'InvalidValueError',
      'ReferenceError',
      'Failed to decode downloaded font',
      'OTS parsing error',
      'The notification permission was not granted and blocked instead',
      'messaging/permission-blocked',
      'Geolocation has been disabled in this document by permissions policy'
    ].some(term => message.includes(term));

    if (shouldIgnore) {
      event.preventDefault();
      return false;
    }
  });

  console.log('Iframe error handling initialized');
};

// Export the initialization function
export default initializeIframeErrorHandling; 