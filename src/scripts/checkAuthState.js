// Check browser localStorage for Firebase Auth data
const checkAuthState = () => {
  console.log('🔍 Checking browser localStorage for Firebase Auth data...');
  
  // Check for Firebase Auth data in localStorage
  const firebaseKeys = Object.keys(localStorage).filter(key => 
    key.includes('firebase') || key.includes('auth') || key.includes('user')
  );
  
  console.log('🔍 Firebase-related localStorage keys:', firebaseKeys);
  
  firebaseKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      console.log(`🔍 ${key}:`, value);
    } catch (error) {
      console.log(`🔍 Error reading ${key}:`, error);
    }
  });
  
  // Check for specific Firebase Auth keys
  const specificKeys = [
    'firebase:authUser:AIzaSyBRv9bUTYlueDw3AqQQC8zE5yVvGbkEdec:[DEFAULT]',
    'firebase:authUser:long-home-c034d.firebaseapp.com:[DEFAULT]'
  ];
  
  specificKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      console.log(`🔍 Found Firebase Auth data in ${key}:`, JSON.parse(value));
    } else {
      console.log(`🔍 No data found for ${key}`);
    }
  });
  
  // Check for any admin user data
  const adminUser = localStorage.getItem('adminUser');
  if (adminUser) {
    console.log('🔍 Found adminUser in localStorage:', JSON.parse(adminUser));
  } else {
    console.log('🔍 No adminUser found in localStorage');
  }
};

// Run the check
checkAuthState(); 