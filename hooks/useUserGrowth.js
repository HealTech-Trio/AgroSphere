// hooks/useUserGrowth.js
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';

export const useUserGrowth = () => {
  const [growthData, setGrowthData] = useState({
    dailyGrowth: 0,
    weeklyGrowth: 0,
    monthlyGrowth: 0,
    loading: true
  });

  useEffect(() => {
    const fetchGrowthData = async () => {
      try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const usersRef = collection(firestore, 'users');
        
        // Daily growth
        const dailyQuery = query(usersRef, where('createdAt', '>=', oneDayAgo));
        const dailySnapshot = await getDocs(dailyQuery);
        
        // Weekly growth
        const weeklyQuery = query(usersRef, where('createdAt', '>=', oneWeekAgo));
        const weeklySnapshot = await getDocs(weeklyQuery);
        
        // Monthly growth
        const monthlyQuery = query(usersRef, where('createdAt', '>=', oneMonthAgo));
        const monthlySnapshot = await getDocs(monthlyQuery);

        setGrowthData({
          dailyGrowth: dailySnapshot.size,
          weeklyGrowth: weeklySnapshot.size,
          monthlyGrowth: monthlySnapshot.size,
          loading: false
        });

      } catch (error) {
        console.error('Error fetching growth data:', error);
        setGrowthData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchGrowthData();
  }, []);

  return growthData;
};