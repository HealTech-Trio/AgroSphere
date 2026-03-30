// screens/Profile/TermsPrivacyScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const TermsPrivacyScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('terms');

  // Define information officer separately to avoid circular reference
  const INFORMATION_OFFICER = 'support@agrisphere.com';

  // Terms of Service Content
  const termsContent = {
    lastUpdated: 'December 15, 2024',
    sections: [
      {
        id: 'acceptance',
        title: '1. Acceptance of Terms',
        content: `By accessing and using AgriSphere ("the App"), you agree to be bound by these Terms of Service and all applicable laws and regulations in South Africa. If you do not agree with any of these terms, you are prohibited from using the App.`
      },
      {
        id: 'license',
        title: '2. License to Use',
        content: `We grant you a limited, non-exclusive, non-transferable license to use the App for your personal farming operations. This license does not include any resale or commercial use of the App or its contents.`
      },
      {
        id: 'user-accounts',
        title: '3. User Accounts',
        content: `You must create an account to access certain features. You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.`
      },
      {
        id: 'prohibited',
        title: '4. Prohibited Activities',
        content: `You may not:
• Use the App for any unlawful purpose
• Share your account credentials
• Attempt to hack or disrupt the App's functionality
• Use automated systems to access the App
• Misrepresent your farming operations
• Violate any applicable South African laws`
      },
      {
        id: 'subscriptions',
        title: '5. Subscriptions and Payments',
        content: `Premium features require a subscription. Payments are processed through secure South African banking partners. Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period.`
      },
      {
        id: 'intellectual-property',
        title: '6. Intellectual Property',
        content: `All content, features, and functionality of the App are owned by AgriSphere and are protected by South African and international copyright, trademark, and other intellectual property laws.`
      },
      {
        id: 'termination',
        title: '7. Termination',
        content: `We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.`
      },
      {
        id: 'disclaimer',
        title: '8. Disclaimer',
        content: `The App is provided "as is". AgriSphere makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.`
      },
      {
        id: 'limitations',
        title: '9. Limitations of Liability',
        content: `In no event shall AgriSphere or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the App.`
      },
      {
        id: 'governing-law',
        title: '10. Governing Law',
        content: `These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa. Any disputes relating to these Terms shall be subject to the exclusive jurisdiction of the courts of South Africa.`
      }
    ]
  };

  // Privacy Policy Content (POPIA Compliant)
  const privacyContent = {
    lastUpdated: 'December 15, 2024',
    compliantWith: 'POPIA (Protection of Personal Information Act, 2013)',
    informationOfficer: INFORMATION_OFFICER,
    sections: [
      {
        id: 'introduction',
        title: '1. Introduction',
        content: `AgriSphere is committed to protecting your privacy and ensuring that your personal information is collected and used properly, lawfully, and transparently in compliance with the Protection of Personal Information Act (POPIA).`
      },
      {
        id: 'information-collected',
        title: '2. Information We Collect',
        content: `We collect the following personal information:
• Contact Information: Name, email, phone number
• Farm Details: Farm name, location, size, farm type
• Agricultural Data: Crop information, soil data, weather patterns
• Technical Data: Device information, app usage statistics
• Payment Information: Processed securely through banking partners`
      },
      {
        id: 'purpose',
        title: '3. How We Use Your Information',
        content: `We use your personal information to:
• Provide and improve our farming services
• Personalize your experience
• Send important updates and notifications
• Process payments and manage subscriptions
• Comply with legal obligations under South African law
• Conduct research to improve agricultural practices`
      },
      {
        id: 'sharing',
        title: '4. Information Sharing',
        content: `We do not sell your personal information. We may share information with:
• Service providers who assist in app operations
• Legal authorities when required by South African law
• Agricultural research institutions (anonymized data only)
• Banking partners for payment processing`
      },
      {
        id: 'data-security',
        title: '5. Data Security',
        content: `We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data is stored on secure servers with encryption.`
      },
      {
        id: 'data-retention',
        title: '6. Data Retention',
        content: `We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including for the purposes of satisfying any legal, accounting, or reporting requirements under South African law.`
      },
      {
        id: 'your-rights',
        title: '7. Your Rights Under POPIA',
        content: `You have the right to:
• Access your personal information
• Correct inaccurate information
• Request deletion of your information
• Object to processing of your information
• File a complaint with the Information Regulator
• Withdraw consent for processing`
      },
      {
        id: 'cookies',
        title: '8. Cookies and Tracking',
        content: `We use cookies and similar technologies to enhance your experience, analyze app usage, and assist in our marketing efforts. You can control cookie preferences through your device settings.`
      },
      {
        id: 'children',
        title: '9. Children\'s Privacy',
        content: `Our App is not directed to individuals under 18. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take steps to delete such information.`
      },
      {
        id: 'changes',
        title: '10. Changes to Privacy Policy',
        content: `We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "last updated" date.`
      },
      {
        id: 'contact',
        title: '11. Contact Information',
        content: `For any questions about this Privacy Policy or our data practices, please contact our Information Officer at ${INFORMATION_OFFICER}`
      }
    ]
  };

  const openExternalLink = (url) => {
    Linking.openURL(url).catch(err => 
      Alert.alert('Error', 'Could not open the link. Please try again.')
    );
  };

  const TabButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const ContentSection = ({ section }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionContent}>{section.content}</Text>
    </View>
  );

  const currentContent = activeTab === 'terms' ? termsContent : privacyContent;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header Gradient */}
      <LinearGradient
        colors={['rgba(11, 132, 87, 0.08)', 'transparent']}
        style={[styles.gradientHeader, { height: insets.top + 160 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#2E2E2E" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Last updated: {currentContent.lastUpdated}
            {activeTab === 'privacy' && ` • ${currentContent.compliantWith}`}
          </Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TabButton
          title="Terms of Service"
          isActive={activeTab === 'terms'}
          onPress={() => setActiveTab('terms')}
        />
        <TabButton
          title="Privacy Policy"
          isActive={activeTab === 'privacy'}
          onPress={() => setActiveTab('privacy')}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction Card */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons 
              name={activeTab === 'terms' ? "document-text" : "shield-checkmark"} 
              size={32} 
              color="#0B8457" 
            />
          </View>
          <Text style={styles.introTitle}>
            {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
          </Text>
          <Text style={styles.introText}>
            {activeTab === 'terms' 
              ? 'Please read these terms carefully before using our application.'
              : 'Learn how we protect your personal information in compliance with South African law.'
            }
          </Text>
        </View>

        {/* Content Sections */}
        <View style={styles.contentContainer}>
          {currentContent.sections.map((section) => (
            <ContentSection key={section.id} section={section} />
          ))}
        </View>

        {/* Legal Resources */}
        <View style={styles.legalCard}>
          <Text style={styles.legalTitle}>Legal Resources</Text>
          <Text style={styles.legalText}>
            For more information about South African data protection laws:
          </Text>
          
          <TouchableOpacity 
            style={styles.legalLink}
            onPress={() => openExternalLink('https://www.justice.gov.za/inforeg/')}
          >
            <Ionicons name="link" size={16} color="#0B8457" />
            <Text style={styles.legalLinkText}>Information Regulator South Africa</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.legalLink}
            onPress={() => openExternalLink('https://www.gov.za/documents/protection-personal-information-act')}
          >
            <Ionicons name="link" size={16} color="#0B8457" />
            <Text style={styles.legalLinkText}>POPIA Legislation</Text>
          </TouchableOpacity>

          {activeTab === 'privacy' && (
            <TouchableOpacity 
              style={styles.legalLink}
              onPress={() => openExternalLink(`mailto:${INFORMATION_OFFICER}`)}
            >
              <Ionicons name="mail" size={16} color="#0B8457" />
              <Text style={styles.legalLinkText}>Contact Information Officer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Acceptance Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using AgriSphere, you acknowledge that you have read and understood{' '}
            {activeTab === 'terms' ? 'these Terms of Service' : 'this Privacy Policy'}.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  gradientHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#0B8457',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  introCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  legalCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
  },
  legalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  legalLinkText: {
    fontSize: 14,
    color: '#0B8457',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    marginHorizontal: 20,
    padding: 16,
     marginBottom: 60,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0B8457',
  },
  footerText: {
    fontSize: 14,
    color: '#1A2332',
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default TermsPrivacyScreen;