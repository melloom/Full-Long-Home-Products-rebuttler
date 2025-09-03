import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PersistentRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPersistentSession, getUserType, loading } = useAuth();

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (loading) return;

    // Don't redirect if we're already on a protected route
    const protectedRoutes = ['/admin', '/app', '/rebuttals', '/disposition', '/customerService', '/faq', '/scheduleScript'];
    const isOnProtectedRoute = protectedRoutes.some(route => location.pathname.startsWith(route));
    
    if (isOnProtectedRoute) return;

    // Check if user has a persistent session
    if (hasPersistentSession()) {
      const userType = getUserType();
      
      if (userType) {
        console.log('🔄 PersistentRoute: Found persistent session, redirecting user:', userType);
        
        if (userType.type === 'admin') {
          // Redirect admin users to appropriate dashboard
          switch (userType.role) {
            case 'super-admin':
              console.log('🔄 Redirecting super admin to SaaS dashboard');
              navigate('/admin/saas', { replace: true });
              break;
            case 'company-admin':
              console.log('🔄 Redirecting company admin to company dashboard');
              navigate('/admin/dashboard', { replace: true });
              break;
            default:
              console.log('🔄 Redirecting regular admin to admin dashboard');
              navigate('/admin/dashboard', { replace: true });
              break;
          }
        } else if (userType.type === 'company-user') {
          // Redirect company users to their company landing page
          const currentCompanySlug = localStorage.getItem('currentCompanySlug');
          if (currentCompanySlug) {
            console.log('🔄 Redirecting company user to company landing page:', currentCompanySlug);
            navigate(`/company/${currentCompanySlug}`, { replace: true });
          } else {
            console.log('🔄 No company slug found, staying on current page');
          }
        }
      }
    } else {
      console.log('🔄 PersistentRoute: No persistent session found, user can stay on current page');
    }
  }, [loading, hasPersistentSession, getUserType, navigate, location.pathname]);

  return children;
};

export default PersistentRoute;