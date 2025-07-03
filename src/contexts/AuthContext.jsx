import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, initializeFirebase } from '../services/firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Ensure Firebase is initialized
        await initializeFirebase();
        
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('Auth state changed:', user ? 'User logged in' : 'No user');
          setCurrentUser(user);
          setLoading(false);
        }, (error) => {
          console.error('Auth state change error:', error);
          setError(error);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Firebase initialization error:', error);
        setError(error);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const value = {
    currentUser,
    loading,
    error
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div>Loading application...</div>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>Please wait while we initialize Firebase</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        color: 'red',
        maxWidth: '600px',
        margin: '40px auto',
        border: '1px solid red',
        borderRadius: '4px'
      }}>
        <h2>Error Initializing App</h2>
        <p>{error.message}</p>
        <p>Please check your Firebase configuration and try refreshing the page.</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 