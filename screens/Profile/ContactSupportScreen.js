// screens/Profile/ContactSupportScreen.js
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
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ContactSupportScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Priority options
  const priorityOptions = [
    { id: 'low', label: 'Low', color: '#0B8457', description: 'General question' },
    { id: 'normal', label: 'Normal', color: '#FF9800', description: 'Need assistance' },
    { id: 'high', label: 'High', color: '#FF3B30', description: 'Urgent issue' }
  ];

  // Quick contact methods
  const quickContacts = [
    {
      id: 'email',
      title: 'Send Email',
      subtitle: 'Get detailed support',
      icon: 'mail',
      color: '#0B8457',
      action: () => {
        const subject = encodeURIComponent(formData.subject || 'Support Request');
        const body = encodeURIComponent(
          `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage: ${formData.message || 'I need help with...'}`
        );
        Linking.openURL(`mailto:support@agrisphere.com?subject=${subject}&body=${body}`);
      }
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      subtitle: 'Instant messaging',
      icon: 'logo-whatsapp',
      color: '#25D366',
      action: () => {
        const message = encodeURIComponent(
          `Hello! I need support.\n\nName: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\n${formData.message || 'I need help with...'}`
        );
        Linking.openURL(`https://wa.me/27123456789?text=${message}`);
      }
    },
    {
      id: 'call',
      title: 'Call Us',
      subtitle: 'Speak directly',
      icon: 'call',
      color: '#2196F3',
      action: () => Linking.openURL('tel:+27123456789')
    },
    {
      id: 'sms',
      title: 'SMS',
      subtitle: 'Text message',
      icon: 'chatbubble',
      color: '#9C27B0',
      action: () => Linking.openURL('sms:+27123456789?body=Hello%20agrisphere%20Support')
    }
  ];

  // Support team members
  const supportTeam = [
    {
      id: 'agriculture',
      name: 'Agricultural Support',
      role: 'Farming & Crop Experts',
      availability: 'Mon-Fri, 7AM-6PM',
      specialty: 'Crop management, soil health, irrigation',
      contact: 'agri-support@agrisphere.com'
    },
    {
      id: 'technical',
      name: 'Technical Support',
      role: 'App & Device Experts',
      availability: '24/7',
      specialty: 'App issues, device setup, troubleshooting',
      contact: 'tech-support@agrisphere.com'
    },
    {
      id: 'billing',
      name: 'Billing Support',
      role: 'Payment & Subscription',
      availability: 'Mon-Fri, 8AM-5PM',
      specialty: 'Billing issues, subscription management',
      contact: 'billing@agrisphere.com'
    }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message should be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Message Sent!',
        'Thank you for contacting us. Our support team will get back to you within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
                priority: 'normal'
              });
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again or use one of the quick contact methods.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const InputField = ({ label, value, onChange, placeholder, error, multiline = false, numberOfLines = 1 }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.multilineInput,
          error && styles.inputError
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline={multiline}
        numberOfLines={multiline ? 4 : numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  const PrioritySelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Priority Level</Text>
      <View style={styles.priorityContainer}>
        {priorityOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.priorityOption,
              formData.priority === option.id && styles.priorityOptionSelected,
              formData.priority === option.id && { borderColor: option.color }
            ]}
            onPress={() => handleInputChange('priority', option.id)}
          >
            <View style={[styles.priorityDot, { backgroundColor: option.color }]} />
            <View style={styles.priorityTextContainer}>
              <Text style={[
                styles.priorityLabel,
                formData.priority === option.id && styles.priorityLabelSelected
              ]}>
                {option.label}
              </Text>
              <Text style={styles.priorityDescription}>{option.description}</Text>
            </View>
            {formData.priority === option.id && (
              <Ionicons name="checkmark-circle" size={20} color={option.color} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const QuickContactCard = ({ item }) => (
    <TouchableOpacity style={styles.quickContactCard} onPress={item.action}>
      <LinearGradient
        colors={[item.color, `${item.color}DD`]}
        style={styles.quickContactIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={item.icon} size={24} color="white" />
      </LinearGradient>
      <View style={styles.quickContactInfo}>
        <Text style={styles.quickContactTitle}>{item.title}</Text>
        <Text style={styles.quickContactSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="arrow-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const SupportTeamCard = ({ member }) => (
    <TouchableOpacity 
      style={styles.teamCard}
      onPress={() => Linking.openURL(`mailto:${member.contact}`)}
    >
      <View style={styles.teamAvatar}>
        <Text style={styles.teamAvatarText}>
          {member.name.split(' ').map(n => n[0]).join('')}
        </Text>
      </View>
      <View style={styles.teamInfo}>
        <Text style={styles.teamName}>{member.name}</Text>
        <Text style={styles.teamRole}>{member.role}</Text>
        <Text style={styles.teamSpecialty}>{member.specialty}</Text>
        <View style={styles.teamMeta}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.teamAvailability}>{member.availability}</Text>
        </View>
      </View>
      <View style={styles.contactButton}>
        <Ionicons name="mail" size={20} color="#0B8457" />
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          <Text style={styles.headerTitle}>Contact Support</Text>
          <Text style={styles.headerSubtitle}>We're here to help you</Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <Text style={styles.sectionSubtitle}>Get immediate assistance</Text>
          <View style={styles.quickContactGrid}>
            {quickContacts.map((contact) => (
              <QuickContactCard key={contact.id} item={contact} />
            ))}
          </View>
        </View>

        {/* Support Form Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a Message</Text>
          <Text style={styles.sectionSubtitle}>We'll get back to you within 24 hours</Text>
          
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <InputField
                  label="Your Name"
                  value={formData.name}
                  onChange={(value) => handleInputChange('name', value)}
                  placeholder="Enter your full name"
                  error={errors.name}
                />
              </View>
              <View style={styles.halfInput}>
                <InputField
                  label="Email Address"
                  value={formData.email}
                  onChange={(value) => handleInputChange('email', value)}
                  placeholder="your@email.com"
                  error={errors.email}
                  keyboardType="email-address"
                />
              </View>
            </View>

            <InputField
              label="Subject"
              value={formData.subject}
              onChange={(value) => handleInputChange('subject', value)}
              placeholder="Brief description of your issue"
              error={errors.subject}
            />

            <PrioritySelector />

            <InputField
              label="Message"
              value={formData.message}
              onChange={(value) => handleInputChange('message', value)}
              placeholder="Please describe your issue in detail..."
              error={errors.message}
              multiline={true}
            />

            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Ionicons name="time-outline" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Sending...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Team Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialized Support Teams</Text>
          <Text style={styles.sectionSubtitle}>Contact the right team for your issue</Text>
          
          <View style={styles.teamGrid}>
            {supportTeam.map((member) => (
              <SupportTeamCard key={member.id} member={member} />
            ))}
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyIcon}>
            <Ionicons name="warning" size={32} color="#FF3B30" />
          </View>
          <Text style={styles.emergencyTitle}>Emergency Support</Text>
          <Text style={styles.emergencyText}>
            For critical farming emergencies affecting your crops or livestock
          </Text>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={() => Linking.openURL('tel:+27111234567')}
          >
            <Ionicons name="call" size={20} color="white" />
            <Text style={styles.emergencyButtonText}>Call Emergency Line</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  quickContactGrid: {
    gap: 12,
  },
  quickContactCard: {
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
  quickContactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickContactInfo: {
    flex: 1,
  },
  quickContactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  quickContactSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A2332',
    backgroundColor: 'white',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  priorityContainer: {
    gap: 8,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  priorityOptionSelected: {
    backgroundColor: 'rgba(11, 132, 87, 0.05)',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  priorityTextContainer: {
    flex: 1,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 2,
  },
  priorityLabelSelected: {
    color: '#0B8457',
  },
  priorityDescription: {
    fontSize: 12,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#0B8457',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
    shadowColor: '#0B8457',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  teamGrid: {
    gap: 12,
  },
  teamCard: {
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
  teamAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0B8457',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teamAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 2,
  },
  teamRole: {
    fontSize: 14,
    color: '#0B8457',
    fontWeight: '500',
    marginBottom: 4,
  },
  teamSpecialty: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teamAvailability: {
    fontSize: 12,
    color: '#666',
  },
  contactButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
  },
  emergencyCard: {
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
    borderWidth: 2,
    borderColor: 'rgba(255, 59, 48, 0.1)',
  },
  emergencyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContactSupportScreen;