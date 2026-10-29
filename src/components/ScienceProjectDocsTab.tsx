import React from 'react';
import {
  ShieldAlert,
  Cpu,
  Send,
  Compass,
  Activity,
  Terminal,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Server,
  Globe,
  Download,
  FolderTree,
  ExternalLink,
  Code2,
} from 'lucide-react';

export const ScienceProjectDocsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Exhibition Header */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
            School Science Exhibition 2026
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-400">Project Master Manual</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
          ACCI ALERT: Automated Collision Detection & Emergency Response System
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
          ACCI ALERT is an Internet-of-Things (IoT) life-safety project designed to minimize response times during the critical <strong>"Golden Hour"</strong> following road accidents. By fusing an ESP32 microcontroller, MPU6050 triple-axis accelerometer/gyroscope, and NEO-6M satellite GPS module, the device autonomously detects high-impact collisions, provides vehicle occupants with a 10-second false-alarm cancellation grace period, and dispatches immediate real-time satellite coordinates to designated emergency contacts via Telegram and a live central command dashboard.
        </p>
      </div>

      {/* Operational Flow Diagram / Step Matrix */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-rose-400" />
          <span>System Operational Workflow & Incident Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#080d18] border border-slate-800 relative">
            <span className="text-[10px] font-mono text-rose-400 font-bold uppercase">
              Phase 01 · Impact Sensing
            </span>
            <h4 className="text-sm font-semibold text-white mt-1">
              Collision Detection
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              MPU6050 continuously samples linear acceleration. If vector magnitude exceeds <strong className="text-slate-200">25.0 m/s²</strong> (or manual SOS on GPIO 19 is pressed), emergency sequence initiates.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#080d18] border border-slate-800 relative">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
              Phase 02 · Verification
            </span>
            <h4 className="text-sm font-semibold text-white mt-1">
              10s Grace Window
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Active buzzer pulses on GPIO 25, LED strobes on GPIO 26, and 16x2 LCD warns occupants. Pressing GPIO 18 cancels the alarm if it was a false alarm (e.g., severe speed bump).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#080d18] border border-slate-800 relative">
            <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">
              Phase 03 · Telemetry Lock
            </span>
            <h4 className="text-sm font-semibold text-white mt-1">
              GPS Coordinate Extraction
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              NEO-6M GPS extracts NMEA sentences via HardwareSerial2 (GPIO 16/17). If satellites are locked, accurate latitude and longitude are formatted with Google Maps links.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#080d18] border border-slate-800 relative">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
              Phase 04 · Dual Dispatch
            </span>
            <h4 className="text-sm font-semibold text-white mt-1">
              Multi-Contact Broadcast
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              ESP32 transmits authenticated HTTP POST to central backend and executes direct Telegram Bot API dispatch to all 3 emergency contacts (<code className="text-slate-300">8202503146</code>, <code className="text-slate-300">7275581412</code>, <code className="text-slate-300">8312506925</code>).
            </p>
          </div>
        </div>
      </div>

      {/* Production & Multi-Cloud Deployment Architecture */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">
              Multi-Platform Deployment Guide (Vercel, Netlify, Render, Railway)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Separated or Unified Hosting
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          ACCI ALERT is engineered with architectural flexibility: you can host the application as a <strong>single unified container</strong> (backend + frontend served together) or as a <strong>decoupled architecture</strong> where the React dashboard is hosted on static edge networks (Netlify/Vercel) while the Node.js + SQLite engine runs on a persistent cloud container.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card A: Netlify & Vercel Setup */}
          <div className="p-4 rounded-lg bg-[#080d18] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Frontend: Netlify or Vercel
              </span>
              <span className="text-[10px] font-mono text-slate-400">Static Edge CDN</span>
            </div>

            <p className="text-xs text-slate-400">
              Pre-configured configuration files (<code className="text-slate-200">netlify.toml</code> and <code className="text-slate-200">vercel.json</code>) are already generated in the root directory.
            </p>

            <div className="space-y-2 text-xs text-slate-300">
              <div>
                <strong>1. Build Settings:</strong>
                <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                  • Build Command: <code className="text-emerald-300">npm run build</code><br />
                  • Publish Directory: <code className="text-emerald-300">dist</code>
                </div>
              </div>

              <div>
                <strong>2. Connect to Backend:</strong>
                <p className="text-slate-400 mt-0.5">
                  In Netlify/Vercel project environment settings, add:
                </p>
                <pre className="p-2 rounded bg-black/60 border border-slate-800 font-mono text-[11px] text-sky-300 mt-1">
                  VITE_API_BASE_URL="https://your-backend.onrender.com"
                </pre>
              </div>

              <div>
                <strong>3. Live In-App Switching:</strong>
                <p className="text-slate-400 mt-0.5">
                  You can also switch or test backend URLs directly inside the dashboard using the <strong className="text-white">"Backend API"</strong> button in the navigation bar.
                </p>
              </div>
            </div>
          </div>

          {/* Card B: Backend Server Setup */}
          <div className="p-4 rounded-lg bg-[#080d18] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Backend: Render, Railway, or VPS
              </span>
              <span className="text-[10px] font-mono text-slate-400">Node.js + SQLite</span>
            </div>

            <p className="text-xs text-slate-400">
              Because ACCI ALERT uses persistent SQLite storage and receives raw HTTP POST heartbeats from the ESP32, the backend runs as a persistent Node.js service.
            </p>

            <div className="space-y-2 text-xs text-slate-300">
              <div>
                <strong>1. 1-Click Render Blueprint:</strong>
                <p className="text-slate-400 mt-0.5">
                  A ready-to-use <code className="text-slate-200">render.yaml</code> and <code className="text-slate-200">Dockerfile</code> are included.
                </p>
              </div>

              <div>
                <strong>2. Required Backend Environment Variables:</strong>
                <div className="font-mono text-[11px] text-slate-300 space-y-0.5 mt-1 bg-black/60 p-2 rounded border border-slate-800">
                  <div>TELEGRAM_BOT_TOKEN="your_bot_token"</div>
                  <div>DEVICE_API_KEY="acci_sec_device_token_2026"</div>
                  <div>DATABASE_PATH="./data/acci-alert.db"</div>
                  <div>PORT=3000</div>
                  <div>HEARTBEAT_TIMEOUT_SECONDS=45</div>
                </div>
              </div>

              <div>
                <strong>3. Hardware Connectivity:</strong>
                <p className="text-slate-400 mt-0.5">
                  Program your ESP32's <code className="text-slate-200">SERVER_BASE_URL</code> with your backend's public domain.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Project File Tree */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">
              Complete Project Source Code File Structure
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">100% Production Ready</span>
        </div>

        <p className="text-xs text-slate-400">
          Here is the complete organized codebase layout ready for export and Git repository initialization:
        </p>

        <pre className="p-4 rounded-lg bg-black/80 border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto leading-relaxed">
{`acci-alert/
├── .env.example                     # Environment template with backend & frontend variables
├── .gitignore                       # Git exclusion rules (node_modules, .env, data, dist)
├── Dockerfile                       # Multi-stage production container build
├── netlify.toml                     # Netlify SPA routing & build configuration
├── vercel.json                      # Vercel SPA routing & rewrites configuration
├── render.yaml                      # Render 1-click cloud service blueprint with disk
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
        └── ScienceProjectDocsTab.tsx# Exhibition presentation manual & deployment guide`}
        </pre>
      </div>

      {/* How to Export or Download the Complete Project */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Download className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-white">
            How to Export or Download the Source Code
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-lg bg-[#080d18] border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span>Method 1: Push to GitHub</span>
            </span>
            <p className="text-slate-400 leading-relaxed">
              Initialize a Git repository and push all files to GitHub. Vercel and Netlify can then automatically import your repository in one click:
            </p>
            <pre className="p-2 rounded bg-black/60 border border-slate-800 font-mono text-[11px] text-emerald-300">
git init<br />
git add .<br />
git commit -m "Initial ACCI ALERT release"<br />
git branch -M main<br />
git remote add origin &lt;YOUR_REPO_URL&gt;<br />
git push -u origin main
            </pre>
          </div>

          <div className="p-3.5 rounded-lg bg-[#080d18] border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span>Method 2: Netlify Drop / CLI</span>
            </span>
            <p className="text-slate-400 leading-relaxed">
              Build the frontend locally into the <code className="text-slate-200">dist/</code> folder and deploy instantly using the Netlify CLI:
            </p>
            <pre className="p-2 rounded bg-black/60 border border-slate-800 font-mono text-[11px] text-emerald-300">
npm run build<br />
npx netlify deploy --prod --dir=dist
            </pre>
            <p className="text-[11px] text-slate-500">
              Or drag-and-drop the generated <code className="text-slate-400">dist</code> folder into the Netlify Drop web UI.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#080d18] border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span>Method 3: Vercel CLI</span>
            </span>
            <p className="text-slate-400 leading-relaxed">
              Deploy directly to Vercel in seconds using the official Vercel command line:
            </p>
            <pre className="p-2 rounded bg-black/60 border border-slate-800 font-mono text-[11px] text-emerald-300">
npx vercel
            </pre>
            <p className="text-[11px] text-slate-500">
              Vercel detects <code className="text-slate-400">vercel.json</code> and builds the Vite SPA automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
