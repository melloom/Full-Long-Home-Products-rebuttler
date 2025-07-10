const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');
console.log('Preload script location:', __filename);
console.log('Current directory:', __dirname);
console.log('Node version:', process.versions.node);
console.log('Chrome version:', process.versions.chrome);
console.log('Electron version:', process.versions.electron);

// Set CSP headers
process.once('loaded', () => {
  const csp = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https://*.firebaseio.com', 'https://*.googleapis.com']
  };

  const cspString = Object.entries(csp)
    .map(([key, value]) => `${key} ${value.join(' ')}`)
    .join('; ');

  document.addEventListener('DOMContentLoaded', () => {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspString;
    document.head.appendChild(meta);
  });
});

try {
  // Expose protected methods that allow the renderer process to use
  // the ipcRenderer without exposing the entire object
  contextBridge.exposeInMainWorld(
    'electron',
    {
      // Add any electron APIs you need here
      platform: process.platform,
      versions: process.versions,
      env: {
        NODE_ENV: process.env.NODE_ENV
      },
      // Add debug logging
      log: (message) => {
        console.log('Renderer Log:', message);
      },
      error: (message) => {
        console.error('Renderer Error:', message);
      },
      // Add path information for debugging
      paths: {
        current: __filename,
        dirname: __dirname
      }
    }
  );
  console.log('Preload script completed successfully');
} catch (error) {
  console.error('Error in preload script:', error);
  // Try to get more information about the error
  console.error('Error stack:', error.stack);
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
} 