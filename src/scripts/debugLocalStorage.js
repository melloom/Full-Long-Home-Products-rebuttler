// Debug localStorage and authentication state
const debugLocalStorage = () => {
  console.log('🔍 Debug: Checking localStorage...');
  
  // Check all localStorage keys
  const allKeys = Object.keys(localStorage);
  console.log('🔍 Debug: All localStorage keys:', allKeys);
  
  // Check for Firebase Auth data
  const firebaseKeys = allKeys.filter(key => 
    key.includes('firebase') || key.includes('auth') || key.includes('user')
  );
  console.log('🔍 Debug: Firebase-related keys:', firebaseKeys);
  
  // Check for admin user data
  const adminUser = localStorage.getItem('adminUser');
  console.log('🔍 Debug: adminUser in localStorage:', adminUser);
  
  if (adminUser) {
    try {
      const parsed = JSON.parse(adminUser);
      console.log('🔍 Debug: Parsed adminUser:', parsed);
    } catch (error) {
      console.log('🔍 Debug: Error parsing adminUser:', error);
    }
  }
  
  // Check for any other user-related data
  const userKeys = allKeys.filter(key => 
    key.includes('user') || key.includes('admin') || key.includes('login')
  );
  console.log('🔍 Debug: User-related keys:', userKeys);
  
  userKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      console.log(`🔍 Debug: ${key}:`, value);
    } catch (error) {
      console.log(`🔍 Debug: Error reading ${key}:`, error);
    }
  });
  
  // Check if user is logged in via Firebase Auth
  console.log('🔍 Debug: Checking if Firebase Auth is available...');
  if (typeof window !== 'undefined' && window.firebase) {
    console.log('🔍 Debug: Firebase is available in window');
  } else {
    console.log('🔍 Debug: Firebase not available in window');
  }
};

// Run the debug function
debugLocalStorage(); 