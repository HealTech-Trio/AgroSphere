// hooks/useAgronomists.js
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore } from '../firebase';
import { agronomistsData } from '../screens/Agronomist/data'; 

export const useAgronomists = () => {
  const [firebaseAgronomists, setFirebaseAgronomists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const agronomistsQuery = query(
      collection(firestore, 'agronomists'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(
      agronomistsQuery,
      (querySnapshot) => {
        const agronomistsFromFirebase = [];
        querySnapshot.forEach((doc) => {
          agronomistsFromFirebase.push({ 
            id: doc.id, 
            ...doc.data(),
            source: 'firebase' // Mark as from Firebase
          });
        });
        setFirebaseAgronomists(agronomistsFromFirebase);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching agronomists:', error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Combine hardcoded and Firebase agronomists
  const allAgronomists = [
    ...agronomistsData.map(ag => ({ ...ag, source: 'hardcoded' })), // Mark as hardcoded
    ...firebaseAgronomists
  ];

  return { 
    agronomists: allAgronomists, 
    loading, 
    error,
    firebaseAgronomists,
    hardcodedAgronomists: agronomistsData
  };
};