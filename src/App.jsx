import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { scrollToTop } from './utils/useScrollToTop';
import { registerServiceWorker, handleServiceWorkerUpdates } from './utils/pwa';
import Home from './components/Home';
import SaaSLandingPage from './components/SaaSLandingPage';
import CompanyPlatform from './components/CompanyPlatform';
import RebuttalLibrary from './components/RebuttalLibrary';
import LeadDisposition from './components/LeadDisposition';
import CustomerService from './components/CustomerService';
import FAQ from './components/FAQ';
import ScheduleScript from './components/ScheduleScript';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import SaasAdminDashboard from './components/admin/SaasAdminDashboard.jsx';
import SaasAdminLogin from './components/admin/SaasAdminLogin.jsx';
import AdminDashboardTest from './components/admin/AdminDashboardTest.jsx';
import FirebaseTest from './components/admin/FirebaseTest.jsx';
import ErrorBoundaryTest from './components/admin/ErrorBoundaryTest.jsx';
import AdminLogin from './components/admin/AdminLogin';
import AdminSetup from './components/admin/AdminSetup';
import RebuttalForm from './components/admin/RebuttalForm';
import CustomerServiceManager from './components/admin/CustomerServiceManager';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import SecureRoute from './components/SecureRoute';
import PersistentRoute from './components/PersistentRoute';
import MaintenanceMode from './components/MaintenanceMode';
import './styles/App.css';

// Legacy PrivateRoute - now using SecureRoute for better protection
const PrivateRoute = ({ children }) => {
  return children;
};

// Wrapper component to provide navigation to components
const NavigationWrapper = ({ Component }) => {
  const navigate = useNavigate();
  const handleNavigate = (path) => {
    // If navigating to 'home' from within a company context, go to that company's home
    if (path === 'home') {
      const match = window.location.pathname.match(/^\/company\/([^/]+)/);
      const stored = localStorage.getItem('currentCompanySlug');
      const slug = (match && match[1]) || stored;
      if (slug) {
        navigate(`/company/${slug}`);
        scrollToTop();
        return;
      }
    }
    navigate(`/${path}`);
    // Scroll to top when navigating programmatically
    scrollToTop();
  };
  return <Component onNavigate={handleNavigate} />;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Force dark mode on every render
  useEffect(() => {
    document.body.classList.add('dark');
    return () => {
      document.body.classList.remove('dark');
    };
  });

  // Register service worker
  useEffect(() => {
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

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Show loading screen for 1 second

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
    // SaaS landing routes should show StayOnScript loading
    const saasRoutes = ['/', '/admin'];
    // Company/training routes should show Long Home loading
    const isCompanyRoute = path.startsWith('/company') || 
                          path.startsWith('/app') || 
                          path.startsWith('/rebuttals') || 
                          path.startsWith('/disposition') || 
                          path.startsWith('/customerService') || 
                          path.startsWith('/faq') || 
                          path.startsWith('/scheduleScript');
    
    return <LoadingScreen variant={isCompanyRoute ? 'company' : 'landing'} />;
  }

  return (
    <>
      <MaintenanceMode />
      <Router future={{ 
        v7_startTransition: true,
        v7_relativeSplatPath: true 
      }}>
        <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/setup" element={<AdminSetup />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/saas-login" element={<SaasAdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <SecureRoute 
              requiredRole="admin" 
              allowImpersonation={true}
              fallbackPath="/admin/login"
            >
              <AdminDashboard />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/saas"
          element={
            <SecureRoute 
              requiredRole="super-admin"
              fallbackPath="/admin/saas-login"
            >
              <SaasAdminDashboard />
            </SecureRoute>
          }
        />
        <Route path="/admin/company" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/test"
          element={
            <SecureRoute 
              requiredRole="super-admin"
              fallbackPath="/admin/saas-login"
            >
              <AdminDashboardTest />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/firebase-test"
          element={
            <SecureRoute 
              requiredRole="super-admin"
              fallbackPath="/admin/saas-login"
            >
              <FirebaseTest />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/error-test"
          element={
            <SecureRoute 
              requiredRole="super-admin"
              fallbackPath="/admin/saas-login"
            >
              <ErrorBoundaryTest />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/rebuttals/new"
          element={
            <SecureRoute 
              requiredRole="admin" 
              requiredPermissions={["manage-rebuttals"]}
              allowImpersonation={true}
              fallbackPath="/admin/login"
            >
              <RebuttalForm />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/rebuttals/edit/:id"
          element={
            <SecureRoute 
              requiredRole="admin" 
              requiredPermissions={["manage-rebuttals"]}
              allowImpersonation={true}
              fallbackPath="/admin/login"
            >
              <RebuttalForm />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/customer-service"
          element={
            <SecureRoute 
              requiredRole="admin" 
              requiredPermissions={["manage-customer-service"]}
              allowImpersonation={true}
              fallbackPath="/admin/login"
            >
              <CustomerServiceManager />
            </SecureRoute>
          }
        />

        {/* Public Routes */}
        <Route path="/" element={<SaaSLandingPage />} />
        <Route path="/company/:companySlug" element={
          <PersistentRoute>
            <CompanyPlatform />
          </PersistentRoute>
        } />
        
        {/* Authenticated App Routes */}
        <Route 
          path="/app" 
          element={
            <SecureRoute fallbackPath="/">
              <Layout><NavigationWrapper Component={Home} /></Layout>
            </SecureRoute>
          } 
        />
        <Route 
          path="/rebuttals" 
          element={
            <SecureRoute fallbackPath="/">
              <Layout><RebuttalLibrary /></Layout>
            </SecureRoute>
          } 
        />
        <Route 
          path="/disposition" 
          element={
            <SecureRoute fallbackPath="/">
              <Layout><LeadDisposition /></Layout>
            </SecureRoute>
          } 
        />
        <Route 
          path="/customerService" 
          element={
            <SecureRoute fallbackPath="/">
              <Layout><CustomerService /></Layout>
            </SecureRoute>
          } 
        />
        <Route 
          path="/faq" 
          element={
            <SecureRoute fallbackPath="/">
              <Layout><FAQ /></Layout>
            </SecureRoute>
          } 
        />
        <Route 
          path="/scheduleScript" 
          element={
            <SecureRoute fallbackPath="/">
              <Layout><ScheduleScript /></Layout>
            </SecureRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;