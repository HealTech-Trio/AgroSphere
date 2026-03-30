// screens/Profile/SubscriptionScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  Modal,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Linking } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Import bank images using the correct path
const bankImages = {
  fnb: require('../../assets/Images/banks/fnb.png'),
  absa: require('../../assets/Images/banks/absa.png'),
  standard: require('../../assets/Images/banks/standard.png'),
  nedbank: require('../../assets/Images/banks/nedbank.png'),
  capitec: require('../../assets/Images/banks/capitec.png'),
  investec: require('../../assets/Images/banks/investec.png')
};

const SubscriptionScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showBankingModal, setShowBankingModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);

  // South African banks with images
  const banks = [
    {
      id: 'fnb',
      name: 'First National Bank',
      image: 'fnb',
      url: 'https://www.fnb.co.za/'
    },
    {
      id: 'absa',
      name: 'ABSA',
      image: 'absa',
      url: 'https://www.absa.co.za/'
    },
    {
      id: 'standard',
      name: 'Standard Bank',
      image: 'standard',
      url: 'https://www.standardbank.co.za/'
    },
    {
      id: 'nedbank',
      name: 'Nedbank',
      image: 'nedbank',
      url: 'https://www.nedbank.co.za/'
    },
    {
      id: 'capitec',
      name: 'Capitec',
      image: 'capitec',
      url: 'https://www.capitecbank.co.za/'
    },
    {
      id: 'investec',
      name: 'Investec',
      image: 'investec',
      url: 'https://www.investec.com/'
    }
  ];

  const plans = {
    free: {
      name: 'Free',
      price: 'R0',
      period: 'forever',
      description: 'Basic farming features',
      features: [
        'Up to 2 farms',
        'Basic weather alerts',
        'Community support',
        'Limited crop scheduling'
      ],
      color: '#666',
      gradient: ['#9B9B9B', '#666']
    },
    premium: {
      name: 'Premium',
      price: billingCycle === 'monthly' ? 'R49' : 'R499',
      period: billingCycle === 'monthly' ? 'per month' : 'per year',
      description: 'Advanced farming tools',
      features: [
        'Unlimited farms',
        'Advanced weather alerts',
        'AI crop analysis',
        'Priority support',
        'Soil health monitoring',
        'Irrigation scheduling'
      ],
      color: '#0B8457',
      gradient: ['#0B8457', '#3AA83E']
    },
    enterprise: {
      name: 'Enterprise',
      price: 'Custom',
      period: 'tailored',
      description: 'For large farming operations',
      features: [
        'Everything in Premium',
        'Multi-user accounts',
        'API access',
        'Dedicated support',
        'Custom integrations',
        'Advanced analytics'
      ],
      color: '#FF9800',
      gradient: ['#FF9800', '#F57C00']
    }
  };

  const features = [
    {
      icon: 'chart-line',
      title: 'Advanced Analytics',
      description: 'Deep insights into crop performance and soil health'
    },
    {
      icon: 'weather-cloudy',
      title: 'Precision Weather',
      description: 'Hyper-local weather forecasts and alerts'
    },
    {
      icon: 'robot',
      title: 'AI Assistant',
      description: 'Smart recommendations for planting and harvesting'
    },
    {
      icon: 'water',
      title: 'Smart Irrigation',
      description: 'Automated irrigation scheduling based on soil data'
    }
  ];

  const handleSubscribe = (plan) => {
    if (plan === 'free') {
      Alert.alert('Free Plan', 'You are already on the free plan!');
      return;
    }

    // Show banking modal for paid plans
    setSelectedPlan(plan);
    setShowBankingModal(true);
  };

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    
    Alert.alert(
      `Redirect to ${bank.name}`,
      `You will be redirected to ${bank.name}'s secure online banking to complete your payment for the ${plans[selectedPlan].name} plan.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue to Banking', 
          style: 'default',
          onPress: () => {
            // Open the bank's website
            Linking.openURL(bank.url).catch(err => {
              Alert.alert('Error', 'Could not open banking website. Please try again.');
            });
            
            // Close modal and show success message
            setShowBankingModal(false);
            setSelectedBank(null);
            
            // Simulate successful subscription
            setTimeout(() => {
              Alert.alert(
                'Subscription Successful!',
                `Welcome to ${plans[selectedPlan].name}! Your farming experience just got better.`,
                [{ text: 'Awesome!', style: 'default' }]
              );
            }, 1000);
          }
        }
      ]
    );
  };

  const PlanCard = ({ plan, isSelected, onSelect }) => {
    const planData = plans[plan];
    
    return (
      <TouchableOpacity 
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          isSelected && { borderColor: planData.color }
        ]}
        onPress={() => onSelect(plan)}
        activeOpacity={0.8}
      >
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: planData.color }]}>
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={styles.selectedBadgeText}>Current Plan</Text>
          </View>
        )}
        
        <LinearGradient
          colors={planData.gradient}
          style={styles.planHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.planName}>{planData.name}</Text>
          <Text style={styles.planPrice}>{planData.price}</Text>
          <Text style={styles.planPeriod}>{planData.period}</Text>
        </LinearGradient>
        
        <View style={styles.planContent}>
          <Text style={styles.planDescription}>{planData.description}</Text>
          
          <View style={styles.featuresList}>
            {planData.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={planData.color} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity 
            style={[
              styles.subscribeButton,
              { backgroundColor: planData.color },
              isSelected && styles.currentPlanButton
            ]}
            onPress={() => handleSubscribe(plan)}
          >
            <Text style={styles.subscribeButtonText}>
              {isSelected ? 'Current Plan' : `Choose ${planData.name}`}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const FeatureCard = ({ icon, title, description }) => (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <MaterialCommunityIcons name={icon} size={24} color="#0B8457" />
      </View>
      <Text style={styles.featureCardTitle}>{title}</Text>
      <Text style={styles.featureCardDescription}>{description}</Text>
    </View>
  );

  const BankCard = ({ bank, isSelected, onSelect }) => (
    <TouchableOpacity 
      style={[
        styles.bankCard,
        isSelected && styles.bankCardSelected
      ]}
      onPress={() => onSelect(bank)}
      activeOpacity={0.7}
    >
      <View style={styles.bankImageContainer}>
        <Image 
          source={bankImages[bank.image]} 
          style={styles.bankImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.bankName}>{bank.name}</Text>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={20} color="#0B8457" style={styles.bankSelectedIcon} />
      )}
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Subscription</Text>
          <Text style={styles.headerSubtitle}>Choose your plan</Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Billing Toggle */}
        <View style={styles.billingToggle}>
          <Text style={styles.billingLabel}>Billing Cycle</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[
                styles.toggleOption,
                billingCycle === 'monthly' && styles.toggleOptionActive
              ]}
              onPress={() => setBillingCycle('monthly')}
            >
              <Text style={[
                styles.toggleText,
                billingCycle === 'monthly' && styles.toggleTextActive
              ]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.toggleOption,
                billingCycle === 'yearly' && styles.toggleOptionActive
              ]}
              onPress={() => setBillingCycle('yearly')}
            >
              <Text style={[
                styles.toggleText,
                billingCycle === 'yearly' && styles.toggleTextActive
              ]}>
                Yearly
              </Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save 20%</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plans Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          <View style={styles.plansContainer}>
            <PlanCard 
              plan="free" 
              isSelected={selectedPlan === 'free'}
              onSelect={setSelectedPlan}
            />
            <PlanCard 
              plan="premium" 
              isSelected={selectedPlan === 'premium'}
              onSelect={setSelectedPlan}
            />
            <PlanCard 
              plan="enterprise" 
              isSelected={selectedPlan === 'enterprise'}
              onSelect={setSelectedPlan}
            />
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqCard}>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Can I change plans anytime?</Text>
              <Text style={styles.faqAnswer}>
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>What payment methods do you accept?</Text>
              <Text style={styles.faqAnswer}>
                We support all major South African banks for secure online payments.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Is there a free trial?</Text>
              <Text style={styles.faqAnswer}>
                We offer a 14-day free trial for the Premium plan. No credit card required.
              </Text>
            </View>
          </View>
        </View>

        {/* Support */}
        <View style={styles.supportCard}>
          <Ionicons name="help-circle" size={32} color="#0B8457" />
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            Our support team is here to help you choose the right plan for your farming needs.
          </Text>
          <TouchableOpacity style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Banking Selection Modal */}
      <Modal
        visible={showBankingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Bank</Text>
              <Text style={styles.modalSubtitle}>
                Choose your bank to complete payment for {plans[selectedPlan]?.name} plan
              </Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowBankingModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.banksScrollView}>
              <View style={styles.banksGrid}>
                {banks.map((bank) => (
                  <BankCard
                    key={bank.id}
                    bank={bank}
                    isSelected={selectedBank?.id === bank.id}
                    onSelect={handleBankSelect}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.securityNote}>
                🔒 Secure payment redirected to your bank's official website
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
  billingToggle: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  billingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    position: 'relative',
  },
  toggleOptionActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  toggleTextActive: {
    color: '#0B8457',
    fontWeight: '600',
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#0B8457',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 16,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#0B8457',
    shadowColor: '#0B8457',
    shadowOpacity: 0.15,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 2,
    gap: 4,
  },
  selectedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    padding: 20,
    alignItems: 'center',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  planContent: {
    padding: 20,
  },
  planDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#1A2332',
    flex: 1,
  },
  subscribeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentPlanButton: {
    backgroundColor: '#E2E8F0',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  featureCardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  faqCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  faqItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  supportCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
     marginBottom: 60,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginTop: 12,
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#0B8457',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  supportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Banking Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 4,
  },
  banksScrollView: {
    maxHeight: 400,
  },
  banksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  bankCard: {
    width: (screenWidth - 64) / 3,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  bankCardSelected: {
    borderColor: '#0B8457',
    backgroundColor: 'rgba(11, 132, 87, 0.05)',
  },
  bankImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'white',
    padding: 4,
  },
  bankImage: {
    width: '100%',
    height: '100%',
  },
  bankName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A2332',
    textAlign: 'center',
    marginTop: 4,
  },
  bankSelectedIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  securityNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default SubscriptionScreen;