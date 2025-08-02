import React, { useState, useEffect } from 'react';
import { initializeFirebase, auth, getDb } from '../../services/firebase/config';
import { getDocs, collection } from 'firebase/firestore';

const FirebaseTest = () => {
  const [testResults, setTestResults] = useState({
    firebaseInit: 'pending',
    auth: 'pending',
    firestore: 'pending',
    collections: 'pending'
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const runTests = async () => {
      try {
        console.log('🔍 FirebaseTest: Starting Firebase tests...');

        // Test 1: Firebase Initialization
        try {
          console.log('🔍 FirebaseTest: Testing Firebase initialization...');
          await initializeFirebase();
          setTestResults(prev => ({ ...prev, firebaseInit: 'success' }));
          console.log('✅ FirebaseTest: Firebase initialized successfully');
        } catch (error) {
          console.error('❌ FirebaseTest: Firebase initialization failed:', error);
          setTestResults(prev => ({ ...prev, firebaseInit: 'error' }));
          setError(`Firebase initialization failed: ${error.message}`);
          return;
        }

        // Test 2: Auth
        try {
          console.log('🔍 FirebaseTest: Testing Auth...');
          if (auth) {
            console.log('✅ FirebaseTest: Auth is available');
            setTestResults(prev => ({ ...prev, auth: 'success' }));
          } else {
            throw new Error('Auth is not available');
          }
        } catch (error) {
          console.error('❌ FirebaseTest: Auth test failed:', error);
          setTestResults(prev => ({ ...prev, auth: 'error' }));
        }

        // Test 3: Firestore
        try {
          console.log('🔍 FirebaseTest: Testing Firestore...');
          if (getDb()) {
            console.log('✅ FirebaseTest: Firestore is available');
            setTestResults(prev => ({ ...prev, firestore: 'success' }));
          } else {
            throw new Error('Firestore is not available');
          }
        } catch (error) {
          console.error('❌ FirebaseTest: Firestore test failed:', error);
          setTestResults(prev => ({ ...prev, firestore: 'error' }));
        }

        // Test 4: Collections
        try {
          console.log('🔍 FirebaseTest: Testing Firestore collections...');
          const collections = ['rebuttals', 'categories', 'admins', 'users'];
          let accessibleCollections = [];

          for (const collectionName of collections) {
            try {
              const snapshot = await getDocs(collection(getDb(), collectionName));
              console.log(`✅ FirebaseTest: Collection '${collectionName}' is accessible (${snapshot.size} documents)`);
              accessibleCollections.push(collectionName);
            } catch (error) {
              console.log(`⚠️ FirebaseTest: Collection '${collectionName}' is not accessible:`, error.message);
            }
          }

          if (accessibleCollections.length > 0) {
            setTestResults(prev => ({ 
              ...prev, 
              collections: 'success',
              accessibleCollections 
            }));
          } else {
            setTestResults(prev => ({ ...prev, collections: 'error' }));
          }
        } catch (error) {
          console.error('❌ FirebaseTest: Collections test failed:', error);
          setTestResults(prev => ({ ...prev, collections: 'error' }));
        }

        console.log('🔍 FirebaseTest: All tests completed');
      } catch (error) {
        console.error('❌ FirebaseTest: Test suite failed:', error);
        setError(`Test suite failed: ${error.message}`);
      }
    };

    runTests();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success': return '✅ Success';
      case 'error': return '❌ Error';
      case 'pending': return '⏳ Pending';
      default: return '❓ Unknown';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto'
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
            <h1 style={{ margin: 0 }}>Firebase Connection Test</h1>
            <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
              Testing Firebase configuration and connectivity
            </p>
          </div>
          
          <div style={{ padding: '20px' }}>
            {error && (
              <div style={{ 
                backgroundColor: '#f8d7da', 
                border: '1px solid #f5c6cb', 
                borderRadius: '4px', 
                padding: '15px', 
                marginBottom: '20px',
                color: '#721c24'
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <h3>Test Results</h3>
              {Object.entries(testResults).map(([test, status]) => (
                <div key={test} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px',
                  borderBottom: '1px solid #e9ecef',
                  backgroundColor: status === 'pending' ? '#f8f9fa' : 'white'
                }}>
                  <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {test.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span style={{ 
                    color: getStatusColor(status),
                    fontWeight: 'bold'
                  }}>
                    {getStatusText(status)}
                  </span>
                </div>
              ))}
            </div>

            {testResults.collections === 'success' && testResults.accessibleCollections && (
              <div style={{ 
                backgroundColor: '#d4edda', 
                border: '1px solid #c3e6cb', 
                borderRadius: '4px', 
                padding: '15px',
                marginBottom: '20px'
              }}>
                <strong>Accessible Collections:</strong>
                <ul style={{ margin: '10px 0 0 0' }}>
                  {testResults.accessibleCollections.map(collection => (
                    <li key={collection}>{collection}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ 
              backgroundColor: '#e9ecef', 
              padding: '15px', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <strong>Environment Info:</strong><br />
              Environment: {import.meta.env.MODE}<br />
              Firebase API Key: {import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Not Set'}<br />
              Firebase Project ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Set' : 'Not Set'}<br />
              Timestamp: {new Date().toLocaleString()}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Run Tests Again
              </button>
              <button 
                onClick={() => window.history.back()} 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseTest; 