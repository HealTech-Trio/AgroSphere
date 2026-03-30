import { useNavigation } from '@react-navigation/native';
import FarmDetailsButton from './components/FarmDetailsButton';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Switch,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Ionicons, 
  MaterialIcons,
  FontAwesome5,
  Feather,
  MaterialCommunityIcons 
} from '@expo/vector-icons';
import ProfileHeader from './components/ProfileHeader';
import ProfileSection from './components/ProfileSection';
import ProfileMenuItem from './components/ProfileMenuItem';
import { COLORS } from '../../constants/colors';

// Firebase imports
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc, collection, query, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase';

// ADD THIS IMPORT
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../context/NotificationsContext'; // FIXED PATH

const ProfileScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // ADD THIS HOOK
  const { t, i18n } = useTranslation();
  const { notificationsEnabled, setNotificationsEnabled } = useNotifications(); // Use context instead of local state
  const [refreshKey, setRefreshKey] = useState(0);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef();
  // REMOVED: notificationsEnabled state - now using context
  // REMOVED: darkModeEnabled state
  const [activeSection, setActiveSection] = useState('Profile');
  const [farmCount, setFarmCount] = useState(0);
  
  // State for profile picture and farmer details - ALL from database
  const [profileImage, setProfileImage] = useState(null);
  const [farmerName, setFarmerName] = useState("");
  const [farmerTitle, setFarmerTitle] = useState("");
  const [farmerLocation, setFarmerLocation] = useState("");
  const [farmerBio, setFarmerBio] = useState("");
  const [farmerExperience, setFarmerExperience] = useState("");
  const [farmerSpecialization, setFarmerSpecialization] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Section positions
  const sectionPositions = useRef({
    profile: 0,
    account: 0,
    preferences: 0,
    support: 0,
    actions: 0
  }).current;

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  // ADD THIS: Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setRefreshKey(prev => prev + 1);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Fetch user data from Firebase
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    // Fetch user data from Firestore
    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        
        // Update ALL profile information from database
        setFarmerName(data.displayName || user.displayName || "Farmer");
        setFarmerTitle(data.title || data.farmerTitle || "Professional Farmer");
        setFarmerLocation(data.location || data.farmerLocation || "Set your location");
        setFarmerBio(data.bio || data.farmerBio || "Tell us about your farming experience");
        setFarmerExperience(data.experience || data.farmerExperience || "");
        setFarmerSpecialization(data.specialization || data.farmerSpecialization || "");
        
        // Set profile image if available
        if (data.photoURL) {
          setProfileImage(data.photoURL);
        } else if (user.photoURL) {
          setProfileImage(user.photoURL);
        }
        
        setLoading(false);
      } else {
        // User document doesn't exist, set defaults
        console.log("No user document found");
        setFarmerName(user.displayName || "Farmer");
        setFarmerTitle("Professional Farmer");
        setFarmerLocation("Set your location");
        setFarmerBio("Tell us about your farming experience");
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching user data:", error);
      setLoading(false);
    });

    // Fetch farm count
    fetchFarmCount(user.uid);

    return () => unsubscribe();
  }, []);

  // Fetch farm count from user's farms collection
  const fetchFarmCount = async (userId) => {
    try {
      const farmsQuery = query(collection(firestore, 'users', userId, 'farms'));
      const querySnapshot = await getDocs(farmsQuery);
      setFarmCount(querySnapshot.size);
    } catch (error) {
      console.error("Error fetching farm count:", error);
      setFarmCount(0);
    }
  };

  useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const farmsQuery = query(collection(firestore, 'users', user.uid, 'farms'));
  
  const unsubscribe = onSnapshot(farmsQuery, (snapshot) => {
    setFarmCount(snapshot.size);
  }, (error) => {
    console.error("Error listening to farm count:", error);
    setFarmCount(0);
  });

  return () => unsubscribe();
  }, []);

  // Update active section based on scroll position
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      if (value >= sectionPositions.actions - 100) {
        setActiveSection(t('actions') || 'Actions');
      } else if (value >= sectionPositions.support - 100) {
        setActiveSection(t('support') || 'Support');
      } else if (value >= sectionPositions.preferences - 100) {
        setActiveSection(t('preferences') || 'Preferences');
      } else if (value >= sectionPositions.account - 100) {
        setActiveSection(t('account') || 'Account');
      } else {
        setActiveSection(t('profile') || 'Profile');
      }
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, sectionPositions, t]);

  // Function to update section positions
  const updateSectionPosition = (sectionName, yPosition) => {
    sectionPositions[sectionName.toLowerCase()] = yPosition;
  };

  // Handle farm details press
  const handleFarmDetailsPress = () => {
    navigation.navigate('FarmDetails', {
      farmCount: farmCount,
      farmerName: farmerName,
    });
  };

  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert(
      t('signOut') || "Sign Out",
      t('confirmSignOut') || "Are you sure you want to sign out?",
      [
        {
          text: t('cancel') || "Cancel",
          style: "cancel"
        },
        {
          text: t('signOut') || "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert(t('error') || "Error", t('signOutFailed') || "Failed to sign out. Please try again.");
            }
          }
        }
      ]
    );
  };

  // Function to handle editing farmer details - Now navigates to edit screen
  const handleEditFarmerDetails = () => {
    navigation.navigate('EditProfile', {
      userData: {
        displayName: farmerName,
        title: farmerTitle,
        location: farmerLocation,
        bio: farmerBio,
        experience: farmerExperience,
        specialization: farmerSpecialization,
        photoURL: profileImage,
      }
    });
  };

  // Handle notifications toggle
  const handleNotificationsToggle = async (enabled) => {
    setNotificationsEnabled(enabled);
    
    // Optional: Save the preference to Firebase
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(firestore, 'users', user.uid), {
          notificationsEnabled: enabled,
          notificationsLastUpdated: new Date()
        });
      } catch (error) {
        console.error("Error updating notifications preference:", error);
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>{t('loadingProfile') || 'Loading profile...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} key={refreshKey}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.inkDark} />

      {/* Fixed Hero Header */}
      <LinearGradient
        colors={[COLORS.inkDark, COLORS.inkSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroHeader}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroTitle}>My</Text>
              <Text style={styles.heroTitle2}>Profile</Text>
            </View>
            <TouchableOpacity style={styles.heroEditButton} onPress={handleEditFarmerDetails}>
              <Ionicons name="pencil" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroSub}>
            Account · Farm details · Preferences
          </Text>
        </View>
        <View style={styles.heroDeco1} />
        <View style={styles.heroDeco2} />
      </LinearGradient>

      <View style={styles.contentSheet}>

      {/* Main Content */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Profile Header Section */}
        <View 
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            updateSectionPosition('profile', layout.y);
          }}
        >
          <ProfileHeader 
            profileImage={profileImage}
            onImageChange={setProfileImage}
            farmerName={farmerName}
            farmerTitle={farmerTitle}
            farmerLocation={farmerLocation}
            farmerBio={farmerBio}
            farmerExperience={farmerExperience}
            farmerSpecialization={farmerSpecialization}
          />
        </View>

        {/* Account Section */}
        <View 
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            updateSectionPosition('account', layout.y);
          }}
        >
          <ProfileSection title={t('account') || "Account"}>
            <ProfileMenuItem
              icon="person-outline"
              title={t('personalInfo') || "Personal Information"}
              description={t('updatePersonalDetails') || "Update your personal details"}
              onPress={handleEditFarmerDetails}
            />
            
            <ProfileMenuItem
              icon="business"
              title={t('farmDetails') || "Farm Details"}
              description={farmCount > 0 
                ? `${farmCount} ${t('farm') || 'farm'}${farmCount > 1 ? t('pluralSuffix') || 's' : ''} ${t('registered') || 'registered'}`
                : t('addFarmInformation') || 'Add your farm information'
              }
              onPress={handleFarmDetailsPress}
            />
            
            <ProfileMenuItem
              icon="shield-checkmark"
              title={t('security') || "Security"}
              description={t('changePasswordSecurity') || "Change password & security settings"}
              onPress={() => navigation.navigate('Security')}
            />
            
            <ProfileMenuItem
              icon="card"
              title={t('subscription') || "Subscription"}
              description={t('managePremiumPlan') || "Manage your premium plan"}
              badge={t('premium') || "Premium"}
              onPress={() => navigation.navigate('Subscription')}
            />
          </ProfileSection>
        </View>

        {/* Preferences Section */}
        <View 
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            updateSectionPosition('preferences', layout.y);
          }}
        >
          <ProfileSection title={t('preferences') || "Preferences"}>
            <ProfileMenuItem
              icon="notifications"
              title={t('pushNotifications') || "Push Notifications"}
              description={t('receiveImportantUpdates') || "Receive important updates"}
              customRight={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationsToggle}
                  trackColor={{ false: '#E0E0E0', true: 'rgba(11, 132, 87, 0.3)' }}
                  thumbColor={notificationsEnabled ? '#0B8457' : '#F5F5F5'}
                />
              }
            />
            
            {/* REMOVED: Dark Mode menu item */}
            
            <ProfileMenuItem
              icon="language"
              title={t('language') || "Language"}
             description={`${
  i18n.language === 'en' ? 'English' :
  i18n.language === 'zu' ? 'Zulu' :
  i18n.language === 'xh' ? 'Xhosa' :
  i18n.language === 'af' ? 'Afrikaans' :
  i18n.language === 'nso' ? 'Sepedi' :
  i18n.language === 'tn' ? 'Setswana' :
  i18n.language === 'st' ? 'Sesotho' :
  i18n.language === 'ts' ? 'Xitsonga' :
  i18n.language === 'ss' ? 'siSwati' :
  i18n.language === 've' ? 'Tshivenda' :
  i18n.language === 'nr' ? 'isiNdebele' : 'English'
} (${i18n.language.toUpperCase()})`}
              onPress={() => navigation.navigate('Language')}
            />
            
            <ProfileMenuItem
              icon="water"
              title={t('units') || "Units"}
              description={t('metricUnits') || "Metric (hectares, °C)"}
              onPress={() => console.log('Units')}
            />
          </ProfileSection>
        </View>

        {/* Support Section */}
        <View 
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            updateSectionPosition('support', layout.y);
          }}
        >
          <ProfileSection title={t('support') || "Support"}>
            <ProfileMenuItem
              icon="help-circle"
              title={t('helpCenter') || "Help Center"}
              description={t('findAnswersToQuestions') || "Find answers to common questions"}
              onPress={() => navigation.navigate('HelpCenter')}
            />
            <ProfileMenuItem
              icon="chatbubbles"
              title={t('contactSupport') || "Contact Support"}
              description={t('getHelpFromTeam') || "Get help from our team"}
              onPress={() => navigation.navigate('ContactSupport')}
            />
            <ProfileMenuItem
              icon="document-text"
              title={t('termsPrivacy') || "Terms & Privacy"}
              description={t('viewOurPolicies') || "View our policies"}
              onPress={() => navigation.navigate('TermsPrivacy')}
            />
          </ProfileSection>
        </View>

        {/* Actions Section */}
        <View 
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            updateSectionPosition('actions', layout.y);
          }}
        >
          <ProfileSection title={t('actions') || "Actions"}>
            <ProfileMenuItem
              icon="log-out"
              title={t('signOut') || "Sign Out"}
              color="#FF6B6B"
              onPress={handleSignOut}
            />
          </ProfileSection>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>AgriSphere v1.0.0</Text>
        </View>
      </Animated.ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroHeader: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 44, paddingHorizontal: 24,
    position: 'relative', overflow: 'hidden',
  },
  heroContent: { zIndex: 2 },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: { fontSize: 30, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  heroTitle2: { fontSize: 30, fontWeight: '900', color: COLORS.primaryLight, letterSpacing: -0.5 },
  heroSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500', marginTop: 6,
  },
  heroEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDeco1: {
    position: 'absolute', right: -30, top: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroDeco2: {
    position: 'absolute', right: 50, bottom: -50,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  contentSheet: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopRightRadius: 30,
    marginTop: -20,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 108,
  },
  versionText: {
    fontSize: 13,
    color: 'grey',
  },
  farmDetailsContainer: {
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginVertical: 8,
  },
});

export default ProfileScreen;