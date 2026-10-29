import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  FileCode,
  Copy,
  Check,
  Terminal,
  Activity,
  Compass,
  Radio,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const HardwareDocsTab: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCurlAccident, setCopiedCurlAccident] = useState(false);
  const [copiedCurlHeartbeat, setCopiedCurlHeartbeat] = useState(false);

  const updatedFirmwareCode = `#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <TinyGPSPlus.h>

// ===== WI-FI CREDENTIALS =====
const char* WIFI_SSID     = "Redmi 13";
const char* WIFI_PASSWORD = "12345678M";

// ===== CENTRAL ACCI ALERT BACKEND SERVER =====
// Replace with your local machine IP (e.g., http://192.168.43.100:3000) or Cloud Run URL
const char* SERVER_BASE_URL = "http://192.168.43.100:3000";
const char* DEVICE_API_KEY  = "acci_sec_device_token_2026"; // Must match DEVICE_API_KEY in server .env

// ===== TELEGRAM DIRECT BACKUP =====
const char* BOT_TOKEN = "8945333599:AAEGmRdt2rKdtA6I0lLJVlxM3bfyjSOwTpw";
String CHAT_IDS[] = { "8202503146", "7275581412", "8312506925" };
const int TOTAL_CONTACTS = sizeof(CHAT_IDS) / sizeof(CHAT_IDS[0]);

// ===== LCD DISPLAY (16x2, ADDRESS 0x27) =====
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ===== GPIO PIN DEFINITIONS =====
#define CANCEL_BUTTON 18  // False alarm cancel switch
#define SOS_BUTTON    19  // Manual emergency SOS button
#define BUZZER_PIN    25  // Emergency buzzer
#define LED_PIN       26  // Status LED indicator
#define GPS_RX        16  // ESP32 RX2 connects to GPS TX
#define GPS_TX        17  // ESP32 TX2 connects to GPS RX
#define I2C_SDA       21  // SDA for MPU6050 and 16x2 LCD
#define I2C_SCL       22  // SCL for MPU6050 and 16x2 LCD

// ===== SENSOR & PERIPHERAL OBJECTS =====
Adafruit_MPU6050 mpu;
TinyGPSPlus gps;
HardwareSerial GPSSerial(2);
WiFiClientSecure secClient;
UniversalTelegramBot bot(BOT_TOKEN, secClient);

// ===== THRESHOLDS & TIMERS =====
const float CRASH_THRESHOLD          = 25.0;   // m/s^2 impact acceleration
const unsigned long CANCEL_WINDOW    = 10000;  // 10s cancellation window
const unsigned long CRASH_COOLDOWN   = 30000;  // 30s re-trigger cooldown
const unsigned long HEARTBEAT_INTERVAL = 15000; // 15s authenticated telemetry heartbeat

bool sensorReady   = false;
bool alertPending  = false;
bool lastSOS       = HIGH;
bool lastCancel    = HIGH;

unsigned long crashTime        = 0;
unsigned long lastSensorCheck  = 0;
unsigned long lastWiFiAttempt  = 0;
unsigned long lastCrashAlert   = 0;
unsigned long lastHeartbeatSend = 0;

void showLCD(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16));
}

// ===== POST TELEMETRY HEARTBEAT TO BACKEND (EVERY 15 SECONDS) =====
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_API_KEY);

  StaticJsonDocument<256> doc;
  doc["deviceId"] = "ESP32_ACCI_01";
  doc["wifiStatus"] = (WiFi.status() == WL_CONNECTED) ? "connected" : "reconnecting";
  doc["wifiSsid"] = WiFi.SSID();
  doc["wifiRssi"] = WiFi.RSSI();
  doc["mpuStatus"] = sensorReady ? "ok" : "error";
  doc["gpsStatus"] = (gps.location.isValid() && gps.location.age() < 10000) ? "fix_acquired" : "searching";
  
  if (gps.location.isValid()) {
    doc["latitude"] = gps.location.lat();
    doc["longitude"] = gps.location.lng();
    doc["satellites"] = gps.satellites.value();
  }
  doc["uptimeSeconds"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    Serial.println("[ACCI ALERT] Heartbeat delivered to central dashboard.");
  } else {
    Serial.printf("[ACCI ALERT] Heartbeat HTTP response: %d\\n", httpCode);
  }
  http.end();
}

// ===== POST ACCIDENT EVENT TO BACKEND SERVER =====
void sendServerAlert(String eventType, float gForce) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ACCI ALERT] Cannot post accident: Wi-Fi disconnected.");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/accident";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_API_KEY);

  StaticJsonDocument<384> doc;
  doc["eventType"] = eventType; // "automatic_collision" or "manual_sos"
  doc["gForce"] = gForce;
  doc["isSimulated"] = false; // Authenticated hardware alert

  bool gpsValid = gps.location.isValid() && gps.location.age() < 15000;
  doc["gpsValid"] = gpsValid;
  if (gpsValid) {
    doc["latitude"] = gps.location.lat();
    doc["longitude"] = gps.location.lng();
  }

  JsonObject sensor = doc.createNestedObject("sensorSummary");
  sensor["node"] = "ESP32_ACCI_01";
  sensor["peakAcc"] = gForce;

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  Serial.printf("[ACCI ALERT] Server incident POST response: %d\\n", httpCode);
  http.end();
}

// ===== DISPATCH RESCUE ALERT =====
void sendAlert(String reason, String eventType, float gForce) {
  showLCD("SOS SENDING...", "Contacting Hub");

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Alert not sent: Wi-Fi disconnected.");
    showLCD("WiFi DISCONNECTED", "Alert not sent");
    return;
  }

  // 1. Dispatch to Central Dashboard via API
  sendServerAlert(eventType, gForce);

  // 2. Direct Telegram Backup Dispatch
  String message = "ACCI ALERT EMERGENCY\\n";
  message += "Reason: " + reason + "\\n";

  if (gps.location.isValid() && gps.location.age() < 10000) {
    double lat = gps.location.lat();
    double lon = gps.location.lng();
    message += "Latitude: " + String(lat, 6) + "\\n";
    message += "Longitude: " + String(lon, 6) + "\\n";
    message += "Map: https://maps.google.com/?q=" + String(lat, 6) + "," + String(lon, 6);
  } else {
    message += "GPS fix unavailable.";
  }

  int successCount = 0;
  for (int i = 0; i < TOTAL_CONTACTS; i++) {
    if (bot.sendMessage(CHAT_IDS[i], message, "")) {
      successCount++;
    }
    delay(200);
  }

  if (successCount > 0) {
    showLCD("ALERT DISPATCHED", "Contacts: " + String(successCount));
  } else {
    showLCD("CENTRAL SENT", "Telegram Backup Err");
  }

  delay(2000);
  showLCD("AcciAlert Ready", "System monitoring");
}

void setup() {
  Serial.begin(115200);

  pinMode(CANCEL_BUTTON, INPUT_PULLUP);
  pinMode(SOS_BUTTON, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  // LCD & MPU6050 share I2C bus (SDA 21, SCL 22)
  Wire.begin(I2C_SDA, I2C_SCL);
  lcd.init();
  lcd.backlight();
  showLCD("AcciAlert Hub", "Starting...");

  // GPS UART
  GPSSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  // MPU6050
  sensorReady = mpu.begin();
  if (sensorReady) {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("MPU6050 calibrated & ready.");
  } else {
    Serial.println("MPU6050 not detected!");
    showLCD("MPU6050 ERROR", "Check wiring");
    delay(1500);
  }

  // Connect Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  showLCD("Connecting WiFi", "Please wait...");

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 12000) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();

  secClient.setInsecure();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected. IP: " + WiFi.localIP().toString());
    showLCD("WiFi Online", "Syncing Server");
    sendHeartbeat();
  } else {
    Serial.println("WiFi unavailable. Running standalone.");
    showLCD("WiFi Standby", "Local sensing");
  }

  delay(1200);
  showLCD("AcciAlert Ready", "System monitoring");
}

void loop() {
  // Read NMEA sentences from GPS
  while (GPSSerial.available()) {
    gps.encode(GPSSerial.read());
  }

  // Auto Reconnect Wi-Fi
  if (WiFi.status() != WL_CONNECTED && millis() - lastWiFiAttempt >= 10000) {
    lastWiFiAttempt = millis();
    WiFi.reconnect();
  }

  // Periodic Telemetry Heartbeat to Dashboard
  if (WiFi.status() == WL_CONNECTED && millis() - lastHeartbeatSend >= HEARTBEAT_INTERVAL) {
    lastHeartbeatSend = millis();
    sendHeartbeat();
  }

  // MANUAL EMERGENCY SOS
  bool sos = digitalRead(SOS_BUTTON);
  if (lastSOS == HIGH && sos == LOW) {
    Serial.println("Manual SOS triggered!");
    digitalWrite(LED_PIN, HIGH);
    sendAlert("Manual SOS button", "manual_sos", 0.0);
    digitalWrite(LED_PIN, LOW);
  }
  lastSOS = sos;

  // CANCEL BUTTON (Cancels False Alarm during 10s buzzer countdown)
  bool cancel = digitalRead(CANCEL_BUTTON);
  if (lastCancel == HIGH && cancel == LOW && alertPending) {
    alertPending = false;
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_PIN, LOW);
    showLCD("CRASH CANCELLED", "False alarm");
    Serial.println("Crash alert cancelled by passenger.");
    delay(1500);
    showLCD("AcciAlert Ready", "System monitoring");
  }
  lastCancel = cancel;

  // AUTOMATIC CRASH DETECTION
  if (sensorReady && !alertPending && millis() - lastSensorCheck >= 100) {
    lastSensorCheck = millis();

    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    float acceleration = sqrt(
      a.acceleration.x * a.acceleration.x +
      a.acceleration.y * a.acceleration.y +
      a.acceleration.z * a.acceleration.z
    );

    bool cooldownFinished = (lastCrashAlert == 0) || (millis() - lastCrashAlert >= CRASH_COOLDOWN);

    if (acceleration > CRASH_THRESHOLD && cooldownFinished) {
      alertPending = true;
      crashTime = millis();
      showLCD("CRASH WARNING!", "Press to cancel");
      Serial.printf("Impact detected: %.2f m/s^2! Cancel within 10s.\\n", acceleration);
    }
  }

  // 10-SECOND BUZZER / LED COUNTDOWN
  if (alertPending) {
    digitalWrite(LED_PIN, HIGH);
    digitalWrite(BUZZER_PIN, (millis() / 250) % 2 ? HIGH : LOW);

    if (millis() - crashTime >= CANCEL_WINDOW) {
      alertPending = false;
      lastCrashAlert = millis();
      digitalWrite(BUZZER_PIN, LOW);
      digitalWrite(LED_PIN, LOW);

      sendAlert("Possible crash detected", "automatic_collision", 28.5);
    }
  }

  delay(5);
}`;

  const curlAccidentSample = `curl -X POST http://localhost:3000/api/accident \\
  -H "Content-Type: application/json" \\
  -H "x-device-key: acci_sec_device_token_2026" \\
  -d '{
    "eventType": "automatic_collision",
    "gForce": 29.4,
    "gpsValid": true,
    "latitude": 12.971598,
    "longitude": 77.594562,
    "isSimulated": false
  }'`;

  const curlHeartbeatSample = `curl -X POST http://localhost:3000/api/heartbeat \\
  -H "Content-Type: application/json" \\
  -H "x-device-key: acci_sec_device_token_2026" \\
  -d '{
    "deviceId": "ESP32_ACCI_01",
    "wifiStatus": "connected",
    "wifiRssi": -58,
    "mpuStatus": "ok",
    "gpsStatus": "fix_acquired",
    "latitude": 12.971598,
    "longitude": 77.594562,
    "satellites": 8,
    "uptimeSeconds": 1420,
    "freeHeap": 221040
  }'`;

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                School Science Exhibition Project
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400">Technical Documentation</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Hardware Architecture & ESP32 Integration
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Complete pinout schematics, serial wiring assignments, and updated production-ready Arduino C++ firmware connecting the ESP32 microcontroller to this central web dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30">
              Baud: 115200 / 9600
            </span>
          </div>
        </div>
      </div>

      {/* Pinout Matrix Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-white">
              ESP32 Dev Module Pinout & Peripherals
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Microcontroller: ESP-WROOM-32 (38-pin DevKit)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090e17] text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Peripheral Component</th>
                <th className="px-4 py-3 font-semibold">ESP32 Pin Connection</th>
                <th className="px-4 py-3 font-semibold">Interface Protocol</th>
                <th className="px-4 py-3 font-semibold">Operating Specification</th>
                <th className="px-4 py-3 font-semibold">Functional Role in Accident Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-indigo-400" />
                  <span>MPU6050 IMU Sensor</span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-200">
                  SDA: GPIO 21 · SCL: GPIO 22
                </td>
                <td className="px-4 py-3 text-slate-400">I2C Bus (Address 0x68)</td>
                <td className="px-4 py-3 font-mono text-slate-300">±8G range, 21Hz filter</td>
                <td className="px-4 py-3 text-slate-300">
                  Measures instantaneous G-force vector. Triggers crash state if vector &gt; 25.0 m/s².
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                  <Compass className="h-3.5 w-3.5 text-sky-400" />
                  <span>NEO-6M GPS Module</span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-200">
                  RX: GPIO 16 · TX: GPIO 17
                </td>
                <td className="px-4 py-3 text-slate-400">UART Serial2 (9600 Baud)</td>
                <td className="px-4 py-3 font-mono text-slate-300">NMEA 0183 sentences</td>
                <td className="px-4 py-3 text-slate-300">
                  Calculates real-time latitude, longitude, and satellite lock for rescue navigation.
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  <span>16x2 I2C Character LCD</span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-200">
                  SDA: GPIO 21 · SCL: GPIO 22
                </td>
                <td className="px-4 py-3 text-slate-400">I2C Bus (Address 0x27)</td>
                <td className="px-4 py-3 font-mono text-slate-300">16 cols x 2 rows (5V)</td>
                <td className="px-4 py-3 text-slate-300">
                  Local in-vehicle status display showing WiFi, crash warning countdown, and alerts.
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-amber-400" />
                  <span>False-Alarm Cancel Button</span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-200">GPIO 18</td>
                <td className="px-4 py-3 text-slate-400">Digital Input (Pull-Up)</td>
                <td className="px-4 py-3 font-mono text-slate-300">Active LOW</td>
                <td className="px-4 py-3 text-slate-300">
                  Allows driver to cancel a false collision warning within the 10-second buzzer window.
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-rose-400" />
                  <span>Manual Emergency SOS Button</span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-200">GPIO 19</td>
                <td className="px-4 py-3 text-slate-400">Digital Input (Pull-Up)</td>
                <td className="px-4 py-3 font-mono text-slate-300">Active LOW</td>
                <td className="px-4 py-3 text-slate-300">
                  Immediate emergency trigger without waiting for accelerometer spike.
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-yellow-400" />
                  <span>Active Piezo Buzzer</span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-200">GPIO 25</td>
                <td className="px-4 py-3 text-slate-400">Digital Output</td>
                <td className="px-4 py-3 font-mono text-slate-300">Active HIGH (Pulsed)</td>
                <td className="px-4 py-3 text-slate-300">
                  Audible 10-second warning countdown before permanent emergency dispatch.
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-rose-500" />
                  <span>High-Luminance LED</span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-200">GPIO 26</td>
                <td className="px-4 py-3 text-slate-400">Digital Output (330Ω)</td>
                <td className="px-4 py-3 font-mono text-slate-300">Active HIGH</td>
                <td className="px-4 py-3 text-slate-300">
                  Visual strobe signal warning vehicle occupants of pending emergency transmission.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* REST API Contract Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Endpoint 1: POST /api/accident */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-rose-400">
                POST /api/accident
              </span>
              <button
                onClick={() => copyToClipboard(curlAccidentSample, setCopiedCurlAccident)}
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded"
              >
                {copiedCurlAccident ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCurlAccident ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Transmits authenticated collision or SOS payload. Dispatches Telegram notifications to all 3 emergency chat channels when authenticated.
            </p>
            <div className="mt-3">
              <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto">
                {curlAccidentSample}
              </pre>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Auth Header: <code className="text-emerald-400 font-mono">x-device-key: DEVICE_API_KEY</code>
          </div>
        </div>

        {/* Endpoint 2: POST /api/heartbeat */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-sky-400">
                POST /api/heartbeat
              </span>
              <button
                onClick={() => copyToClipboard(curlHeartbeatSample, setCopiedCurlHeartbeat)}
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded"
              >
                {copiedCurlHeartbeat ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCurlHeartbeat ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Periodic node heartbeat sent every 15s. Drives the 3 connection states: Waiting for ESP32 &rarr; Connected &rarr; Disconnected (after 45s timeout).
            </p>
            <div className="mt-3">
              <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto">
                {curlHeartbeatSample}
              </pre>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Cadence: <code className="text-sky-400 font-mono">15s dispatch</code> · Timeout: <code className="text-rose-400 font-mono">45s (3 missed cycles)</code>
          </div>
        </div>
      </div>

      {/* 3-State Connection Architecture Visual Card */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-emerald-400" />
          <span>Device Connection State Architecture (Truth-Telling Guarantee)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#080d18] border border-amber-500/30">
            <span className="text-amber-400 font-bold font-mono">State 1: Waiting for ESP32</span>
            <p className="text-slate-300 mt-1">
              Active before the very first authenticated heartbeat is received from the physical ESP32. Does not falsely report "Disconnected" during development setup.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#080d18] border border-emerald-500/30">
            <span className="text-emerald-400 font-bold font-mono">State 2: Connected</span>
            <p className="text-slate-300 mt-1">
              Engaged exclusively after a valid authenticated HTTP heartbeat arrives at <code className="text-emerald-300 font-mono">/api/heartbeat</code>. Maintained as long as heartbeats arrive within 45s.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#080d18] border border-rose-500/30">
            <span className="text-rose-400 font-bold font-mono">State 3: Disconnected</span>
            <p className="text-slate-300 mt-1">
              Triggered automatically when heartbeats cease for more than 45 seconds (3 missed 15s intervals). Displays exact timestamp of the last successful transmission.
            </p>
          </div>
        </div>
      </div>

      {/* Complete Updated ESP32 Arduino C++ Code */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#090e17]">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">
              Complete Updated ESP32 Arduino Firmware (AcciAlert_Firmware_v2.ino)
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(updatedFirmwareCode, setCopiedCode)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
          >
            {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Full Arduino Code'}</span>
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs text-slate-400 mb-3">
            This enhanced firmware integrates the central web dashboard while retaining local 16x2 LCD feedback, buzzer countdown, false-alarm cancel button, and direct Telegram backup. Flash using Arduino IDE with the ESP32 board package installed.
          </p>
          <pre className="p-4 rounded-lg bg-black/80 border border-slate-800 text-[11px] text-emerald-300/90 font-mono overflow-x-auto max-h-[480px]">
            {updatedFirmwareCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
