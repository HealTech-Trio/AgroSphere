import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { auth } from '../../firebase';
import { 
  confirmPasswordReset,
  verifyPasswordResetCode 
} from 'firebase/auth';

export default function VerificationScreen({ navigation, route }) {

  const handleVerifyWithFirebase = async (code) => {
    try {
      // If you're using Firebase's built-in password reset, 
      // you don't need this manual verification
      // This would be for custom verification logic
      
      // For custom implementation, you might want to:
      // 1. Verify the code with your backend
      // 2. Then reset the password
      
      Alert.alert('Success', 'Password reset successful!');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Invalid or expired verification code');
    }
  };  

  const [code, setCode] = useState(['', '', '', '', '']);
  const inputRefs = useRef([]);
  const email = route.params?.email || 'contact@gmail.com';

  const handleCodeChange = (text, index) => {
    // Allow only digits
    const numericText = text.replace(/[^0-9]/g, '');
    
    // Update code array
    const newCode = [...code];
    newCode[index] = numericText;
    setCode(newCode);
    
    // Auto focus to next input
    if (numericText && index < 4) {
      inputRefs.current[index + 1].focus();
    }
    
    // If all digits are entered, automatically verify
    if (newCode.every(digit => digit !== '') && index === 4) {
      handleVerify();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace to move to previous input
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 5) {
      Alert.alert('Error', 'Please enter the 5-digit code');
      return;
    }
    
    // In a real app, you would verify the code with your backend
    Alert.alert('Success', 'Password reset successful!');
    // Navigate to login or new password screen
    navigation.navigate('Login');
  };

  const resendCode = () => {
    Alert.alert('Code Sent', 'A new verification code has been sent to your email');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Check your email</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            We sent a reset link to {email}
          </Text>
          <Text style={styles.instruction}>
            Enter 5-digit code that reinforces it! The email
          </Text>
          
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                style={styles.codeInput}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                ref={(ref) => (inputRefs.current[index] = ref)}
                selectTextOnFocus
              />
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleVerify}
          >
            <Text style={styles.buttonText}>Verify Code</Text>
          </TouchableOpacity>
          
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Haven't got the email yet? </Text>
            <TouchableOpacity onPress={resendCode}>
              <Text style={styles.resendLink}>Resend email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: '20%'
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#0B8457',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    color: '#666',
  },
  resendLink: {
    color: '#3b6dc8ff',
    fontWeight: '500',
  },
});