import React from 'react';

// Test component that throws an error
const BuggyComponent = () => {
  throw new Error('This is a test error');
};

// Simple ErrorBoundary for testing
class TestErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Test ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          color: 'red', 
          textAlign: 'center',
          maxWidth: '600px',
          margin: '40px auto',
          border: '1px solid red',
          borderRadius: '4px'
        }}>
          <h2>Error Boundary Test - Working!</h2>
          <p>Error: {this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ErrorBoundaryTest = () => {
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
            <h1 style={{ margin: 0 }}>Error Boundary Test</h1>
            <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
              Testing if error boundaries work correctly
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
              <strong>Test Info:</strong><br />
              This page tests if the ErrorBoundary component is working correctly.<br />
              If you see an error message below, the ErrorBoundary is working.<br />
              If you see a white screen or the app crashes, there's an issue.
            </div>
            
            <TestErrorBoundary>
              <BuggyComponent />
            </TestErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundaryTest; 