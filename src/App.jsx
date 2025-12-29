import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { scrollToTop } from './utils/useScrollToTop';
import { registerServiceWorker, handleServiceWorkerUpdates } from './utils/pwa';
import Home from './components/Home';
import HomePage from './pages/Home';
import SaaSLandingPage from './components/SaaSLandingPage';
import CompanyRegister from './pages/CompanyRegister';
import { CompanyPlatform } from './components/longhome-training';
import { RebuttalLibrary, LeadDisposition, CustomerService, FAQ, ScheduleScript } from './components/longhome-training';
import ScheduleScriptComingSoon from './components/longhome-training/ScheduleScriptComingSoon';
import { 
  AdminDashboard, 
  SaasAdminDashboard, 
  SaasAdminLogin, 
  AdminDashboardTest, 
  FirebaseTest, 
  ErrorBoundaryTest, 
  AdminLogin, 
  AdminSetup, 
  RebuttalForm, 
  CustomerServiceManager 
} from './components/longhome-training';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import SecureRoute from './components/SecureRoute';
import PersistentRoute from './components/PersistentRoute';
import MaintenanceMode from './components/MaintenanceMode';
import InviteHandler from './components/InviteHandler';
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
  const { loading: authLoading } = useAuth();

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

  if (isLoading || authLoading) {
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
        // SaaS landing routes should show app loading
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
        <Route path="/company/register" element={<CompanyRegister />} />
        <Route path="/invite/:token" element={<InviteHandler />} />
        <Route path="/company/:companySlug" element={
          <PersistentRoute>
            <CompanyPlatform />
          </PersistentRoute>
        } />
        
        {/* Authenticated App Routes */}
        <Route 
          path="/app" 
          element={
            <Layout><NavigationWrapper Component={Home} /></Layout>
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
              <Layout><ScheduleScriptComingSoon /></Layout>
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