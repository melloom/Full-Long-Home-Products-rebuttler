import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug logging
console.log('App starting...');
console.log('Current directory:', __dirname);
console.log('Environment:', process.env.NODE_ENV);

// Set ELECTRON environment variable
process.env.ELECTRON = 'true';

// Set up cache directory
const userDataPath = app.getPath('userData');
const cachePath = path.join(userDataPath, 'Cache');
if (!fs.existsSync(cachePath)) {
  fs.mkdirSync(cachePath, { recursive: true });
}

// Check if preload script exists
const preloadPath = path.join(__dirname, 'preload.cjs');
console.log('Preload script path:', preloadPath);
if (fs.existsSync(preloadPath)) {
  console.log('Preload script exists at:', preloadPath);
  // Read and log the first few lines of the preload script for debugging
  const preloadContent = fs.readFileSync(preloadPath, 'utf8');
  console.log('Preload script content:', preloadContent.split('\n').slice(0, 5).join('\n'));
} else {
  console.error('Preload script does not exist at:', preloadPath);
  // List files in directory to help debug
  console.log('Files in directory:', fs.readdirSync(__dirname));
}

let mainWindow = null;

function createWindow() {
  if (mainWindow) {
    console.log('Window already exists, focusing...');
    mainWindow.focus();
    return;
  }

  console.log('Creating window...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: preloadPath,
      sandbox: false
    }
  });

  // Debug window events
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('Window started loading...');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window finished loading');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Window failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('Renderer Console:', message);
  });

  // Set CSP headers
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    console.log('Setting CSP headers for:', details.url);
    const isDev = process.env.NODE_ENV === 'development';
    const csp = isDev 
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com ws://localhost:* http://localhost:*",
          "font-src 'self'",
          "object-src 'none'",
          "media-src 'self'",
          "frame-src 'self'",
          "worker-src 'self' blob:",
          "child-src 'self' blob:"
        ].join('; ')
      : [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com",
          "font-src 'self'",
          "object-src 'none'",
          "media-src 'self'",
          "frame-src 'self'",
          "worker-src 'self' blob:",
          "child-src 'self' blob:"
        ].join('; ');

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  // Try to load from both possible locations
  const isDev = process.env.NODE_ENV === 'development';
  const possiblePaths = isDev 
    ? ['http://localhost:3001']
    : [
        path.join(__dirname, 'dist', 'index.html'),
        path.join(__dirname, 'index.html')
      ];

  console.log('Trying to load from possible paths:', possiblePaths);

  let loaded = false;
  if (isDev) {
    console.log('Loading from development server:', possiblePaths[0]);
    mainWindow.loadURL(possiblePaths[0]);
    loaded = true;
  } else {
    for (const indexPath of possiblePaths) {
      if (fs.existsSync(indexPath)) {
        console.log('Found index.html at:', indexPath);
        mainWindow.loadFile(indexPath);
        loaded = true;
        break;
      } else {
        console.log('index.html not found at:', indexPath);
      }
    }
  }

  if (!loaded) {
    console.error('Could not find index.html in any of the expected locations');
    // List all files in the directory to help debug
    console.log('Files in current directory:', fs.readdirSync(__dirname));
    if (fs.existsSync(path.join(__dirname, 'dist'))) {
      console.log('Files in dist directory:', fs.readdirSync(path.join(__dirname, 'dist')));
    }
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Opening DevTools...');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log('App is ready');
  createWindow();

  app.on('activate', function () {
    console.log('App activated');
    if (mainWindow === null) createWindow();
  });
});

app.on('window-all-closed', function () {
  console.log('All windows closed');
  if (process.platform !== 'darwin') app.quit();
});

// Log any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Log any unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
}); 