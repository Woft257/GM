// Firebase configuration
export const getFirebaseConfig = () => {
  // Check if we're in development or production
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    // Use environment variables in development
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  } else {
    // Hardcode for production (temporary fix)
    return {
      apiKey: "AIzaSyDUzpDW3Rldv5ni0S1j_NEgTC3A9GkgP1I",
      authDomain: "gmdb-d852b.firebaseapp.com",
      projectId: "gmdb-d852b",
      storageBucket: "gmdb-d852b.firebasestorage.app",
      messagingSenderId: "791233029183",
      appId: "1:791233029183:web:f7dcf077366d849497848a"
    };
  }
};
