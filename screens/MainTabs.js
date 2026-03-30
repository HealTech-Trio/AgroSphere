import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

// Import all screens
import HomeScreen from './Home/HomeScreen';
import AIAssistantScreen from './AIAssistant/AIAssistantScreen';
import ChatConversationScreen from './AIAssistant/ChatConversationScreen';
import AnalysisScreen from './Analysis/AnalysisScreen';
import AgronomistScreen from './Agronomist/AgronomistScreen';
import ProfileScreen from './Profile/ProfileScreen';
import ScheduleScreen from './Home/schedule/ScheduleScreen';
import NotificationsScreen from './Home/notifications/NotificationsScreen';
import WeatherScreen from './Weather/WeatherScreen';
import AlertsScreen from './Home/alerts/AlertsScreen';
import SecurityScreen from './Profile/SecurityScreen';
import DeviceManagementScreen from './Profile/DeviceManagementScreen';
import MyCropsScreen from './Home/MyCrops/MyCropsScreen';
import FarmDetailsScreen from './Profile/FarmDetailsScreen';
import EditProfileScreen from './Profile/EditProfileScreen';
import SubscriptionScreen from './Profile/SubscriptionScreen';
import HelpCenterScreen from './Profile/HelpCenterScreen';
import ContactSupportScreen from './Profile/ContactSupportScreen';
import TermsPrivacyScreen from './Profile/TermsPrivacyScreen';
import LanguageScreen from './Profile/LanguageScreen';
import NotificationDetailScreen from './Home/notifications/components/NotificationDetailScreen';
import DiseaseDetectionScreen from './Analysis/DiseaseDetection/DiseaseDetectionScreen';
import SoilHealthScreen from './Analysis/SoilHealth/SoilHealthScreen';
import IrrigationOptimizationScreen from './Analysis/IrrigationOptimization/IrrigationOptimizationScreen';
import YieldPredictionScreen from './Analysis/YieldPrediction/YieldPredictionScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStackScreen() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: 'white' }
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="Weather" component={WeatherScreen} />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="MyCrops" component={MyCropsScreen} />
    </Stack.Navigator>
  );
}

// Create a stack navigator for the Profile tab
function ProfileStackScreen() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: 'white' }
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="DeviceManagement" component={DeviceManagementScreen} />
      <Stack.Screen name="FarmDetails" component={FarmDetailsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
      <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      
      {/* Add other profile-related screens here */}
    </Stack.Navigator>
  );
}

// Create a stack navigator for the AI Assistant tab
function AssistantStackScreen() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: 'white' }
      }}
    >
      <Stack.Screen name="AssistantHome" component={AIAssistantScreen} />
      <Stack.Screen name="ChatConversation" component={ChatConversationScreen} />
    </Stack.Navigator>
  );
}

function AnalysisStackScreen() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: 'white' }
      }}
    >
      <Stack.Screen name="AnalysisMain" component={AnalysisScreen} />
      <Stack.Screen name="DiseaseDetection" component={DiseaseDetectionScreen} />
      <Stack.Screen name="YieldPrediction" component={YieldPredictionScreen} />
      <Stack.Screen name="SoilHealth" component={SoilHealthScreen} />
      <Stack.Screen name="IrrigationOptimization" component={IrrigationOptimizationScreen} />
      </Stack.Navigator>
  );
}

// Create a stack navigator for the Agronomist tab
function AgronomistStackScreen() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: 'white' }
      }}
    >
      <Stack.Screen name="AgronomistMain" component={AgronomistScreen} />
    </Stack.Navigator>
  );
}

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      {/* Background extension */}
      <View style={styles.tabBarBackground} />

      {/* Inner row containing icons & labels */}
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = state.index === index;
          const isCenter = index === 2; // Middle tab (Analysis)

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Center FAB button
          if (isCenter) {
            return (
              <View key={index} style={styles.centerButtonContainer}>
                <TouchableOpacity
                  style={styles.centerButtonWrapper}
                  onPress={onPress}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.centerButton,
                      isFocused && styles.centerButtonActive
                    ]}
                  >
                    <FontAwesome5
                      name="brain"
                      size={28}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }

          const IconComponent = options.tabBarIcon;

          return (
            <TouchableOpacity
              key={index}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.tabButton,
                  isFocused && styles.tabButtonActive
                ]}
              >
                <IconComponent
                  size={26}
                  color={isFocused ? COLORS.primary : '#9B9B9B'}
                />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Assistant"
        component={AssistantStackScreen}
        options={{
          tabBarLabel: 'Smart-Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisStackScreen}
        options={{
          tabBarLabel: 'Deep-Analysis',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="brain" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Agronomist"
        component={AgronomistStackScreen}
        options={{
          tabBarLabel: 'Agronomist',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-tie" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  tabBarBackground: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 0,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 0,
  },
  tabBarInner: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 13,
    height: 75,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row',
    zIndex: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primarySoft,
  },
  tabLabel: {
    fontSize: 10,
    color: '#9B9B9B',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonWrapper: {
    alignItems: 'center',
    marginBottom: 5,
  },
  centerButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 12,
    marginBottom: 6,
  },
  centerButtonActive: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 1.05 }],
  },
});