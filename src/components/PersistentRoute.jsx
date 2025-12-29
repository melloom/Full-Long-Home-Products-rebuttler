import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PersistentRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPersistentSession, getUserType, loading } = useAuth();

  useEffect(() => {
    console.log('🔄 PersistentRoute: useEffect triggered', { loading, pathname: location.pathname });
    
    // Don't redirect if auth is still loading
    if (loading) {
      console.log('🔄 PersistentRoute: Still loading, skipping');
      return;
    }

    // Don't redirect if we're already on an admin route (but allow company routes)
    const adminRoutes = ['/admin'];
    const isOnAdminRoute = adminRoutes.some(route => location.pathname.startsWith(route));
    
    if (isOnAdminRoute) {
      console.log('🔄 PersistentRoute: On admin route, skipping');
      return;
    }

    // Check if user has a persistent session
    if (hasPersistentSession()) {
      const userType = getUserType();
      
      if (userType) {
        console.log('🔄 PersistentRoute: Found persistent session, user type:', userType);
        
        // Check if we're on a company route - if so, allow super admins to stay
        const isCompanyRoute = location.pathname.startsWith('/company/');
        const isAppRoute = location.pathname.startsWith('/app');
        const isCompanyRelatedRoute = isCompanyRoute || isAppRoute || 
          location.pathname.startsWith('/rebuttals') || 
          location.pathname.startsWith('/disposition') || 
          location.pathname.startsWith('/customerService') || 
          location.pathname.startsWith('/faq') || 
          location.pathname.startsWith('/scheduleScript');
        
        console.log('🔄 PersistentRoute: Route analysis', { 
          isCompanyRoute, 
          isAppRoute, 
          isCompanyRelatedRoute,
          pathname: location.pathname 
        });
        
        if (userType.type === 'admin') {
          // Special handling for Long Home - redirect to /app
          if (userType.role === 'super-admin' && isCompanyRoute) {
            const companySlug = location.pathname.split('/')[2];
            console.log('🔄 Checking company route:', { companySlug, userRole: userType.role });
            // Check for Long Home by slug or known ID
            if (companySlug === 'long-home' || companySlug === 'oLuxoJq8SHXXEWm9KSEU') {
              console.log('🔄 Super admin accessing Long Home, redirecting to /app');
              navigate('/app', { replace: true });
              return;
            }
          }
          
          // Allow super admins to access company-related routes
          if (userType.role === 'super-admin' && isCompanyRelatedRoute) {
            console.log('🔄 Super admin accessing company route, allowing access');
            return; // Don't redirect, allow access
          }
          
          // Redirect admin users to appropriate dashboard for non-company routes
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