import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      
      if (user) {
        setUser(user);
        
        // Check if user has completed onboarding and get role
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Set user role (default to 'farmer' if not specified)
            setUserRole(userData.role || 'farmer');
            
            // If onboardingCompleted field exists and is true, set it to true
            // Otherwise, it's false (user needs to complete onboarding)
            setOnboardingCompleted(userData.onboardingCompleted === true);
          } else {
            // User document doesn't exist yet
            setUserRole('farmer');
            setOnboardingCompleted(false);
          }
        } catch (error) {
          console.error('Error checking user data:', error);
          setUserRole('farmer');
          setOnboardingCompleted(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setOnboardingCompleted(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, userRole, loading, onboardingCompleted };
};