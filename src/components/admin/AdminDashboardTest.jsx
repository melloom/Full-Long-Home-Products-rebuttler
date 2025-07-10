import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboardTest = () => {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [testState, setTestState] = useState('initializing');

  useEffect(() => {
    console.log('🔍 AdminDashboardTest: Component mounted');
    console.log('🔍 AdminDashboardTest: currentUser:', currentUser);
    console.log('🔍 AdminDashboardTest: authLoading:', authLoading);

    if (authLoading) {
      setTestState('auth-loading');
      return;
    }

    if (!currentUser) {
      setTestState('no-user');
      return;
    }

    // Check if user is admin
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      console.log('🔍 AdminDashboardTest: Found admin user in localStorage');
      setTestState('admin-found');
    } else {
      console.log('🔍 AdminDashboardTest: No admin user found');
      setTestState('not-admin');
    }
  }, [currentUser, authLoading]);

  const handleGoToLogin = () => {
    navigate('/admin/login');
  };

  const handleReload = () => {
    window.location.reload();
  };

  const renderContent = () => {
    switch (testState) {
      case 'initializing':
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Initializing...</h2>
            <p>Setting up test environment</p>
          </div>
        );
      
      case 'auth-loading':
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Authentication Loading</h2>
            <p>Please wait while we check your authentication status...</p>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '20px auto'
            }}></div>
          </div>
        );
      
      case 'no-user':
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>No User Found</h2>
            <p>You need to be logged in to access the admin dashboard.</p>
            <button onClick={handleGoToLogin} style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}>
              Go to Login
            </button>
          </div>
        );
      
      case 'admin-found':
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Admin Access Confirmed</h2>
            <p>You are logged in as an admin. The dashboard should work properly.</p>
            <div style={{ 
              backgroundColor: '#d4edda', 
              border: '1px solid #c3e6cb', 
              borderRadius: '4px', 
              padding: '15px', 
              margin: '20px 0',
              color: '#155724'
            }}>
              <strong>Status:</strong> Ready to load full dashboard
            </div>
            <button onClick={handleReload} style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Try Full Dashboard
            </button>
          </div>
        );
      
      case 'not-admin':
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Access Denied</h2>
            <p>You are logged in but do not have admin privileges.</p>
            <button onClick={handleGoToLogin} style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}>
              Go to Login
            </button>
          </div>
        );
      
      default:
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Unknown State</h2>
            <p>Current state: {testState}</p>
            <button onClick={handleReload} style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Reload Page
            </button>
          </div>
        );
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '20px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            backgroundColor: '#007bff', 
            color: 'white', 
            padding: '20px',
            textAlign: 'center'
          }}>
            <h1 style={{ margin: 0 }}>Admin Dashboard Test</h1>
            <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
              Debugging the white screen issue
            </p>
          </div>
          
          <div style={{ padding: '20px' }}>
            <div style={{ 
              backgroundColor: '#e9ecef', 
              padding: '15px', 
              borderRadius: '4px', 
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <strong>Debug Info:</strong><br />
              Auth Loading: {authLoading ? 'Yes' : 'No'}<br />
              Current User: {currentUser ? 'Yes' : 'No'}<br />
              Test State: {testState}<br />
              Timestamp: {new Date().toLocaleString()}
            </div>
            
            {renderContent()}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardTest; 