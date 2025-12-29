import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, getDb } from '../../services/firebase/config';
import './CompanyLogin.css';

const CompanyLogin = ({ company, onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First check if there's a pending registration request for this email BEFORE attempting sign in
      const db = getDb();
      const registrationQuery = query(
        collection(db, 'company-registration-requests'),
        where('email', '==', email.toLowerCase().trim())
      );
      const registrationSnapshot = await getDocs(registrationQuery);

      if (!registrationSnapshot.empty) {
        const registrationRequest = registrationSnapshot.docs[0].data();
        const status = registrationRequest.status;

        if (status === 'pending') {
          setError(
            'Your account is still being reviewed. Please wait to be contacted, or contact us at contact@mellowsites.com for assistance.'
          );
          setLoading(false);
          return;
        }

        if (status === 'rejected') {
          setError(
            'Your registration request has been rejected. Please contact contact@mellowsites.com for more information.'
          );
          setLoading(false);
          return;
        }

        // If status is 'approved', continue with login
      }

      // Proceed with normal login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // First check if user is a super admin - redirect to super admin dashboard
      const superAdminRef = doc(getDb(), 'super-admins', user.uid);
      const superAdminDoc = await getDoc(superAdminRef);

      if (superAdminDoc.exists()) {
        const superAdminData = superAdminDoc.data();
        
        // Store super admin info in localStorage
        const adminUser = {
          uid: user.uid,
          email: user.email,
          role: 'super-admin',
          ...superAdminData
        };
        localStorage.setItem('adminUser', JSON.stringify(adminUser));
        
        // Redirect to super admin dashboard
        window.location.href = '/admin/saas';
        return;
      }

      // Check if user is a company admin for this company
      const companyAdminRef = doc(getDb(), 'company-admins', user.uid);
      const companyAdminDoc = await getDoc(companyAdminRef);

      if (companyAdminDoc.exists()) {
        const companyAdminData = companyAdminDoc.data();
        
        if (companyAdminData.companyId === company.id) {
          // Company admin for this company - allow access
          onLogin({
            uid: user.uid,
            email: user.email,
            name: companyAdminData.name || user.displayName,
            role: 'company-admin',
            companyId: company.id
          });
          return;
        }
      }

      // Check if user belongs to this company (regular user)
      const userRef = doc(getDb(), 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.companyId === company.id) {
          // User belongs to this company
          onLogin({
            uid: user.uid,
            email: user.email,
            name: userData.name || user.displayName,
            role: userData.role || 'user',
            companyId: company.id
          });
        } else {
          setError('You are not authorized to access this company\'s training platform.');
        }
      } else {
        setError('User account not found. Please contact your administrator.');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Sign out if there was an error
      try {
        await auth.signOut();
      } catch (_) {}
      
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        default:
          setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="company-login">
      <button className="back-to-home-btn" onClick={onBack}>
        ← Back to Home
      </button>
      <div className="login-container">
        <div className="login-header">
          <div className="company-info">
            <div className="company-logo">
              <span className="logo-icon">🏢</span>
              <span className="company-name">{company.name}</span>
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">
              Sign in to access your training platform
            </p>
          </div>
        </div>

        <div className="login-form-container">
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p className="help-text">
              Need help? Contact your {company.name} administrator.
            </p>
            <div className="login-links">
              <a href="#forgot-password">Forgot Password?</a>
              <a href="#contact-support">Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogin;