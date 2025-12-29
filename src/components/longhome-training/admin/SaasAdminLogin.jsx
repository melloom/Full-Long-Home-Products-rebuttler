import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, getDb } from '../../../services/firebase/config';
import './SaasAdminLogin.css';

const SaasAdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Check if user is a super admin or company admin
      const db = getDb();
      
      // First check if user is a super admin
      const superAdminDoc = await getDoc(doc(db, 'super-admins', user.uid));
      
      if (superAdminDoc.exists()) {
        const adminData = superAdminDoc.data();
        
        // Store admin info in localStorage
        const adminUser = {
          uid: user.uid,
          email: user.email,
          role: 'super-admin',
          ...adminData
        };
        localStorage.setItem('adminUser', JSON.stringify(adminUser));
        
        // Navigate to SaaS admin dashboard
        navigate('/admin/saas');
        return;
      }
      
      // Check if user is a company admin
      const companyAdminDoc = await getDoc(doc(db, 'company-admins', user.uid));
      
      if (companyAdminDoc.exists()) {
        const companyAdminData = companyAdminDoc.data();
        
        // Store company admin info in localStorage
        const adminUser = {
          uid: user.uid,
          email: user.email,
          role: 'company-admin',
          companyId: companyAdminData.companyId,
          ...companyAdminData
        };
        localStorage.setItem('adminUser', JSON.stringify(adminUser));
        
        // Navigate to company admin dashboard
        navigate('/admin/dashboard');
        return;
      }
      
      // If neither super admin nor company admin
      setError('Access denied. Super admin or company admin privileges required.');
      await auth.signOut();
    } catch (error) {
      console.error('Login error:', error);
      switch (error.code) {
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
          setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="saas-admin-login">
      <button 
        className="back-to-home-btn"
        onClick={() => navigate('/')}
      >
        ← Back to Home
      </button>
      <div className="login-container">
        <div className="login-header">
          <h1>🚀 Admin Login</h1>
          <p>Super Admin & Company Admin Access</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your admin email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
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
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Signing In...
              </>
            ) : (
              'Sign In to Admin Panel'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Need access? Contact the system administrator.</p>
        </div>
      </div>
    </div>
  );
};

export default SaasAdminLogin;