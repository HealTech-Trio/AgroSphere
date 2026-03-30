// screens/Profile/HelpCenterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Linking,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const HelpCenterScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // FAQ Data
  const faqSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'rocket',
      questions: [
        {
          id: 1,
          question: 'How do I set up my farm profile?',
          answer: 'Go to your Profile screen, tap on "Farm Details", and add your farm information including location, size, and farm type. You can add multiple farms if needed.'
        },
        {
          id: 2,
          question: 'How do I add my crops?',
          answer: 'Navigate to the Home screen and tap "My Crops". From there, you can add new crops, track their growth stages, and monitor their health.'
        },
        {
          id: 3,
          question: 'How does the AI Assistant work?',
          answer: 'The AI Assistant uses machine learning to provide personalized farming advice. Ask questions about crop care, pest control, weather impacts, or best practices for your specific farm conditions.'
        }
      ]
    },
    {
      id: 'subscription',
      title: 'Subscription & Payments',
      icon: 'card',
      questions: [
        {
          id: 4,
          question: 'What features are included in the free plan?',
          answer: 'The free plan includes basic farm management, weather alerts, and limited access to the AI Assistant. You can manage up to 2 farms with basic features.'
        },
        {
          id: 5,
          question: 'How do I upgrade to Premium?',
          answer: 'Go to Profile → Subscription, choose the Premium plan, and complete the payment through our secure banking integration.'
        },
        {
          id: 6,
          question: 'Can I cancel my subscription anytime?',
          answer: 'Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: 'build',
      questions: [
        {
          id: 7,
          question: 'The app is crashing, what should I do?',
          answer: 'Try restarting the app and your device. If the issue persists, go to Profile → Contact Support and report the issue with details about your device and what you were doing when it crashed.'
        },
        {
          id: 8,
          question: 'How do I reset my password?',
          answer: 'Go to Profile → Security, then tap "Change Password". You\'ll receive an email with instructions to reset your password.'
        },
        {
          id: 9,
          question: 'Is my data secure?',
          answer: 'Yes, we use industry-standard encryption and security measures to protect your farm data. Your information is stored securely and never shared with third parties without your consent.'
        }
      ]
    },
    {
      id: 'farming',
      title: 'Farming Features',
      icon: 'leaf',
      questions: [
        {
          id: 10,
          question: 'How accurate are the weather predictions?',
          answer: 'Our weather data comes from reliable meteorological sources and is updated hourly. Accuracy is typically within 90% for 24-hour forecasts and 80% for 7-day forecasts.'
        },
        {
          id: 11,
          question: 'Can I schedule irrigation with the app?',
          answer: 'Yes, Premium users can set up automated irrigation schedules based on soil moisture data and weather forecasts. Go to Analysis → Smart Irrigation to set up your schedule.'
        },
        {
          id: 12,
          question: 'How do I get pest control advice?',
          answer: 'Use the AI Assistant to describe pest issues, or go to Analysis → Crop Health to upload photos of affected plants for AI-powered diagnosis and treatment recommendations.'
        }
      ]
    }
  ];

  // Contact methods
  const contactMethods = [
    {
      id: 'email',
      title: 'Email Support',
      description: 'Get help via email',
      icon: 'mail',
      color: '#0B8457',
      action: () => Linking.openURL('mailto:support@agrisphere.com?subject=Help Center Support')
    },
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Chat with our team',
      icon: 'chatbubbles',
      color: '#FF9800',
      action: () => Alert.alert('Live Chat', 'Live chat feature coming soon!')
    },
    {
      id: 'call',
      title: 'Call Support',
      description: 'Speak directly with us',
      icon: 'call',
      color: '#2196F3',
      action: () => Linking.openURL('tel:+27123456789')
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      description: 'Message us on WhatsApp',
      icon: 'logo-whatsapp',
      color: '#25D366',
      action: () => Linking.openURL('https://wa.me/27123456789?text=Hi%20agrisphere%20Support,%20I%20need%20help%20with...')
    }
  ];

  // Filter FAQs based on search
  const filteredFaqs = faqSections.map(section => ({
    ...section,
    questions: section.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.questions.length > 0);

  const toggleFaq = (faqId) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const ContactCard = ({ item }) => (
    <TouchableOpacity style={styles.contactCard} onPress={item.action}>
      <LinearGradient
        colors={[item.color, `${item.color}DD`]}
        style={styles.contactIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={item.icon} size={24} color="white" />
      </LinearGradient>
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>{item.title}</Text>
        <Text style={styles.contactDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const FaqItem = ({ question, answer, isExpanded, onToggle }) => (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.faqQuestion} onPress={onToggle}>
        <Text style={styles.faqQuestionText}>{question}</Text>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#0B8457" 
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{answer}</Text>
        </View>
      )}
    </View>
  );

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
          <Text style={styles.headerTitle}>Help Center</Text>
          <Text style={styles.headerSubtitle}>We're here to help you</Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help Quickly</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred contact method</Text>
          <View style={styles.contactGrid}>
            {contactMethods.map((method) => (
              <ContactCard key={method.id} item={method} />
            ))}
          </View>
        </View>

        {/* FAQ Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.sectionSubtitle}>Find answers to common questions</Text>
          
          {filteredFaqs.map((section) => (
            <View key={section.id} style={styles.faqSection}>
              <View style={styles.faqSectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name={section.icon} size={20} color="#0B8457" />
                </View>
                <Text style={styles.faqSectionTitle}>{section.title}</Text>
              </View>
              
              <View style={styles.faqList}>
                {section.questions.map((faq) => (
                  <FaqItem
                    key={faq.id}
                    question={faq.question}
                    answer={faq.answer}
                    isExpanded={expandedFaq === faq.id}
                    onToggle={() => toggleFaq(faq.id)}
                  />
                ))}
              </View>
            </View>
          ))}

          {filteredFaqs.length === 0 && (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#CCC" />
              <Text style={styles.noResultsText}>No results found</Text>
              <Text style={styles.noResultsSubtext}>Try different keywords or contact support</Text>
            </View>
          )}
        </View>

        {/* Support Card */}
        <View style={styles.supportCard}>
          <View style={styles.supportIcon}>
            <Ionicons name="help-buoy" size={32} color="#0B8457" />
          </View>
          <Text style={styles.supportTitle}>Still Need Help?</Text>
          <Text style={styles.supportText}>
            Our support team is available 24/7 to assist you with any questions or issues you might have.
          </Text>
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={() => Linking.openURL('mailto:support@agrisphere.com')}
          >
            <Text style={styles.supportButtonText}>Contact Support Team</Text>
          </TouchableOpacity>
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
    paddingBottom: 20,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A2332',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  contactGrid: {
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: '#666',
  },
  faqSection: {
    marginBottom: 20,
  },
  faqSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  faqSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
  },
  faqList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A2332',
    marginRight: 12,
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#F8F8F8',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  supportCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 24,
     marginBottom: 60,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  supportIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#0B8457',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  supportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HelpCenterScreen;