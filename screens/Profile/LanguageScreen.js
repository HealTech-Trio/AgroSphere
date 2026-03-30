// screens/Profile/LanguageScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const LanguageScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

 const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', description: 'Official business language' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦', description: 'Spoken by 23% of population' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦', description: 'Spoken by 16% of population' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', description: 'Spoken by 13% of population' },
  { code: 'nso', name: 'Sepedi', nativeName: 'Sesotho sa Leboa', flag: '🇿🇦', description: 'Spoken by 9% of population' },
  { code: 'tn', name: 'Setswana', nativeName: 'Setswana', flag: '🇿🇦', description: 'Spoken by 8% of population' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', flag: '🇿🇦', description: 'Spoken by 8% of population' },
  { code: 'ts', name: 'Xitsonga', nativeName: 'Xitsonga', flag: '🇿🇦', description: 'Spoken by 4% of population' },
  { code: 'ss', name: 'siSwati', nativeName: 'siSwati', flag: '🇿🇦', description: 'Spoken by 3% of population' },
  { code: 've', name: 'Tshivenda', nativeName: 'Tshivenda', flag: '🇿🇦', description: 'Spoken by 2% of population' },
  { code: 'nr', name: 'isiNdebele', nativeName: 'isiNdebele', flag: '🇿🇦', description: 'Spoken by 2% of population' }
];

  const handleLanguageSelect = async (languageCode) => {
    try {
      // Change app language
      await i18n.changeLanguage(languageCode);
      setSelectedLanguage(languageCode);
      
      // Save preference
      await AsyncStorage.setItem('appLanguage', languageCode);
      
      Alert.alert(
        'Language Updated',
        `App language changed to ${LANGUAGES.find(lang => lang.code === languageCode)?.name}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to change language');
    }
  };

  const LanguageCard = ({ language, isSelected }) => (
    <TouchableOpacity
      style={[styles.languageCard, isSelected && styles.languageCardSelected]}
      onPress={() => handleLanguageSelect(language.code)}
    >
      <Text style={styles.flag}>{language.flag}</Text>
      <View style={styles.languageInfo}>
        <Text style={styles.languageName}>{language.name}</Text>
        <Text style={styles.languageNativeName}>{language.nativeName}</Text>
      </View>
      {isSelected && <Ionicons name="checkmark-circle" size={24} color="#0B8457" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['rgba(11, 132, 87, 0.08)', 'transparent']}
        style={[styles.gradientHeader, { height: insets.top + 160 }]}
      />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#2E2E2E" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Language</Text>
          <Text style={styles.headerSubtitle}>Choose your preferred language</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Languages</Text>
          <View style={styles.languagesList}>
            {LANGUAGES.map((language) => (
              <LanguageCard
                key={language.code}
                language={language}
                isSelected={selectedLanguage === language.code}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  gradientHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20, zIndex: 1 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A2332', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#666' },
  headerRight: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 10 },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A2332', marginBottom: 16 },
  languagesList: { gap: 12 },
  languageCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  languageCardSelected: { borderWidth: 2, borderColor: '#0B8457' },
  flag: { fontSize: 24, marginRight: 12 },
  languageInfo: { flex: 1 },
  languageName: { fontSize: 16, fontWeight: '600', color: '#1A2332' },
  languageNativeName: { fontSize: 14, color: '#666' }
  
});

export default LanguageScreen;