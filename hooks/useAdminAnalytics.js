// hooks/useAdminAnalytics.js
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase';

export const useAdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalFarmers: 0,
    totalAgronomists: 0,
    totalFarms: 0,
    activeUsers: 0,
    pendingVerifications: 0,
    hardcodedAgronomists: 20, // Your known hardcoded count
    customAgronomists: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalytics(prev => ({ ...prev, loading: true, error: null }));

        // Get all users
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Get all agronomists from Firebase
        const agronomistsSnapshot = await getDocs(collection(firestore, 'agronomists'));
        const customAgronomists = agronomistsSnapshot.size;

        // Count farms from users' farms subcollections
        let totalFarms = 0;
        for (const user of users) {
          try {
            const farmsSnapshot = await getDocs(collection(firestore, 'users', user.id, 'farms'));
            totalFarms += farmsSnapshot.size;
          } catch (error) {
            console.log(`No farms collection for user ${user.id} or error:`, error.message);
            // If no farms subcollection, check if user has farm data directly
            if (user.farmName || user.farmSize || user.farmLocation) {
              totalFarms += 1;
            }
          }
        }

        // Calculate metrics
        const totalFarmers = users.filter(user => 
          user.role === 'farmer' || !user.role || user.role === undefined
        ).length;

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const activeUsers = users.filter(user => {
          if (!user.lastLogin) return false;
          // Handle both timestamp and Date objects
          const lastLogin = user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin);
          return lastLogin >= oneWeekAgo;
        }).length;

        const pendingVerifications = users.filter(user => 
          user.emailVerified === false
        ).length;

        const totalAgronomists = customAgronomists + analytics.hardcodedAgronomists;

        setAnalytics({
          totalFarmers,
          totalAgronomists,
          totalFarms,
          activeUsers,
          pendingVerifications,
          hardcodedAgronomists: analytics.hardcodedAgronomists,
          customAgronomists,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching analytics:', error);
        setAnalytics(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchAnalytics();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  return analytics;
};