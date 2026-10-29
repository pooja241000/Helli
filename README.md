# ACCI ALERT - Smart Vehicle Collision Detection & Emergency Response System
**School Science Exhibition Project — Master Deployment & Operation Guide**

ACCI ALERT is a full-stack Internet-of-Things (IoT) life-safety system designed to eliminate medical response delays during the critical **"Golden Hour"** following road collisions. It bridges vehicle embedded sensors with emergency response dispatch through real-time web telemetry and instant multi-contact Telegram broadcasts.

---

## 📁 Complete Project Source Code File Structure

```
acci-alert/
├── .env.example                     # Environment template with backend & frontend variables
├── .gitignore                       # Git exclusion rules (node_modules, .env, data, dist)
├── Dockerfile                       # Multi-stage production container build (Render/Railway/VPS)
├── netlify.toml                     # Netlify SPA routing & build configuration
├── vercel.json                      # Vercel SPA routing & rewrites configuration
├── render.yaml                      # Render 1-click cloud service blueprint with persistent disk
├── package.json                     # Full dependencies, build and startup scripts
├── tsconfig.json                    # TypeScript compiler specifications
├── vite.config.ts                   # Vite build engine & React plugins
├── index.html                       # HTML5 entry point with metadata & fonts
├── README.md                        # Master documentation & exhibition guide
├── server.ts                        # Central Express backend & API router
├── server/
│   ├── db.ts                        # SQLite database engine (WAL mode) & query methods
│   └── telegram.ts                  # Telegram Bot API client & multi-chat dispatcher
└── src/
    ├── main.tsx                     # React 19 application bootstrapping
    ├── App.tsx                      # Primary state machine, polling & view controller
    ├── types.ts                     # Full TypeScript interfaces & 3-state connection model
    ├── index.css                    # Tailwind CSS 4 styles & font configurations
    ├── utils/
    │   └── api.ts                   # Multi-cloud API client (Netlify/Vercel/Render bridge)
    └── components/
        ├── Navbar.tsx               # Top bar contract with live hardware connection badge
        ├── StatusHeader.tsx         # 4 Telemetry cards (ESP32, isolated Wi-Fi, sensors, bot)
        ├── LatestAlertHero.tsx      # Emergency collision banner & Google Maps navigation
        ├── MapVisualizer.tsx        # Interactive coordinate mapper & GPS visualizer
        ├── EventsTable.tsx          # Filterable, searchable SQLite incident history
        ├── EventDetailModal.tsx     # Inspection modal with raw JSON & delivery audits
        ├── DemoControlModal.tsx     # Science fair demonstration & simulation module
        ├── TelegramTestModal.tsx    # Live Telegram handshake tester & diagnostics
        ├── BackendConfigModal.tsx   # Live backend switcher & connection prober
        ├── HardwareDocsTab.tsx      # ESP32 pinout table & updated 15s Arduino firmware
        └── ScienceProjectDocsTab.tsx# Exhibition presentation manual & deployment guide
```

---

## 🌐 Deployment Architecture Options

ACCI ALERT can be deployed in two battle-tested ways:

### Option A: Decoupled Architecture (Recommended for Vercel / Netlify)
- **Frontend**: Hosted on **Vercel** or **Netlify** (Global edge CDN, instant loads, zero server cost).
- **Backend**: Hosted on **Render**, **Railway**, **Fly.io**, or a **VPS** (Node.js + SQLite with persistent volume).
- **Communication**: The frontend connects to the backend via `VITE_API_BASE_URL` or through the in-app **Backend API** settings modal.

### Option B: Unified Full-Stack Container (Easiest Single-Domain Hosting)
- **Host**: **Render**, **Railway**, **Google Cloud Run**, or **DigitalOcean**.
- Both the Express API and the Vite frontend are compiled and served together from a single domain (`npm start`).
- Zero cross-origin setup required.

---

## 🚀 Step-by-Step Deployment Instructions

### 1. Deploying the Backend (Render / Railway / VPS)

Because ACCI ALERT uses **SQLite** for persistent incident logs and receives raw authenticated HTTP POST heartbeats from the ESP32, the backend runs as a persistent Node.js service.

