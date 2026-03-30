// ESP8266 with Password Authentication & Device Discovery
// - Password-based authentication for WebSocket connections
// - mDNS for device discovery
// - Device registration endpoint

#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "DHT.h"

// --- CONFIG: update these ---
const char* WIFI_SSID = "DIVIN";
const char* WIFI_PASS = "12345678";

// Device Authentication Password (This is what users need to connect)
const char* DEVICE_PASSWORD = "112233";

// Device Info
const char* DEVICE_ID = "ESP8266-01";
const char* DEVICE_NAME = "Farm Sensor 1";

// ThingSpeak (fallback cloud)
const char* THINGSPEAK_HOST = "api.thingspeak.com";
const char* THINGSPEAK_WRITE_APIKEY = "7FXHDD7GDBGWP9RE";

const unsigned long PUBLISH_INTERVAL_MS = 20000UL;
const uint16_t WS_PORT = 81;
const uint16_t HTTP_PORT = 80;

// --- SENSOR & PERIPHERAL PINS ---
#define DHTPIN D5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define SOIL_PIN A0
int SOIL_DRY = 0;
int SOIL_WET = 1024;

LiquidCrystal_I2C *lcdPtr = nullptr;
int lcdAddress = -1;

// Timers
unsigned long lastSensorMs = 0;
const unsigned long SENSOR_INTERVAL_MS = 1000UL;
unsigned long lastBroadcastMs = 0;
const unsigned long BROADCAST_INTERVAL_MS = 1000UL;
unsigned long lastPublishMs = 0;

// Networking
WebSocketsServer webSocket(WS_PORT);
ESP8266WebServer httpServer(HTTP_PORT);
bool webSocketStarted = false;
bool wifiConnected = false;

// Store authenticated clients
bool clientAuthenticated[WEBSOCKETS_SERVER_CLIENT_MAX] = {false};

// Store last readings
float lastTemperature = NAN;
float lastHumidity = NAN;
int lastSoilPercent = -1;

void i2cScanAndInitLCD() {
  Wire.begin(D2, D1);
  Serial.println("I2C scanning for LCD address...");
  byte error, address;
  int count = 0;
  for (address = 1; address < 127; address++ ) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    if (error == 0) {
      Serial.print("I2C device found at 0x");
      Serial.println(address, HEX);
      count++;
      if (lcdAddress == -1) lcdAddress = address;
    }
  }
  if (count == 0) {
    Serial.println("No I2C devices found. Will try default 0x27");
    lcdAddress = 0x27;
  }
  Serial.print("Using LCD I2C address: 0x"); Serial.println(lcdAddress, HEX);
  lcdPtr = new LiquidCrystal_I2C(lcdAddress, 16, 2);
  lcdPtr->init();
  lcdPtr->backlight();
  lcdPtr->clear();
}

// HTTP endpoint to get device info (for discovery)
void handleDeviceInfo() {
  StaticJsonDocument<200> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["deviceName"] = DEVICE_NAME;
  doc["type"] = "ESP8266";
  doc["wsPort"] = WS_PORT;
  doc["requiresAuth"] = true;
  
  String response;
  serializeJson(doc, response);
  
  httpServer.sendHeader("Access-Control-Allow-Origin", "*");
  httpServer.send(200, "application/json", response);
}

// Handle CORS preflight
void handleCors() {
  httpServer.sendHeader("Access-Control-Allow-Origin", "*");
  httpServer.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  httpServer.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  httpServer.send(204);
}

void startHTTPServer() {
  httpServer.on("/device-info", HTTP_GET, handleDeviceInfo);
  httpServer.on("/device-info", HTTP_OPTIONS, handleCors);
  httpServer.begin();
  Serial.println("HTTP server started on port 80");
}

