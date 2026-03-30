import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TextInput,
  TouchableOpacity, 
  Pressable,
  Alert
} from 'react-native';
import AgriSphereLogo from '../../assets/Images/AgriSphereLogo.png';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { COLORS } from '../../constants/colors';

// Firebase imports
import { auth } from '../../firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
    sendEmailVerification,
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';

export default function Login({ navigation }) {
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    name: ''
  });

  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validate password (at least 6 characters)
  const validatePassword = (password) => {
    return password.length >= 6;
  };

  // Validate name (at least 2 characters)
  const validateName = (name) => {
    return name.trim().length >= 2;
  };

  // Create user document in Firestore
  const createUserDocument = async (user, additionalData = {}) => {
    if (!user) return;

    const userRef = doc(firestore, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      const { email, displayName, photoURL, emailVerified } = user;
      const createdAt = new Date();

      try {
        await setDoc(userRef, {
          displayName: displayName || additionalData.displayName || '',
          email,
          photoURL: photoURL || '',
          emailVerified: emailVerified || additionalData.emailVerified || false,
          createdAt,
          lastLogin: createdAt,
          status: additionalData.status || 'active',
          role: 'farmer', 
          onboardingCompleted: false, 
          ...additionalData
        });
      } catch (error) {
        console.error('Error creating user document:', error);
      }
    } else {
      // Update last login time and verification status
      await setDoc(userRef, { 
        lastLogin: new Date(),
        emailVerified: user.emailVerified || additionalData.emailVerified || false,
        ...additionalData 
      }, { merge: true });
    }
  };

  // Resend email verification
  const resendVerificationEmail = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'No user found. Please sign in again.');
      return;
    }

    try {
      await sendEmailVerification(user);
      Alert.alert('Verification Sent', 'A new verification email has been sent to your email address.');
    } catch (error) {
      // console.error('Resend verification error:', error);
      Alert.alert('Error', 'Failed to send verification email. Please try again.');
    }
  };

  // Handle email/password signup with email verification
  const handleSignUp = async () => {
    setLoading(true);
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with name
      if (name) {
        await updateProfile(user, {
          displayName: name
        });
      }

      // Send email verification
      await sendEmailVerification(user);

      // Create user document in Firestore (mark as unverified)
      await createUserDocument(user, { 
        displayName: name,
        emailVerified: false,
        status: 'pending_verification'
      });

      // Sign out the user until they verify their email
      await signOut(auth);

      // Show success message with instructions
      Alert.alert(
        'Verify Your Email',
        `A verification email has been sent to ${email}. Please check your inbox and click the verification link to activate your account.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Switch back to login form after signup
              toggleForm(true);
            }
          }
        ]
      );

    } catch (error) {
      // console.error('Signup error:', error);
      let errorMessage = 'Failed to create account';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later';
          break;
        default:
          errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
    setLoading(false);
  };

  // Handle email/password login with email verification check
  const handleLogin = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        // If not verified, show alert and offer to resend verification
        Alert.alert(
          'Email Not Verified',
          'Please verify your email address before logging in. Check your inbox for the verification email.',
          [
            { 
              text: 'Resend Verification', 
              onPress: async () => {
                try {
                  await sendEmailVerification(user);
                  Alert.alert('Verification Sent', 'A new verification email has been sent to your email address.');
                } catch (error) {
                  Alert.alert('Error', 'Failed to send verification email. Please try again.');
                }
              }
            },
            { 
              text: 'OK', 
              style: 'cancel' 
            }
          ]
        );
        
        // Sign out the unverified user
        await signOut(auth);
        return;
      }

      // Email is verified - proceed with login
      await createUserDocument(user, { 
        emailVerified: true,
        lastLogin: new Date()
      });

      // Check if user has completed onboarding
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const userData = userDoc.data();
      
      // Clear any previous errors
      setErrors({ email: '', password: '', name: '' });
      
    } catch (error) {
      // console.error('Login error:', error);
      
      // Show generic error message without revealing specific error details
      Alert.alert(
        'Login Failed', 
        'Invalid email or password. Please check your credentials and try again.',
        [{ text: 'OK' }]
      );
      
      // Clear password field for security
      setPassword('');
    }
    setLoading(false);
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    Alert.alert(
      'Coming Soon',
      'Google Sign In will be available in the next update. Please use email/password authentication for now.',
      [{ text: 'OK' }]
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    if (isLogin) {
      // Login validation
      const newErrors = {
        email: !email ? 'Email is required' : !validateEmail(email) ? 'Invalid email format' : '',
        password: !password ? 'Password is required' : !validatePassword(password) ? 'Password must be at least 6 characters' : '',
        name: ''
      };
      
      setErrors(newErrors);
      
      if (!newErrors.email && !newErrors.password) {
        handleLogin();
      }
    } else {
      // Signup validation
      const newErrors = {
        email: !email ? 'Email is required' : !validateEmail(email) ? 'Invalid email format' : '',
        password: !password ? 'Password is required' : !validatePassword(password) ? 'Password must be at least 6 characters' : '',
        name: !name ? 'Name is required' : !validateName(name) ? 'Name must be at least 2 characters' : ''
      };
      
      setErrors(newErrors);
      
      if (!newErrors.email && !newErrors.password && !newErrors.name) {
        handleSignUp();
      }
    }
  };

  // Clear errors when switching between login/signup
  const toggleForm = (isLoginForm) => {
    setIsLogin(isLoginForm);
    setErrors({ email: '', password: '', name: '' });
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <View style={styles.container}>
      <Image source={AgriSphereLogo} style={styles.logoImage} />
      <View style={styles.switchContainer}>
        <Pressable 
          style={[styles.option, isLogin && styles.activeOption]}
          onPress={() => toggleForm(true)}
        >
          <Text style={[styles.optionText, isLogin && styles.activeText]}>Log in</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.option, !isLogin && styles.activeOption]}
          onPress={() => toggleForm(false)}
        >
          <Text style={[styles.optionText, !isLogin && styles.activeText]}>Sign up</Text>
        </Pressable>
      </View>
      
      {isLogin ? (
        <View style={styles.inputContainer}>
          <Text style={styles.textInput}>Your Email</Text>
          <TextInput 
            style={[styles.inputField, errors.email && styles.inputError]} 
            placeholder='contact@gmail.com'
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          
          <Text style={styles.textInput}>Password</Text>
          <TextInput 
            style={[styles.inputField, errors.password && styles.inputError]} 
            placeholder='********'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : 'Continue'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.or}>----------Or----------</Text>
          <TouchableOpacity 
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={30} color="#0B8457" />
            <Text style={styles.googleButtonText}>
              {loading ? 'Loading...' : 'Login with Google'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.account}>
            Don't have an account?
            <Text style={styles.signUp} onPress={() => toggleForm(false)}> Sign up</Text>
          </Text>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <Text style={styles.textInput}>Your Name</Text>
          <TextInput 
            style={[styles.inputField, errors.name && styles.inputError]} 
            placeholder='Enter your name...'
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          
          <Text style={styles.textInput}>Your Email</Text>
          <TextInput 
            style={[styles.inputField, errors.email && styles.inputError]} 
            placeholder='contact@gmail.com...'
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          
          <Text style={styles.passwordTextInput}>Create Password</Text>
          <TextInput 
            style={[styles.inputField, errors.password && styles.inputError]} 
            placeholder='Enter your Password...'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          
          <TouchableOpacity 
            style={[styles.button2, loading && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Continue'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.or}>----------Or----------</Text>
          <TouchableOpacity 
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={30} color={COLORS.primary} />
            <Text style={styles.googleButtonText}>
              {loading ? 'Loading...' : 'Sign up with Google'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
    padding: 5,  
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingTop: '20%'
  },
  logoImage:{
    width: '40%',
    height: '20%',
    marginBottom: '5%'
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 25,
    padding: 4,
    margin: 16,
  },
  option: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeOption: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionText: {
    fontSize: 16,
    color: 'gray',
  },
  activeText: {
    color: 'black',
    fontWeight: '600',
  },
  inputField:{
    borderWidth: 1,
    width: '90%',
    height: 40,
    borderRadius: 5,
    borderColor: 'lightgray',
    padding: 10,
    margin: 5
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginLeft: '5%',
    marginTop: -3,
    marginBottom: 5,
  },
  textInput:{
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    position: 'relative',
    right: '35%'
  },
  passwordTextInput:{
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    position: 'relative',
    right: '30%'
  },
  inputContainer:{
    width: '90%',
    alignItems: 'center'
  },
  forgot:{
    color: COLORS.info,
    alignSelf: 'flex-end',
    marginRight: '5%',
    marginBottom: 10,
  },
  or:{
    color: 'lightgray',
    margin: 10,
  },
  button:{
    backgroundColor: COLORS.primary,
    width: '90%',
    padding: '5%',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  button2:{
    backgroundColor: COLORS.primary,
    width: '90%',
    padding: '5%',
    borderRadius: 10,
    alignItems: 'center',
    margin: 10
  },
  buttonText:{
      fontWeight: 'bold',
      color: 'white'
  },
  googleButton:{
    backgroundColor: 'white',
    width: '90%',
    padding: '5%',
    borderRadius: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'lightgray',
    display: 'flex',
    flexDirection: 'row'
  },
  googleButtonText:{
    fontWeight: 'bold',
    margin: 5
  },
  account:{
    color: 'lightgray',
    margin: 10,
    fontWeight: 'bold',
  },
  signUp:{
    color: COLORS.info,
  },
  buttonDisabled:{
    opacity: 0.6,
  },
});