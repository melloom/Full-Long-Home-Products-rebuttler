import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import LoadingScreen from './LoadingScreen';

const SecureRoute = ({ 
  children, 
  requiredRole = null, 
  requiredPermissions = [], 
  fallbackPath = '/admin/login',
  allowImpersonation = false 
}) => {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        console.log('🔒 SecureRoute: Starting access check', { 
          path: location.pathname,
          requiredRole,
          allowImpersonation 
        });
        setLoading(true);
        setError(null);

        // Wait for auth to finish loading
        if (authLoading) {
          return;
        }

        // If no user, redirect to login
        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Check for impersonation if allowed
        let impersonation = null;
        if (allowImpersonation) {
          try {
            impersonation = JSON.parse(localStorage.getItem('impersonation') || 'null');
          } catch (e) {
            console.warn('Invalid impersonation data in localStorage');
          }
        }

        // Check localStorage first for performance
        const storedAdmin = localStorage.getItem('adminUser');
        if (storedAdmin) {
          try {
            const adminData = JSON.parse(storedAdmin);
            setUserRole(adminData.role);
            setUserPermissions(adminData.permissions || []);
            setLoading(false);
            return;
          } catch (e) {
            console.warn('Invalid admin data in localStorage');
          }
        }

        // Check Firestore for role
        const db = getFirestore();
        let role = null;
        let permissions = [];

        // Check super admin first
        const superAdminRef = doc(db, 'super-admins', currentUser.uid);
        const superAdminDoc = await getDoc(superAdminRef);
        
        if (superAdminDoc.exists()) {
          const superAdminData = superAdminDoc.data();
          role = 'super-admin';
          permissions = superAdminData.permissions || [
            'create-companies',
            'delete-companies', 
            'create-platforms',
            'delete-platforms',
            'manage-users',
            'view-analytics',
            'system-settings',
            'impersonate-companies'
          ];
          
          // Store in localStorage for future use
          const adminUser = {
            uid: currentUser.uid,
            email: currentUser.email,
            role: 'super-admin',
            permissions,
            ...superAdminData
          };
          localStorage.setItem('adminUser', JSON.stringify(adminUser));
        } else {
          // Check company admin
          const companyAdminRef = doc(db, 'company-admins', currentUser.uid);
          const companyAdminDoc = await getDoc(companyAdminRef);
          
          if (companyAdminDoc.exists()) {
            const companyAdminData = companyAdminDoc.data();
            role = 'company-admin';
            permissions = companyAdminData.permissions || [
              'manage-rebuttals',
              'manage-categories',
              'manage-users',
              'view-analytics'
            ];
            
            // Store in localStorage for future use
            const adminUser = {
              uid: currentUser.uid,
              email: currentUser.email,
              role: 'company-admin',
              companyId: companyAdminData.companyId,
              permissions,
              ...companyAdminData
            };
            localStorage.setItem('adminUser', JSON.stringify(adminUser));
          } else {
            // Check regular admin
            const adminRef = doc(db, 'admins', currentUser.uid);
            const adminDoc = await getDoc(adminRef);
            
            if (adminDoc.exists()) {
              const adminData = adminDoc.data();
              role = 'admin';
              permissions = adminData.permissions || [
                'manage-rebuttals',
                'manage-categories'
              ];
              
              // Store in localStorage for future use
              const adminUser = {
                uid: currentUser.uid,
                email: currentUser.email,
                role: 'admin',
                companyId: adminData.companyId,
                permissions,
                ...adminData
              };
              localStorage.setItem('adminUser', JSON.stringify(adminUser));
            } else {
              // Check if user has any role
              const userRef = doc(db, 'users', currentUser.uid);
              const userDoc = await getDoc(userRef);
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                role = userData.role || 'user';
                permissions = userData.permissions || [];
              }
            }
          }
        }

        setUserRole(role);
        setUserPermissions(permissions);
        setLoading(false);

      } catch (error) {
        console.error('Error checking user access:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    checkUserAccess();
  }, [currentUser, authLoading, allowImpersonation]);

  // Show loading screen while checking auth
  if (authLoading || loading) {
    // Determine variant based on current path
    const path = location.pathname;
    const isCompanyRoute = path.startsWith('/company') || 
                          path.startsWith('/app') || 
                          path.startsWith('/rebuttals') || 
                          path.startsWith('/disposition') || 
                          path.startsWith('/customerService') || 
                          path.startsWith('/faq') || 
                          path.startsWith('/scheduleScript');
    
    return <LoadingScreen variant={isCompanyRoute ? 'company' : 'landing'} />;
  }

  // Show error state
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem'
      }}>
        <h2>Access Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // No user authenticated
  if (!currentUser) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // No role found
  if (!userRole) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem'
      }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this area.</p>
        <button onClick={() => window.location.href = '/'}>Go Home</button>
      </div>
    );
  }

  // Check role requirement
  if (requiredRole && userRole !== requiredRole) {
    console.log('🔒 SecureRoute: Role check failed', { 
      userRole, 
      requiredRole, 
      allowImpersonation,
      path: location.pathname 
    });
    
    // Special case: company-admin can access admin routes
    if (userRole === 'company-admin' && requiredRole === 'admin') {
      console.log('🔒 SecureRoute: Company admin accessing admin route, allowing access');
      return children;
    }
    
    // Special case: super-admin can access admin/company-admin routes when impersonating
    if (userRole === 'super-admin' && (requiredRole === 'admin' || requiredRole === 'company-admin') && allowImpersonation) {
      const impersonation = JSON.parse(localStorage.getItem('impersonation') || 'null');
      console.log('🔒 SecureRoute: Checking impersonation', { impersonation });
      if (impersonation?.enabled) {
        console.log('🔒 SecureRoute: Impersonation allowed, rendering children');
        return children;
      }
    }
    
    // Redirect based on role
    let redirectPath = '/';
    if (userRole === 'super-admin') {
      redirectPath = '/admin/saas';
    } else if (userRole === 'company-admin' || userRole === 'admin') {
      redirectPath = '/admin/dashboard';
    }
    
    return <Navigate to={redirectPath} replace />;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100vh',
          gap: '1rem'
        }}>
          <h2>Insufficient Permissions</h2>
          <p>You don't have the required permissions to access this area.</p>
          <p>Required: {requiredPermissions.join(', ')}</p>
          <p>Your permissions: {userPermissions.join(', ')}</p>
          <button onClick={() => window.history.back()}>Go Back</button>
        </div>
      );
    }
  }

  // All checks passed, render the protected component
  return children;
};

export default SecureRoute;