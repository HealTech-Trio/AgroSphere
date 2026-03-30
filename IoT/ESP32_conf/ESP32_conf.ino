// ESP32: Improved firmware
// - I2C scanner to find LCD address
// - Calibratable soil mapping (SOIL_DRY / SOIL_WET) to avoid inverted mapping
// - Separate sensor sampling and broadcast/publish intervals (millis-based)
// - WebSocket server for real-time local streaming
// - Optional ThingSpeak publishing (set PUBLISH_INTERVAL_MS; ThingSpeak rate limits apply)

// Libraries
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "DHT.h"

// --- CONFIG: update these ---
const char* WIFI_SSID = "DIVIN";
const char* WIFI_PASS = "12345678";

// ThingSpeak (fallback cloud)
const char* THINGSPEAK_HOST = "api.thingspeak.com";
const char* THINGSPEAK_WRITE_APIKEY = "DF5VXUUQQUSM8NY9"; // keep your write key here
// If you want server fallback polling on the app side, use the URL the user gave for GET:
// https://api.thingspeak.com/channels/3120646/fields/1.json?api_key=LQ5BDDZGONQ92JTQ&results=2

// Publish interval to cloud (milliseconds)
// IMPORTANT: If you use ThingSpeak, do NOT set this < 15000 (ThingSpeak rate limits).
// Use 20000 (20s) by default. If using your own server you can set it to 1000 or 2000.
const unsigned long PUBLISH_INTERVAL_MS = 20000UL;

// WebSocket port
const uint16_t WS_PORT = 81;

// --- SENSOR & PERIPHERAL PINS ---
#define DHTPIN 5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define SOIL_PIN  32  // ADC pin (adjust if needed)

// Soil calibration (YOU MUST CALIBRATE THESE VALUES)
// Read raw ADC value when probe is DRY -> set SOIL_DRY
// Read raw ADC value when probe is FULLY WET -> set SOIL_WET
// Then mapping below will produce 0% .. 100% correctly.
int SOIL_DRY = 0;  // example - replace with your measured dry value
int SOIL_WET = 2400;  // example - replace with your measured wet value

// I2C LCD
LiquidCrystal_I2C *lcdPtr = nullptr; // will be created after scanning
int lcdAddress = -1; // detected address

// Timers
unsigned long lastSensorMs = 0;
const unsigned long SENSOR_INTERVAL_MS = 1000UL; // sample sensors every 1s
unsigned long lastBroadcastMs = 0;
const unsigned long BROADCAST_INTERVAL_MS = 1000UL; // broadcast via WS every 1s
unsigned long lastPublishMs = 0;

// Networking
WebSocketsServer webSocket(WS_PORT);
bool webSocketStarted = false;
bool wifiConnected = false;

// Store last readings
float lastTemperature = NAN;
float lastHumidity = NAN;
int lastSoilPercent = -1;

// ---------- FUNCTIONS ----------
void i2cScanAndInitLCD() {
  Wire.begin(); // default pins
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
      // If device looks like an LCD backpack typical addresses 0x27 or 0x3F
      // we use first found address for LCD initialization.
      if (lcdAddress == -1) lcdAddress = address;
    }
  }
  if (count == 0) {
    Serial.println("No I2C devices found. Will try default 0x27");
    lcdAddress = 0x27;
  }
  Serial.print("Using LCD I2C address: 0x"); Serial.println(lcdAddress, HEX);
  // Create lcd object
  lcdPtr = new LiquidCrystal_I2C(lcdAddress, 16, 2);
  lcdPtr->init();
  lcdPtr->backlight();
  lcdPtr->clear();
}

void startWebSocket() {
  if (!webSocketStarted) {
    webSocket.begin();
    webSocket.onEvent([](uint8_t num, WStype_t t, uint8_t * p, size_t l){
      if (t == WStype_TEXT) {
        Serial.printf("Received from client %u: %s\n", num, p);
      }
    });
    webSocketStarted = true;
    Serial.printf("WebSocket server started on port %u\n", WS_PORT);
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
    startWebSocket();
  } else {
    wifiConnected = false;
    Serial.println("\nWiFi connect failed");
  }
}

int readSoilADC() {
  // ADC reading (ESP32 ADC is 12-bit but Arduino analogRead returns 0-4095)
  int raw = analogRead(SOIL_PIN);
  return raw;
}

int soilPercentFromADC(int raw) {
  // Calibrated mapping:
  // If raw >= SOIL_DRY -> 0% (dry)
  // If raw <= SOIL_WET -> 100% (wet)
  // Otherwise map linearly
  int wet = SOIL_DRY;
  int dry = SOIL_WET;
  if (dry == wet) return 0; // avoid division by zero; instruct to calibrate
  // Ensure dry > wet in typical probes; if not, swap
  if (dry < wet) {
    int t = dry; dry = wet; wet = t;
  }
  int percent = map(raw, dry, wet, 0, 100);
  percent = constrain(percent, 0, 100);
  return percent;
}

void publishToThingSpeak(float t, float h, int soil) {
  if (WiFi.status() != WL_CONNECTED) return;
  // Compose URL
  String url = String("http://") + THINGSPEAK_HOST + "/update?api_key=" + THINGSPEAK_WRITE_APIKEY +
               "&field1=" + String(t,1) +
               "&field2=" + String(h,0) +
               "&field3=" + String(soil);
  HTTPClient http;
  http.begin(url);
  int code = http.GET();
  if (code > 0) {
    Serial.printf("ThingSpeak published: %d\n", code);
  } else {
    Serial.printf("ThingSpeak publish failed, code %d\n", code);
  }
  http.end();
}

void broadcastJSON() {
  if (!webSocketStarted) return;
  StaticJsonDocument<256> doc;
  doc["deviceId"] = "ESP32-01";
  doc["temperature"] = lastTemperature;
  doc["humidity"] = lastHumidity;
  doc["soil"] = lastSoilPercent;
  String out;
  serializeJson(doc, out);
  webSocket.broadcastTXT(out);
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

// ---------- SETUP / LOOP ----------
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("Starting...");

  // I2C + LCD detection
  i2cScanAndInitLCD();

  dht.begin();

  // try WiFi
  connectWiFi();

  if (wifiConnected) {
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

  // WiFi reconnect logic (non-blocking)
  if (WiFi.status() != WL_CONNECTED) {
    // attempt reconnect every 5s
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
        startWebSocket();
      } else {
        Serial.println("Reconnect failed");
      }
    }
  } else {
    // service WS events
    if (webSocketStarted) webSocket.loop();
  }

  // Sensor sampling (every SENSOR_INTERVAL_MS)
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

    // Update LCD after sampling
    updateLCD();
  }

  // WebSocket broadcast (every BROADCAST_INTERVAL_MS)
  if (webSocketStarted && now - lastBroadcastMs >= BROADCAST_INTERVAL_MS) {
    lastBroadcastMs = now;
    broadcastJSON();
  }

  // Publish to cloud (ThingSpeak or other) every PUBLISH_INTERVAL_MS
  if (WiFi.status() == WL_CONNECTED && now - lastPublishMs >= PUBLISH_INTERVAL_MS) {
    lastPublishMs = now;
    if (!isnan(lastTemperature)) {
      publishToThingSpeak(lastTemperature, lastHumidity, lastSoilPercent);
    }
  }

  // small yield to let WiFi run (do not delay long)
  delay(10);
}