void startWebSocket() {
  if (!webSocketStarted) {
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
    webSocketStarted = true;
    Serial.printf("WebSocket server started on port %u\n", WS_PORT);
  }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("Client %u disconnected\n", num);
      clientAuthenticated[num] = false;
      break;
      
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("Client %u connected from %s\n", num, ip.toString().c_str());
        clientAuthenticated[num] = false;
        
        // Send auth request
        StaticJsonDocument<100> doc;
        doc["type"] = "auth_required";
        doc["message"] = "Please authenticate";
        char buf[100];
        serializeJson(doc, buf);
        webSocket.sendTXT(num, buf);
      }
      break;
      
    case WStype_TEXT:
      {
        Serial.printf("Received from client %u: %s\n", num, payload);
        
        // Parse incoming message
        StaticJsonDocument<200> doc;
        DeserializationError error = deserializeJson(doc, payload);
        
        if (!error) {
          const char* type = doc["type"];
          
          // Handle authentication
          if (strcmp(type, "auth") == 0) {
            const char* password = doc["password"];
            if (strcmp(password, DEVICE_PASSWORD) == 0) {
              clientAuthenticated[num] = true;
              
              StaticJsonDocument<150> response;
              response["type"] = "auth_success";
              response["deviceId"] = DEVICE_ID;
              response["deviceName"] = DEVICE_NAME;
              response["message"] = "Authentication successful";
              
              char buf[150];
              serializeJson(response, buf);
              webSocket.sendTXT(num, buf);
              
              Serial.printf("Client %u authenticated successfully\n", num);
              
              // Send current data immediately
              broadcastToClient(num);
            } else {
              StaticJsonDocument<100> response;
              response["type"] = "auth_failed";
              response["message"] = "Invalid password";
              
              char buf[100];
              serializeJson(response, buf);
              webSocket.sendTXT(num, buf);
              
              Serial.printf("Client %u authentication failed\n", num);
            }
          }
        }
      }
      break;
  }
}

void connectWiFi() {
  Serial.printf("Connecting to WiFi '%s' ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000UL) {
    delay(250);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\nWiFi connected, IP: " + WiFi.localIP().toString());
    
    // Start mDNS for device discovery
    if (MDNS.begin(DEVICE_ID)) {
      MDNS.addService("http", "tcp", HTTP_PORT);
      MDNS.addService("ws", "tcp", WS_PORT);
      Serial.println("mDNS responder started");
    }
    
    startHTTPServer();
    startWebSocket();
  } else {
    wifiConnected = false;
    Serial.println("\nWiFi connect failed");
  }
}

int readSoilADC() {
  int raw = analogRead(SOIL_PIN);
  return raw;
}

int soilPercentFromADC(int raw) {
  int dry = SOIL_DRY;
  int wet = SOIL_WET;
  if (dry == wet) return 0;
  if (dry > wet) {
    int t = dry; dry = wet; wet = t;
  }
  long percent = map(raw, dry, wet, 0, 100);
  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;
  return (int)percent;
}

void publishToThingSpeak(float t, float h, int soil) {
  if (WiFi.status() != WL_CONNECTED) return;

  String url = String("http://") + THINGSPEAK_HOST + "/update?api_key=" + THINGSPEAK_WRITE_APIKEY +
               "&field1=" + String(t,1) +
               "&field2=" + String(h,0) +
               "&field3=" + String(soil);

  WiFiClient client;
  HTTPClient http;
  http.begin(client, url);

  int code = http.GET();
  if (code > 0) {
    Serial.printf("ThingSpeak published: %d\n", code);
  } else {
    Serial.printf("ThingSpeak publish failed, code %d\n", code);
  }

  http.end();
}

void broadcastToClient(uint8_t num) {
  if (!clientAuthenticated[num]) return;
  
  StaticJsonDocument<200> doc;
  doc["type"] = "sensor_data";
  doc["deviceId"] = DEVICE_ID;
  if (isnan(lastTemperature))
    doc["temperature"] = "null";
  else
    doc["temperature"] = lastTemperature;

  if (isnan(lastHumidity))
    doc["humidity"] = "null";
  else
    doc["humidity"] = lastHumidity;

  doc["soil"] = lastSoilPercent;
  doc["timestamp"] = millis();
  
  char buf[256];
  serializeJson(doc, buf);
  webSocket.sendTXT(num, buf);
}

