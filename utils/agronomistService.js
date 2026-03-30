// utils/agronomistService.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const AGRONOMISTS_COLLECTION = 'agronomists';

// Get all agronomists from Firebase (only custom ones)
export const getAgronomists = async () => {
  try {
    const q = query(
      collection(firestore, AGRONOMISTS_COLLECTION), 
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    const agronomists = [];
    querySnapshot.forEach((doc) => {
      agronomists.push({ 
        id: doc.id, 
        ...doc.data(),
        source: 'firebase' // Mark as custom
      });
    });
    return agronomists;
  } catch (error) {
    console.error('Error getting agronomists:', error);
    throw error;
  }
};

// Get a single agronomist by ID
export const getAgronomistById = async (id) => {
  try {
    const docRef = doc(firestore, AGRONOMISTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { 
        id: docSnap.id, 
        ...docSnap.data(),
        source: 'firebase'
      };
    } else {
      throw new Error('Agronomist not found');
    }
  } catch (error) {
    console.error('Error getting agronomist:', error);
    throw error;
  }
};

// Upload image to Firebase Storage and return download URL
export const uploadAgronomistImage = async (imageUri, agronomistId) => {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Create storage reference
    const storageRef = ref(storage, `agronomists/${agronomistId}/profile.jpg`);
    
    // Upload image
    const snapshot = await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Add new agronomist
export const addAgronomist = async (agronomistData) => {
  try {
    let profileImageUrl = agronomistData.profileImage;
    
    // If profile image is a local URI (starts with file://), upload it to Firebase Storage
    if (agronomistData.profileImage && agronomistData.profileImage.startsWith('file://')) {
      // Create a temporary ID for the upload
      const tempId = Date.now().toString();
      profileImageUrl = await uploadAgronomistImage(agronomistData.profileImage, tempId);
    }
    
    const agronomistToSave = {
      ...agronomistData,
      profileImage: profileImageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'firebase'
    };

    const docRef = await addDoc(collection(firestore, AGRONOMISTS_COLLECTION), agronomistToSave);
    
    return { 
      id: docRef.id, 
      ...agronomistToSave 
    };
  } catch (error) {
    console.error('Error adding agronomist:', error);
    throw error;
  }
};

// Update agronomist
export const updateAgronomist = async (id, agronomistData) => {
  try {
    const agronomistRef = doc(firestore, AGRONOMISTS_COLLECTION, id);
    
    let profileImageUrl = agronomistData.profileImage;
    
    // If profile image is a local URI (starts with file://), upload it to Firebase Storage
    if (agronomistData.profileImage && agronomistData.profileImage.startsWith('file://')) {
      profileImageUrl = await uploadAgronomistImage(agronomistData.profileImage, id);
    }
    
    const updateData = {
      ...agronomistData,
      profileImage: profileImageUrl,
      updatedAt: new Date()
    };

    await updateDoc(agronomistRef, updateData);
    
    return { 
      id, 
      ...updateData 
    };
  } catch (error) {
    console.error('Error updating agronomist:', error);
    throw error;
  }
};

// Delete agronomist
export const deleteAgronomist = async (id) => {
  try {
    const agronomistRef = doc(firestore, AGRONOMISTS_COLLECTION, id);
    await deleteDoc(agronomistRef);
  } catch (error) {
    console.error('Error deleting agronomist:', error);
    throw error;
  }
};

// Search agronomists
export const searchAgronomists = async (searchTerm) => {
  try {
    const q = query(
      collection(firestore, AGRONOMISTS_COLLECTION),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    const agronomists = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const searchLower = searchTerm.toLowerCase();
      
      // Check if agronomist matches search term
      if (
        data.name?.toLowerCase().includes(searchLower) ||
        data.specialty?.toLowerCase().includes(searchLower) ||
        data.city?.toLowerCase().includes(searchLower) ||
        data.farmSpecialties?.some(specialty => 
          specialty.toLowerCase().includes(searchLower)
        ) ||
        data.languages?.some(language => 
          language.toLowerCase().includes(searchLower)
        )
      ) {
        agronomists.push({ 
          id: doc.id, 
          ...data,
          source: 'firebase'
        });
      }
    });
    
    return agronomists;
  } catch (error) {
    console.error('Error searching agronomists:', error);
    throw error;
  }
};

// Get agronomists by city
export const getAgronomistsByCity = async (city) => {
  try {
    const q = query(
      collection(firestore, AGRONOMISTS_COLLECTION),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    const agronomists = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.city?.toLowerCase() === city.toLowerCase()) {
        agronomists.push({ 
          id: doc.id, 
          ...data,
          source: 'firebase'
        });
      }
    });
    
    return agronomists;
  } catch (error) {
    console.error('Error getting agronomists by city:', error);
    throw error;
  }
};

// Get available agronomists
export const getAvailableAgronomists = async () => {
  try {
    const q = query(
      collection(firestore, AGRONOMISTS_COLLECTION),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    const agronomists = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.available === true) {
        agronomists.push({ 
          id: doc.id, 
          ...data,
          source: 'firebase'
        });
      }
    });
    
    return agronomists;
  } catch (error) {
    console.error('Error getting available agronomists:', error);
    throw error;
  }
};

// Get agronomists by specialty
export const getAgronomistsBySpecialty = async (specialty) => {
  try {
    const q = query(
      collection(firestore, AGRONOMISTS_COLLECTION),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    const agronomists = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (
        data.specialty?.toLowerCase().includes(specialty.toLowerCase()) ||
        data.farmSpecialties?.some(s => 
          s.toLowerCase().includes(specialty.toLowerCase())
        )
      ) {
        agronomists.push({ 
          id: doc.id, 
          ...data,
          source: 'firebase'
        });
      }
    });
    
    return agronomists;
  } catch (error) {
    console.error('Error getting agronomists by specialty:', error);
    throw error;
  }
};

// Get agronomist statistics
export const getAgronomistStats = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestore, AGRONOMISTS_COLLECTION));
    
    const stats = {
      total: 0,
      available: 0,
      byCity: {},
      bySpecialty: {},
      averageRating: 0,
      totalReviews: 0
    };
    
    let totalRating = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stats.total++;
      
      if (data.available) {
        stats.available++;
      }
      
      // Count by city
      if (data.city) {
        stats.byCity[data.city] = (stats.byCity[data.city] || 0) + 1;
      }
      
      // Count by specialty
      if (data.specialty) {
        stats.bySpecialty[data.specialty] = (stats.bySpecialty[data.specialty] || 0) + 1;
      }
      
      // Calculate ratings
      if (data.rating) {
        totalRating += data.rating;
      }
      
      if (data.reviews) {
        stats.totalReviews += data.reviews;
      }
    });
    
    stats.averageRating = stats.total > 0 ? totalRating / stats.total : 0;
    
    return stats;
  } catch (error) {
    console.error('Error getting agronomist stats:', error);
    throw error;
  }
};