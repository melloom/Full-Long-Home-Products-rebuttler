import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user belongs to this company
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
      <div className="login-container">
        <div className="login-header">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
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