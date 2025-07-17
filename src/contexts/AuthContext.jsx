import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
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
        console.log('🔍 AuthContext: Starting Firebase initialization...');
        
        // Ensure Firebase is initialized
        await initializeFirebase();
        
        console.log('🔍 AuthContext: Firebase initialized, setting up auth listener...');
        
        // Check if there's a stored admin user in localStorage
        const storedAdminUser = localStorage.getItem('adminUser');
        console.log('🔍 AuthContext: Stored admin user:', storedAdminUser ? JSON.parse(storedAdminUser) : 'None');
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log('🔍 AuthContext: Auth state changed:', user ? `User logged in (${user.email})` : 'No user');
          console.log('🔍 AuthContext: User details:', user ? {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName
          } : 'No user');
          
          if (user) {
            // User is authenticated with Firebase Auth
            console.log('🔍 AuthContext: User authenticated via Firebase Auth');
            setCurrentUser(user);
            setLoading(false);
          } else {
            // No Firebase Auth user, check localStorage
            if (storedAdminUser) {
              console.log('🔍 AuthContext: No Firebase Auth user, but found stored admin user');
              console.log('🔍 AuthContext: Attempting to restore session from localStorage');
              
              try {
                const parsedStoredUser = JSON.parse(storedAdminUser);
                console.log('🔍 AuthContext: Restoring user from localStorage:', parsedStoredUser.email);
                
                // Set the current user from localStorage
                setCurrentUser({
                  uid: parsedStoredUser.uid,
                  email: parsedStoredUser.email,
                  displayName: parsedStoredUser.displayName,
                  emailVerified: parsedStoredUser.emailVerified || false,
                  // Add a flag to indicate this is from localStorage
                  fromLocalStorage: true
                });
              } catch (error) {
                console.error('🔍 AuthContext: Error parsing stored user:', error);
                // Clear invalid localStorage data
                localStorage.removeItem('adminUser');
                setCurrentUser(null);
              }
            } else {
              // No user in either Firebase Auth or localStorage
              console.log('🔍 AuthContext: No user found in Firebase Auth or localStorage - this is normal for new users');
              setCurrentUser(null);
            }
            setLoading(false);
          }
        }, (error) => {
          console.error('🔍 AuthContext: Auth state change error:', error);
          setError(error);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('🔍 AuthContext: Firebase initialization error:', error);
        // Don't set error state, just continue without Firebase
        console.log('🔍 AuthContext: Continuing without Firebase authentication');
        setCurrentUser(null);
        setLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('🔍 AuthContext: Initialization timeout, continuing without Firebase');
        setLoading(false);
      }
    }, 3000); // 3 second timeout

    initialize();

    return () => clearTimeout(timeout);
  }, []);

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('adminUser');
  };

  // Function to attempt session restoration
  const attemptSessionRestoration = async (storedUser) => {
    try {
      console.log('🔍 AuthContext: Attempting to restore Firebase Auth session...');
      
      // Note: We can't restore the Firebase Auth session without the password
      // This is a limitation of Firebase Auth - it doesn't store passwords
      // So we'll rely on localStorage for session persistence
      
      console.log('🔍 AuthContext: Using localStorage for session persistence');
      return true;
    } catch (error) {
      console.error('🔍 AuthContext: Session restoration failed:', error);
      return false;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    logout,
    attemptSessionRestoration
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
        <div style={{ fontSize: '0.8rem', color: '#666' }}>Please wait while we initialize the application</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 