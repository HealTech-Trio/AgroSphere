// App.js
import * as React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './services/translation';

import Login from './screens/Auth/Login';
import ForgotPasswordScreen from './screens/Auth/ForgotPasswordScreen';
import VerificationScreen from './screens/Auth/VerificationScreen';
import MainTabs from './screens/MainTabs';
import FarmSetupScreen from './screens/Onboarding/FarmSetupScreen';
import AdminDashboard from './screens/Admin/AdminDashboard'; 
import { NotificationsProvider } from './context/NotificationsContext';
import { useAuth } from './hooks/useAuth';
import { DeviceProvider } from './context/DeviceContext';
import AgronomistManagement from './screens/Admin/AgronomistManagement';
import UserManagement from './screens/Admin/UserManagement';
import AnalyticsScreen from './screens/Admin/AnalyticsScreen';
import SystemSettings from './screens/Admin/SystemSettings';

const Stack = createNativeStackNavigator();

export default function App() {
  const { user, userRole, loading, onboardingCompleted } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <DeviceProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NotificationsProvider>
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  animation: 'slide_from_right',
                  gestureEnabled: true,
                  headerShown: false,
                }}
              >
                {!user ? (
                  // Auth screens - unchanged
                  <>
                    <Stack.Screen name="Login" component={Login} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    <Stack.Screen name="VerificationScreen" component={VerificationScreen} />
                  </>
                ) : userRole === 'admin' ? (
                  // Admin flow - skip onboarding, go directly to admin dashboard
                  <>
                    <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
                    <Stack.Screen name="AgronomistManagement" component={AgronomistManagement} />
                        <Stack.Screen name="UserManagement" component={UserManagement} />
                        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
                        <Stack.Screen name="SystemSettings" component={SystemSettings} />

                  </>                
                ) : !onboardingCompleted ? (
                  // Farmer onboarding flow - unchanged
                  <>
                    <Stack.Screen name="FarmSetup" component={FarmSetupScreen} />
                    <Stack.Screen name="MainTabs" component={MainTabs} />
                  </>
                ) : (
                  // Main app for farmers - unchanged
                  <Stack.Screen name="MainTabs" component={MainTabs} />
                )}
              </Stack.Navigator>
            </NavigationContainer>
          </NotificationsProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </DeviceProvider>
  );
}