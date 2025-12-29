import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../../services/userService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '../../../services/firebase/config';
import './AdminLogin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDisplayNamePrompt, setShowDisplayNamePrompt] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const parsedAdmin = JSON.parse(adminUser);
      // Redirect based on role
      if (parsedAdmin.role === 'super-admin') {
        navigate('/admin/saas');
      } else {
        navigate('/admin/dashboard');
      }
    }
  }, [navigate]);

  const verifyAdminStatus = async (user) => {
    try {
      // First check if user is a super admin
      const superAdminRef = doc(getDb(), 'super-admins', user.uid);
      const superAdminDoc = await getDoc(superAdminRef);
      
      if (superAdminDoc.exists()) {
        const superAdminData = superAdminDoc.data();
        console.log('🔍 AdminLogin: User is a super admin, redirecting to SaaS dashboard');
        console.log('🔍 AdminLogin: Super admin data:', superAdminData);
        
        // Store super admin info in localStorage
        const adminUser = {
          uid: user.uid,
          email: user.email,
          role: 'super-admin',
          ...superAdminData
        };
        console.log('🔍 AdminLogin: Storing admin user in localStorage:', adminUser);
        localStorage.setItem('adminUser', JSON.stringify(adminUser));
        
        // Redirect to super admin dashboard
        console.log('🔍 AdminLogin: Navigating to /admin/saas');
        navigate('/admin/saas');
        return 'super-admin';
      }

      // Check if user is a company admin
      const companyAdminRef = doc(getDb(), 'company-admins', user.uid);
      const companyAdminDoc = await getDoc(companyAdminRef);
      
      if (companyAdminDoc.exists()) {
        const companyAdminData = companyAdminDoc.data();
        console.log('🔍 AdminLogin: User is company admin:', companyAdminData);
        
        // Store company admin info in localStorage
        const adminUser = {
          uid: user.uid,
          email: user.email,
          role: 'company-admin',
          companyId: companyAdminData.companyId,
          ...companyAdminData
        };
        localStorage.setItem('adminUser', JSON.stringify(adminUser));
        
        // Redirect to company admin dashboard
        console.log('🔍 AdminLogin: Navigating to /admin/company');
        navigate('/admin/company');
        return 'company-admin';
      }

      // Check if user exists in regular admins collection
      const adminRef = doc(getDb(), 'admins', user.uid);
      const adminDoc = await getDoc(adminRef);

      if (!adminDoc.exists()) {
        // If admin document doesn't exist, create it
        await setDoc(adminRef, {
          email: user.email,
          role: 'admin',
          displayName: user.displayName || '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
        return 'admin';
      }

      const adminData = adminDoc.data();
      if (!adminData?.role || adminData.role !== 'admin') {
        // If role is not admin, update it
        await setDoc(adminRef, {
          role: 'admin',
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }

      return 'admin';
    } catch (error) {
      console.error('Error verifying admin status:', error);
      throw error;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, needsDisplayName } = await userService.loginUser(email, password);
      
      if (needsDisplayName) {
        setCurrentUser(user);
        setShowDisplayNamePrompt(true);
        setLoading(false);
        return;
      }

      const adminType = await verifyAdminStatus(user);
      
      // If user is not a super admin, store regular admin data and navigate to regular dashboard
      if (adminType === 'admin') {
        // Store user data with role
        localStorage.setItem('adminUser', JSON.stringify({
          ...user,
          role: 'admin'
        }));
        
        navigate('/admin/dashboard');
      }
      // If user is super admin, verifyAdminStatus already handled the redirect
      
    } catch (err) {
      // Handle registration status errors
      if (err.message && err.message.includes('REGISTRATION_PENDING')) {
        setError(err.message.replace('REGISTRATION_PENDING: ', ''));
      } else if (err.message && err.message.includes('REGISTRATION_REJECTED')) {
        setError(err.message.replace('REGISTRATION_REJECTED: ', ''));
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisplayNameSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    setLoading(true);
    try {
      await userService.updateDisplayName(currentUser.uid, displayName.trim());
      const adminType = await verifyAdminStatus(currentUser);
      
      // If user is not a super admin, store regular admin data and navigate to regular dashboard
      if (adminType === 'admin') {
        // Store user data with role
        localStorage.setItem('adminUser', JSON.stringify({
          ...currentUser,
          displayName: displayName.trim(),
          role: 'admin'
        }));
        
        navigate('/admin/dashboard');
      }
      // If user is super admin, verifyAdminStatus already handled the redirect
      
    } catch (err) {
      setError(err.message || 'Failed to update display name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showDisplayNamePrompt) {
    return (
      <div className="admin-login-container">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </button>
        <div className="admin-login-card">
          <div className="admin-login-header">
            <h1>Set Your Display Name</h1>
            <p>Please enter your display name to continue</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleDisplayNameSubmit}>
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                required
              />
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-container">
      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Home
      </button>
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>Admin Login</h1>
          <p>Sign in to access the admin dashboard</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
 