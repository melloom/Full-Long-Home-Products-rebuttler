import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { scrollToTop } from './utils/useScrollToTop';
import { registerServiceWorker, handleServiceWorkerUpdates } from './utils/pwa';
import Home from './components/Home';
import RebuttalLibrary from './components/RebuttalLibrary';
import LeadDisposition from './components/LeadDisposition';
import CustomerService from './components/CustomerService';
import FAQ from './components/FAQ';
import ScheduleScript from './components/ScheduleScript';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import AdminDashboardTest from './components/admin/AdminDashboardTest.jsx';
import FirebaseTest from './components/admin/FirebaseTest.jsx';
import ErrorBoundaryTest from './components/admin/ErrorBoundaryTest.jsx';
import AdminLogin from './components/admin/AdminLogin';
import AdminSetup from './components/admin/AdminSetup';
import RebuttalForm from './components/admin/RebuttalForm';
import CustomerServiceManager from './components/admin/CustomerServiceManager';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import './styles/App.css';

const PrivateRoute = ({ children }) => {
  // Let the AdminDashboard handle its own authentication
  // This prevents conflicts with the AuthContext
  return children;
};

// Wrapper component to provide navigation to components
const NavigationWrapper = ({ Component }) => {
  const navigate = useNavigate();
  const handleNavigate = (path) => {
    navigate(`/${path}`);
    // Scroll to top when navigating programmatically
    scrollToTop();
  };
  return <Component onNavigate={handleNavigate} />;
};

function App() {
  const [isLoading, setIsLoading] = React.useState(true);

  // Force dark mode on every render
  React.useEffect(() => {
    document.body.classList.add('dark');
    return () => {
      document.body.classList.remove('dark');
    };
  });

  // Register service worker
  React.useEffect(() => {
    if (import.meta.env.PROD) {
      const initializePWA = async () => {
        try {
          console.log('Initializing PWA...');
          await registerServiceWorker();
          handleServiceWorkerUpdates();
          console.log('PWA initialized successfully');
        } catch (error) {
          console.error('Failed to initialize PWA:', error);
        }
      };
      initializePWA();
    } else {
      console.log('Skipping service worker registration in development');
    }
  }, []);

  React.useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Show loading screen for 1 second

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/setup" element={<AdminSetup />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/test"
          element={
            <PrivateRoute>
              <AdminDashboardTest />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/firebase-test"
          element={<FirebaseTest />}
        />
        <Route
          path="/admin/error-test"
          element={<ErrorBoundaryTest />}
        />
        <Route
          path="/admin/rebuttals/new"
          element={
            <PrivateRoute>
              <RebuttalForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/rebuttals/edit/:id"
          element={
            <PrivateRoute>
              <RebuttalForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/customer-service"
          element={
            <PrivateRoute>
              <CustomerServiceManager />
            </PrivateRoute>
          }
        />

        {/* Public Routes */}
        <Route path="/" element={<Layout><NavigationWrapper Component={Home} /></Layout>} />
        <Route path="/rebuttals" element={<Layout><RebuttalLibrary /></Layout>} />
        <Route path="/disposition" element={<Layout><LeadDisposition /></Layout>} />
        <Route path="/customerService" element={<Layout><CustomerService /></Layout>} />
        <Route path="/faq" element={<Layout><FAQ /></Layout>} />
        <Route path="/scheduleScript" element={<Layout><ScheduleScript /></Layout>} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;