void broadcastJSON() {
  if (!webSocketStarted) return;
  
  StaticJsonDocument<200> doc;
  doc["type"] = "sensor_data";
  doc["deviceId"] = DEVICE_ID;
  if (isnan(lastTemperature))
    doc["temperature"] = "null";
  else
    doc["temperature"] = lastTemperature;

  if (isnan(lastHumidity))
    doc["humidity"] = "null";
  else
    doc["humidity"] = lastHumidity;

  doc["soil"] = lastSoilPercent;
  doc["timestamp"] = millis();
  
  char buf[256];
  serializeJson(doc, buf);
  
  // Only send to authenticated clients
  for (uint8_t i = 0; i < WEBSOCKETS_SERVER_CLIENT_MAX; i++) {
    if (clientAuthenticated[i]) {
      webSocket.sendTXT(i, buf);
    }
  }
}

void updateLCD() {
  if (!lcdPtr) return;
  lcdPtr->clear();
  lcdPtr->setCursor(0,0);
  if (!isnan(lastTemperature)) {
    lcdPtr->print("T:"); lcdPtr->print(lastTemperature,1); lcdPtr->print("C ");
    lcdPtr->print("H:"); lcdPtr->print((int)lastHumidity); lcdPtr->print("%");
  } else {
    lcdPtr->print("Sensor err");
  }
  lcdPtr->setCursor(0,1);
  lcdPtr->print("Soil:"); lcdPtr->print(lastSoilPercent); lcdPtr->print("%");
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("Starting...");
  Serial.printf("Device ID: %s\n", DEVICE_ID);
  Serial.printf("Device Name: %s\n", DEVICE_NAME);

  i2cScanAndInitLCD();
  dht.begin();
  connectWiFi();

  if (wifiConnected) {
    startHTTPServer();
    startWebSocket();
  } else {
    Serial.println("Warning: WiFi not connected at startup - will retry in loop.");
  }

  lastSensorMs = millis();
  lastBroadcastMs = millis();
  lastPublishMs = millis();
}

void loop() {
  unsigned long now = millis();

  // WiFi reconnect logic
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastTry = 0;
    if (now - lastTry > 5000UL) {
      lastTry = now;
      Serial.println("Trying WiFi reconnect...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASS);
      unsigned long start = millis();
      while (WiFi.status() != WL_CONNECTED && millis() - start < 8000UL) {
        delay(200);
      }
      if (WiFi.status() == WL_CONNECTED) {
        Serial.println("WiFi reconnected, IP: " + WiFi.localIP().toString());
        startHTTPServer();
        startWebSocket();
      } else {
        Serial.println("Reconnect failed");
      }
    }
  } else {
    if (webSocketStarted) webSocket.loop();
    httpServer.handleClient();
    MDNS.update();
  }

  // Sensor sampling
  if (now - lastSensorMs >= SENSOR_INTERVAL_MS) {
    lastSensorMs = now;
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    int rawSoil = readSoilADC();
    int soilPct = soilPercentFromADC(rawSoil);

    if (!isnan(h) && !isnan(t)) {
      lastHumidity = h;
      lastTemperature = t;
      lastSoilPercent = soilPct;
      Serial.printf("Sensor read: T=%.1f H=%.1f SoilRaw=%d SoilPct=%d\n", t, h, rawSoil, soilPct);
    } else {
      Serial.println("DHT read error");
    }

    updateLCD();
  }

  // WebSocket broadcast
  if (webSocketStarted && now - lastBroadcastMs >= BROADCAST_INTERVAL_MS) {
    lastBroadcastMs = now;
    broadcastJSON();
  }

  // Publish to cloud
  if (WiFi.status() == WL_CONNECTED && now - lastPublishMs >= PUBLISH_INTERVAL_MS) {
    lastPublishMs = now;
    if (!isnan(lastTemperature)) {
      publishToThingSpeak(lastTemperature, lastHumidity, lastSoilPercent);
    }
  }

  delay(10);
}