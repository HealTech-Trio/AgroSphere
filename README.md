# AgriSphere

<p align="center">
  <strong>AI-Powered Smart Farming for Smallholder Farmers</strong>
</p>

AgriSphere is a comprehensive digital farming assistant platform designed for smallholder farmers in rural South Africa. It combines AI-powered crop analysis, real-time IoT sensor monitoring, and mobile technology to deliver instant, affordable, and accessible agronomic intelligence.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
  - [IoT Hardware Setup](#iot-hardware-setup)
- [Environment Variables](#environment-variables)
- [Navigation Structure](#navigation-structure)
- [API Endpoints](#api-endpoints)
- [Firebase Database Schema](#firebase-database-schema)
- [IoT Integration](#iot-integration)
- [Internationalization](#internationalization)
- [Design System](#design-system)
- [Dependencies](#dependencies)

---

## Features

### AI Smart Chat

- Multi-modal conversational AI assistant powered by **Google Gemini 2.5 Flash**
- Supports text, image, audio, and document (PDF) input
- Agricultural-domain system instructions for context-aware responses
- Conversation persistence with Firestore + AsyncStorage fallback
- Auto-generated conversation titles
- Markdown rendering in message bubbles

### Disease Detection

- Camera/gallery image upload for crop disease identification
- Structured AI analysis: disease name, confidence level, severity, symptoms, treatments, and prevention
- Optional IoT sensor data correlation for enhanced diagnosis

### Yield Prediction

- Multi-factor weighted prediction model using crop type, farm area, soil type, irrigation, planting date, and growth stage
- IoT data integration for real-time environmental factors
- Returns yield estimate ranges, harvest date prediction, growth timeline, weather impact analysis, and risk factors

### Soil Health Assessment

- Uses IoT sensor readings (temperature, humidity, soil moisture) combined with farm information
- Generates health score (0–100), condition rating, nutrient analysis, and actionable recommendations

### Irrigation & Fertilizer Optimization

- Analyzes IoT data, farm conditions, and crop requirements
- Produces efficiency score, irrigation schedule (timing, volume, frequency), fertilizer plan, and water stress level

### 3D Farm Visualization

- Interactive Three.js scene rendered inside a WebView
- 3D farm with IoT sensor nodes, soil moisture color-coded crop zones, animated robotic weeder
- Touch orbit controls, pinch-to-zoom, tap-to-inspect crops and sensors
- Real-time simulated IoT data updates

### Weather Intelligence

- Farm-specific weather from OpenWeatherMap (auto-selects from user's saved farms)
- Current conditions: temperature, humidity, wind speed, rain probability
- 5-day forecast
- Smart alerts: high/low temperature, heavy rain, strong wind, high humidity, storms

### IoT Device Management

- Auto-discovery of ESP32/ESP8266 devices on local network (subnet scan)
- WebSocket real-time sensor streaming (temperature, humidity, soil moisture)
- Password-based device authentication
- Paired device persistence and auto-reconnect
- Sensor data feeds into Home insights, Analysis tools, Weather alerts, and Notifications

### Agronomist Directory

- List and map views of agronomists (combined hardcoded + Firebase data)
- Filter by availability, rating (≥4.5), distance (≤5km), experience (≥10 years)
- Search by name, specialty, or city
- Google Maps integration for location display

### Admin Dashboard

- Real-time platform analytics: total farmers, agronomists, farms, active users
- Full user management
- Agronomist CRUD with profile image upload to Firebase Storage
- Analytics screen and system settings
- Auto-refresh every 30 seconds

### User Management & Auth

- Email/password signup with email verification
- Forgot password flow
- Role-based access: `farmer` (default) and `admin`
- Onboarding flow (FarmSetupScreen) required before main app access

### Profile & Settings

- Edit profile, farm details, security settings
- Subscription management
- Language selection (11 South African languages)
- Push notification toggle (persisted to Firestore)
- Help center, contact support, terms & privacy

---

## Tech Stack

| Layer                    | Technology                                                                       |
| ------------------------ | -------------------------------------------------------------------------------- |
| **Frontend**             | React Native 0.81.5, Expo SDK 54, React 19.1                                     |
| **Navigation**           | React Navigation 7 (Native Stack, Bottom Tabs, Stack, Material Top Tabs)         |
| **Backend**              | Flask (Python), Google Gemini AI (gemini-2.5-flash)                              |
| **Database**             | Firebase Firestore                                                               |
| **Authentication**       | Firebase Auth (email/password + email verification)                              |
| **File Storage**         | Firebase Storage (agronomist profile images)                                     |
| **Weather API**          | OpenWeatherMap (current + 5-day forecast)                                        |
| **Maps**                 | Google Maps (react-native-maps), Google Places Autocomplete                      |
| **IoT Hardware**         | ESP32, ESP8266 — DHT11 sensors, capacitive soil moisture sensors                 |
| **IoT Communication**    | WebSocket (real-time), HTTP REST (device discovery), ThingSpeak (cloud fallback) |
| **Internationalization** | i18next + react-i18next (11 languages)                                           |
| **State Management**     | React Context (DeviceContext, NotificationsContext)                              |
| **Local Storage**        | AsyncStorage, Expo SecureStore                                                   |
| **UI Components**        | React Native Paper, expo-linear-gradient, react-native-chart-kit                 |
| **3D Visualization**     | Three.js r128 (via react-native-webview)                                         |

---

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Mobile App     │────▶│  Flask Backend    │────▶│  Google Gemini   │
│  (React Native)  │     │  (Python)         │     │  AI API          │
└────────┬─────────┘     └──────────────────┘     └──────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│Firebase│ │  IoT Devices │
│        │ │ (ESP32/8266) │
│• Auth  │ │              │
│• Store │ │• DHT11 Sensor│
│• Files │ │• Soil Sensor │
└────────┘ │• WebSocket   │
           └──────────────┘
```

---

## Project Structure

```
AgroSphere/
├── App.js                     # Root entry — auth flow, navigation
├── app.json                   # Expo configuration
├── firebase.js                # Firebase initialization
├── package.json               # JS dependencies & scripts
│
├── assets/
│   └── Images/banks/          # Static image assets
│
├── components/
│   └── GradientBackground.js  # Reusable gradient wrapper
│
├── constants/
│   └── colors.js              # Design system — colors, gradients, shadows
│
├── context/
│   ├── DeviceContext.js        # IoT device state (scan, connect, data)
│   └── NotificationsContext.js # Push notification management
│
├── hooks/
│   ├── useAdminAnalytics.js   # Firestore admin analytics
│   ├── useAgronomists.js      # Agronomist data (Firebase + hardcoded)
│   ├── useAuth.js             # Auth state management
│   └── useUserGrowth.js       # User growth analytics
│
├── IoT/
│   ├── app.cpp                # Shared IoT utility code
│   ├── ESP32_conf/
│   │   └── ESP32_conf.ino     # ESP32 Arduino firmware
│   └── ESP8266_conf/
│       └── ESP8266_conf.ino   # ESP8266 Arduino firmware
│
├── models/                    # Python backend
│   ├── app.py                 # Flask server — all API endpoints
│   ├── disease-detection.py   # Disease detection analysis logic
│   ├── yield-prediction.py    # Yield prediction model
│   ├── smart-chat.py          # Smart chat AI logic
│   ├── system_instructions.txt# Gemini system prompt
│   ├── requirements.txt       # Python dependencies
│   └── requirements copy.txt  # Backup requirements
│
├── screens/
│   ├── MainTabs.js            # Bottom tab navigator + nested stacks
│   │
│   ├── Auth/
│   │   ├── Login.js           # Login & signup screen
│   │   ├── ForgotPasswordScreen.js
│   │   └── VerificationScreen.js
│   │
│   ├── Onboarding/
│   │   └── FarmSetupScreen.js # First-time farm configuration
│   │
│   ├── Home/
│   │   ├── HomeScreen.js      # Dashboard with weather, IoT, insights
│   │   ├── alerts/            # Weather & sensor alerts
│   │   ├── components/        # Home widgets
│   │   ├── MyCrops/           # Crop management (CRUD)
│   │   ├── notifications/     # Notification center
│   │   └── schedule/          # Farm calendar
│   │
│   ├── AIAssistant/
│   │   ├── SmartChatScreen.js       # Conversation list
│   │   ├── ChatConversationScreen.js# Individual chat UI
│   │   ├── components/             # Chat UI components
│   │   ├── services/apiService.js   # Chat API calls
│   │   └── utils/                   # Chat helpers & constants
│   │
│   ├── Analysis/
│   │   ├── AnalysisScreen.js        # Analysis hub (all tools)
│   │   ├── FarmVisualizationScreen.js # 3D farm (Three.js WebView)
│   │   ├── DiseaseDetection/        # Disease analysis screens
│   │   ├── YieldPrediction/         # Yield prediction screens
│   │   ├── SoilHealth/              # Soil assessment screens
│   │   └── IrrigationOptimization/  # Irrigation screens
│   │
│   ├── Agronomist/
│   │   ├── AgronomistScreen.js      # Agronomist directory
│   │   ├── data.js                  # Hardcoded agronomist data
│   │   └── components/              # Cards, map, filters
│   │
│   ├── Weather/
│   │   └── WeatherScreen.js         # Weather details & forecast
│   │
│   ├── Profile/
│   │   ├── ProfileScreen.js         # Settings & account management
│   │   ├── EditProfileScreen.js
│   │   ├── SecurityScreen.js
│   │   ├── DeviceManagementScreen.js# IoT device pairing
│   │   ├── FarmDetailsScreen.js
│   │   ├── SubscriptionScreen.js
│   │   ├── LanguageScreen.js
│   │   ├── HelpCenterScreen.js
│   │   ├── ContactSupportScreen.js
│   │   ├── TermsPrivacyScreen.js
│   │   └── components/
│   │
│   └── Admin/
│       ├── AdminDashboard.js        # Admin overview
│       ├── UserManagement.js
│       ├── AgronomistManagement.js
│       ├── AnalyticsScreen.js
│       ├── SystemSettings.js
│       └── components/
│
├── services/
│   ├── api.js                 # Backend API client
│   ├── firebaseService.js     # Firestore CRUD operations
│   ├── weatherService.js      # OpenWeatherMap integration
│   ├── ChatStorageService.js  # Chat persistence (Firestore + AsyncStorage)
│   └── translation.js         # i18next configuration
│
└── utils/
    ├── agronomistService.js   # Agronomist data service
    ├── geocodingService.js    # Reverse geocoding
    └── responsive.js          # Responsive sizing utilities
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go** app on your mobile device (or Android/iOS emulator)
- **Arduino IDE** (for IoT firmware upload)
- **Firebase project** with Firestore, Auth, and Storage enabled
- **Google Gemini API key**
- **OpenWeatherMap API key**
- **Google Maps API key** (with Maps SDK for Android/iOS enabled)

### Frontend Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd AgroSphere

# 2. Install dependencies
npm install

# 3. Configure Firebase (see Environment Variables section)
#    Edit firebase.js with your Firebase project credentials

# 4. Configure API keys
#    Update Google Maps key in config.js
#    Update OpenWeatherMap key in services/weatherService.js
#    Update backend URL in services/api.js

# 5. Start the development server
npx expo start

# 6. Scan the QR code with Expo Go or press 'a' for Android / 'i' for iOS
```

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd models

# 2. Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate    # Linux/Mac
venv\Scripts\activate       # Windows

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Create .env file with your Gemini API key
echo GEMINI_API_KEY=your_gemini_api_key_here > .env

# 5. Start the Flask server
python app.py
# Server runs on http://0.0.0.0:5000
```

### IoT Hardware Setup

**Components Required:**

- ESP32 or ESP8266 microcontroller
- DHT11 temperature & humidity sensor
- Capacitive soil moisture sensor
- 16x2 I2C LCD display (optional)
- Jumper wires and breadboard

**Firmware Upload:**

```bash
# 1. Open Arduino IDE
# 2. Open IoT/ESP32_conf/ESP32_conf.ino (or ESP8266_conf)

# 3. Install required Arduino libraries:
#    - WiFi / ESP8266WiFi
#    - WebSocketsServer
#    - ArduinoJson
#    - DHT sensor library
#    - LiquidCrystal_I2C
#    - HTTPClient / ESP8266HTTPClient

# 4. Update configuration in the firmware:
#    - WiFi SSID and password
#    - ThingSpeak write API key
#    - Device password (ESP8266)

# 5. Calibrate soil sensor:
#    - Measure ADC value in dry air → set as SOIL_DRY
#    - Measure ADC value in water → set as SOIL_WET

# 6. Select board and port, then upload

# 7. In the app: Profile → Device Management → Scan & pair
```

---

## Environment Variables

### Backend (.env)

| Variable         | Description                           |
| ---------------- | ------------------------------------- |
| `GEMINI_API_KEY` | Google Gemini API key for AI analysis |

### Frontend (hardcoded — should be moved to environment config)

| File                         | Variable               | Description                                                        |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------ |
| `firebase.js`                | Firebase config object | Firebase project credentials (apiKey, authDomain, projectId, etc.) |
| `services/api.js`            | `API_BASE_URL`         | Backend server URL (e.g., `http://10.96.86.131:5000`)              |
| `services/weatherService.js` | OpenWeatherMap API key | Weather data                                                       |
| `config.js`                  | Google Maps API key    | Maps and places autocomplete                                       |

### IoT Firmware

| Constant                | Description                               |
| ----------------------- | ----------------------------------------- |
| `WIFI_SSID`             | WiFi network name                         |
| `WIFI_PASSWORD`         | WiFi password                             |
| `THINGSPEAK_API_KEY`    | ThingSpeak write API key (cloud fallback) |
| `DEVICE_PASSWORD`       | Device auth password (ESP8266 only)       |
| `SOIL_DRY` / `SOIL_WET` | Soil sensor ADC calibration values        |

---

## Navigation Structure

```
App.js (Root Stack Navigator)
│
├── 🔒 Not Authenticated
│   ├── Login
│   ├── ForgotPassword
│   └── VerificationScreen
│
├── 👤 Admin Role
│   ├── AdminDashboard
│   ├── AgronomistManagement
│   ├── UserManagement
│   ├── Analytics
│   └── SystemSettings
│
├── 🌱 Farmer (not onboarded)
│   └── FarmSetup → MainTabs
│
└── 🌾 Farmer (onboarded) → MainTabs
    │
    ├── 🏠 Home Tab (Stack)
    │   ├── HomeMain
    │   ├── Notifications / NotificationDetail
    │   ├── Schedule
    │   ├── Weather
    │   ├── Alerts
    │   └── MyCrops
    │
    ├── 💬 Smart Chat Tab (Stack)
    │   ├── SmartChatScreen (conversation list)
    │   └── ChatConversation
    │
    ├── 🔬 Deep Analysis Tab — Center FAB (Stack)
    │   ├── AnalysisScreen (hub)
    │   ├── DiseaseDetection
    │   ├── YieldPrediction
    │   ├── SoilHealth
    │   ├── IrrigationOptimization
    │   └── FarmVisualization (3D)
    │
    ├── 👨‍🌾 Agronomist Tab (Stack)
    │   └── AgronomistScreen
    │
    └── 👤 Profile Tab (Stack)
        ├── ProfileScreen
        ├── EditProfile / Security
        ├── DeviceManagement
        ├── FarmDetails / Subscription
        ├── Language / HelpCenter
        ├── ContactSupport / TermsPrivacy
        └── ...
```

The bottom tab bar is hidden when viewing `ChatConversation` or `FarmVisualization` screens for an immersive experience.

---

## API Endpoints

All endpoints are served by the Flask backend at `http://<host>:5000`.

| Method | Endpoint                       | Description                   | Input                                                                   |
| ------ | ------------------------------ | ----------------------------- | ----------------------------------------------------------------------- |
| `GET`  | `/health`                      | Health check                  | —                                                                       |
| `POST` | `/api/chatbot`                 | Multi-modal AI chat           | Text, image (base64), audio (base64), document (base64 PDF), session_id |
| `POST` | `/api/clear_session`           | Clear chat session memory     | session_id                                                              |
| `POST` | `/api/analyze`                 | Disease detection from image  | Image file + optional IoT data JSON                                     |
| `POST` | `/api/soil-assessment`         | Soil health assessment        | IoT sensor data + farm info JSON                                        |
| `POST` | `/api/irrigation-optimization` | Irrigation & fertilizer plan  | IoT data + farm + crop info JSON                                        |
| `POST` | `/api/yield-prediction`        | Yield prediction              | Farm + crop data JSON (IoT optional)                                    |
| `POST` | `/api/analyse_document`        | Analyze agricultural document | Base64 encoded image or PDF                                             |

All analysis endpoints return **structured JSON** responses via Gemini's `response_schema` parameter.

---

## Firebase Database Schema

```
Firestore
│
├── users/{userId}
│   ├── displayName, email, photoURL, emailVerified
│   ├── createdAt, lastLogin, status
│   ├── role: 'farmer' | 'admin'
│   ├── onboardingCompleted: boolean
│   ├── notificationsEnabled: boolean
│   ├── farmName, farmSize, farmLocation (optional)
│   │
│   ├── farms/{farmId}
│   │   ├── name, location, size, cropType, soilType
│   │   └── crops/{cropId}
│   │       └── name, variety, plantingDate, growthStage, ...
│   │
│   ├── schedules/{scheduleId}
│   │   └── title, date, type, description, ...
│   │
│   └── conversations/{conversationId}
│       └── title, messages[], createdAt, updatedAt
│
└── agronomists/{agronomistId}
    ├── name, specialty, city, rating, experience
    ├── available: boolean
    ├── profileImage: URL (Firebase Storage)
    └── farmSpecialties: string[]
```

**Firestore Security Rules:**

- Users can read/write their own documents and subcollections
- Admins can read all user data and manage agronomists
- Authenticated users can read agronomist listings
- Unauthenticated users have no access

---

## IoT Integration

### Hardware Architecture

```
ESP32/ESP8266
├── DHT11 Sensor → Temperature + Humidity
├── Capacitive Soil Moisture Sensor → Soil Moisture %
├── I2C LCD (16x2) → Local display
│
├── WebSocket Server (port 81)
│   └── Broadcasts JSON every 1 second:
│       { deviceId, temperature, humidity, soil }
│
├── HTTP Server (port 80) — ESP8266 only
│   └── GET /device-info
│       { deviceId, deviceName, type, wsPort, requiresAuth }
│
└── ThingSpeak (fallback)
    └── Publishes every 20 seconds
        Field 1: Temperature
        Field 2: Humidity
        Field 3: Soil Moisture
```

### App-Side Flow

1. **Discovery**: `DeviceContext` scans the local subnet (192.168.137.x) for devices with open WebSocket ports
2. **Connect**: Establishes WebSocket connection to `ws://<device-ip>:81`
3. **Authenticate**: Sends password (ESP8266 devices only)
4. **Stream**: Receives JSON sensor data every second
5. **Persist**: Paired device info stored in AsyncStorage for auto-reconnect
6. **Consume**: Sensor data flows to HomeScreen (live insights), Analysis tools (enhanced accuracy), Weather (combined alerts), and Notifications

### Sensor Calibration

Soil moisture is calibrated from raw ADC values:

- `SOIL_DRY`: ADC reading in dry air (0% moisture)
- `SOIL_WET`: ADC reading in water (100% moisture)
- Formula: `moisture% = map(rawADC, SOIL_DRY, SOIL_WET, 0, 100)`

---

## Internationalization

AgriSphere supports **11 South African official languages**:

| Code  | Language       |
| ----- | -------------- |
| `en`  | English        |
| `zu`  | Zulu           |
| `xh`  | Xhosa          |
| `af`  | Afrikaans      |
| `nso` | Northern Sotho |
| `st`  | Southern Sotho |
| `tn`  | Tswana         |
| `ts`  | Tsonga         |
| `ss`  | Swati          |
| `ve`  | Venda          |
| `nr`  | Ndebele        |

Language is selectable from **Profile → Language** and applies across the app via `i18next`.

---

## Design System

### Core Colors

| Token          | Hex       | Usage                          |
| -------------- | --------- | ------------------------------ |
| `primary`      | `#0B8457` | Primary actions, buttons       |
| `primaryLight` | `#2EC4B6` | Accents, highlights, hero text |
| `primaryDark`  | `#065A3B` | Pressed states                 |
| `accent`       | `#F4A261` | Warm accent, secondary CTAs    |
| `inkDark`      | `#0F2027` | Hero backgrounds, headers      |
| `inkSoft`      | `#1B3A4B` | Gradient endpoints             |
| `success`      | `#10B981` | Positive states                |
| `warning`      | `#F59E0B` | Caution states                 |
| `error`        | `#EF4444` | Error states                   |
| `info`         | `#3B82F6` | Info states                    |

### Hero Header Pattern

All main screens use a consistent dark gradient hero header:

- `LinearGradient` with colors `[COLORS.inkDark, COLORS.inkSoft]` (horizontal)
- White title text (30px, weight 900) with `primaryLight` accent word
- Decorative translucent circles for visual depth
- Content sheet below with `borderTopRightRadius: 30`

---

## Dependencies

### JavaScript (Key Packages)

| Package                    | Purpose                             |
| -------------------------- | ----------------------------------- |
| `expo ~54.0.0`             | App framework                       |
| `react-native 0.81.5`      | UI runtime                          |
| `firebase ^11.3.0`         | Auth, Firestore, Storage            |
| `react-native-maps`        | Google Maps                         |
| `react-native-webview`     | 3D visualization host               |
| `react-native-paper`       | Material Design components          |
| `expo-camera`              | Camera access for disease detection |
| `expo-image-picker`        | Image selection                     |
| `expo-av` / `expo-audio`   | Audio recording & playback          |
| `expo-document-picker`     | PDF upload for AI analysis          |
| `react-native-chart-kit`   | Data visualizations                 |
| `react-native-calendars`   | Farm schedule calendar              |
| `i18next`                  | Internationalization                |
| `moment`                   | Date formatting                     |
| `react-native-gifted-chat` | Chat UI components                  |
| `expo-location`            | Location services                   |
| `expo-notifications`       | Push notifications                  |

### Python (requirements.txt)

| Package               | Purpose                      |
| --------------------- | ---------------------------- |
| `flask`               | Web server                   |
| `flask-cors`          | Cross-origin requests        |
| `google-generativeai` | Gemini AI SDK                |
| `pillow`              | Image processing             |
| `python-dotenv`       | Environment variable loading |
| `scipy`               | Scientific computing         |

---

## License

0BSD