#### On Render (Recommended):
1. Create a free account at [render.com](https://render.com).
2. Click **New +** &rarr; **Web Service**.
3. Connect your Git repository.
4. Settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Disks**, add a persistent disk:
   - **Name**: `acci-data`
   - **Mount Path**: `/app/data`
   - **Size**: 1 GB
6. In **Environment Variables**, add:
   ```bash
   TELEGRAM_BOT_TOKEN="8945333599:AAEGmRdt2rKdtA6I0lLJVlxM3bfyjSOwTpw"
   TELEGRAM_CHAT_ID_1="8202503146"
   TELEGRAM_CHAT_ID_2="7275581412"
   TELEGRAM_CHAT_ID_3="8312506925"
   DEVICE_API_KEY="acci_sec_device_token_2026"
   DATABASE_PATH="/app/data/acci-alert.db"
   PORT="3000"
   HEARTBEAT_TIMEOUT_SECONDS="45"
   ```
7. Click **Deploy**. Note your public URL (e.g., `https://acci-alert-backend.onrender.com`).

---

### 2. Deploying the Frontend (Netlify or Vercel)

#### On Vercel:
1. Log in to [vercel.com](https://vercel.com) and click **Add New...** &rarr; **Project**.
2. Import your Git repository.
3. Vercel automatically detects Vite and reads `vercel.json`.
4. In **Environment Variables**, add:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://your-backend-url.onrender.com` (leave blank if hosting together)
5. Click **Deploy**.

#### On Netlify:
1. Log in to [netlify.com](https://netlify.com) and click **Add new site** &rarr; **Import an existing project**.
2. Netlify automatically reads `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Under **Site configuration** &rarr; **Environment variables**, add:
   - `VITE_API_BASE_URL` = `https://your-backend-url.onrender.com`
4. Click **Deploy Site**.

> **Note**: You can also use the in-app **"Backend API"** button in the dashboard top navigation to point your deployed Vercel/Netlify frontend to any live backend URL on the fly!

---

## 🔒 Security & Secret Protection

- **Backend-Only Secrets**: `TELEGRAM_BOT_TOKEN` and `DEVICE_API_KEY` are read strictly on the Node.js backend environment.
- **Zero Frontend Leakage**: Neither token appears in JavaScript bundles, client localStorage, or public network responses.
- **Authenticated Device Access**: Every collision (`/api/accident`) and heartbeat (`/api/heartbeat`) from the ESP32 must provide the matching `x-device-key` header.
- **Truth-Telling Telemetry**: The dashboard never fakes heartbeats or claims the hardware is connected before a real authenticated packet arrives.

---

## 💾 How to Export or Download the Complete Project

### Method 1: Git Repository (Recommended)
From the project folder, run:
```bash
git init
git add .
git commit -m "Complete ACCI ALERT production project"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/acci-alert.git
git push -u origin main
```

### Method 2: Create a ZIP Archive
To package all source code into a clean, portable zip file:
```bash
tar -czvf acci-alert-project.tar.gz --exclude=node_modules --exclude=.git --exclude=dist .
```

---

## ⚡ Connecting the ESP32 Microcontroller to the Deployed Backend

Update the two constants at the top of your ESP32 Arduino sketch (`AcciAlert_Firmware_v2.ino` in the **Hardware & Pins** tab):

```cpp
// ===== CENTRAL ACCI ALERT BACKEND SERVER =====
// Replace with your public cloud backend URL (e.g. Render) or local network IP
const char* SERVER_BASE_URL = "https://acci-alert-backend.onrender.com";
const char* DEVICE_API_KEY  = "acci_sec_device_token_2026"; // Must match backend .env
```

Flash the ESP32 via Arduino IDE. Once connected to Wi-Fi (`Redmi 13`), the device will:
1. Dispatch an authenticated heartbeat every **15 seconds** to `/api/heartbeat`.
2. Transition the web dashboard from **"Waiting for ESP32"** to **"Connected"**.
3. Automatically stream collision and manual SOS events with NEO-6M satellite coordinates directly to the central dashboard and the 3 Telegram emergency contacts.
