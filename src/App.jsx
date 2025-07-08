import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getCurrentUser } from './services/firebase/auth';
import Home from './components/Home';
import RebuttalLibrary from './components/RebuttalLibrary';
import LeadDisposition from './components/LeadDisposition';
import CustomerService from './components/CustomerService';
import FAQ from './components/FAQ';
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
  };
  return <Component onNavigate={handleNavigate} />;
};

function App() {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Show loading screen for at least 1.5 seconds

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
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/rebuttals"
          element={
            <Layout>
              <NavigationWrapper Component={RebuttalLibrary} />
            </Layout>
          }
        />
        <Route
          path="/disposition"
          element={
            <Layout>
              <NavigationWrapper Component={LeadDisposition} />
            </Layout>
          }
        />
        <Route
          path="/customerService"
          element={
            <Layout>
              <NavigationWrapper Component={CustomerService} />
            </Layout>
          }
        />
        <Route
          path="/faq"
          element={
            <Layout>
              <NavigationWrapper Component={FAQ} />
            </Layout>
          }
        />
        
        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;