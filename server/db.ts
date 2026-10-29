import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/acci-alert.db';
const resolvedDbPath = path.resolve(process.cwd(), dbPath);

// Ensure target directory exists
fs.mkdirSync(path.dirname(resolvedDbPath), { recursive: true });

export const db = new Database(resolvedDbPath);

// Enable WAL mode for high concurrency & reliability
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    event_type TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    gps_valid INTEGER NOT NULL DEFAULT 0,
    g_force REAL,
    sensor_summary TEXT,
    delivery_status TEXT NOT NULL,
    delivery_details TEXT,
    is_simulated INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS heartbeats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    device_id TEXT NOT NULL DEFAULT 'ESP32_ACCI_01',
    wifi_status TEXT NOT NULL,
    wifi_ssid TEXT DEFAULT 'Redmi 13',
    wifi_rssi INTEGER,
    mpu_status TEXT NOT NULL,
    gps_status TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    satellites INTEGER DEFAULT 0,
    uptime_seconds INTEGER DEFAULT 0,
    free_heap INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_heartbeats_timestamp ON heartbeats(timestamp DESC);
`);

// Alter table if wifi_ssid column doesn't exist
try {
  db.exec(`ALTER TABLE heartbeats ADD COLUMN wifi_ssid TEXT DEFAULT 'Redmi 13'`);
} catch (e) {
  // Column already exists
}

export interface AccidentEvent {
  id: string;
  timestamp: string;
  event_type: 'automatic_collision' | 'manual_sos';
  latitude: number | null;
  longitude: number | null;
  gps_valid: number; // 0 or 1
  g_force: number | null;
  sensor_summary: string | null;
  delivery_status: 'delivered' | 'partial' | 'failed' | 'skipped_demo';
  delivery_details: string | null;
  is_simulated: number; // 0 or 1
  notes: string | null;
  created_at?: string;
}

export interface DeviceHeartbeat {
  id?: number;
  timestamp: string;
  device_id: string;
  wifi_status: string;
  wifi_ssid?: string;
  wifi_rssi?: number;
  mpu_status: string;
  gps_status: string;
  latitude?: number | null;
  longitude?: number | null;
  satellites?: number;
  uptime_seconds?: number;
  free_heap?: number;
  created_at?: string;
}

export function saveEvent(event: AccidentEvent): void {
  const stmt = db.prepare(`
    INSERT INTO events (
      id, timestamp, event_type, latitude, longitude, gps_valid,
      g_force, sensor_summary, delivery_status, delivery_details, is_simulated, notes
    ) VALUES (
      @id, @timestamp, @event_type, @latitude, @longitude, @gps_valid,
      @g_force, @sensor_summary, @delivery_status, @delivery_details, @is_simulated, @notes
    )
  `);
  stmt.run(event);
}

export function getEvents(limit = 100): AccidentEvent[] {
  const stmt = db.prepare(`SELECT * FROM events ORDER BY timestamp DESC LIMIT ?`);
  return stmt.all(limit) as AccidentEvent[];
}

export function getEventById(id: string): AccidentEvent | undefined {
  const stmt = db.prepare(`SELECT * FROM events WHERE id = ?`);
  return stmt.get(id) as AccidentEvent | undefined;
}

export function saveHeartbeat(hb: DeviceHeartbeat): void {
  const stmt = db.prepare(`
    INSERT INTO heartbeats (
      timestamp, device_id, wifi_status, wifi_ssid, wifi_rssi,
      mpu_status, gps_status, latitude, longitude, satellites, uptime_seconds, free_heap
    ) VALUES (
      @timestamp, @device_id, @wifi_status, @wifi_ssid, @wifi_rssi,
      @mpu_status, @gps_status, @latitude, @longitude, @satellites, @uptime_seconds, @free_heap
    )
  `);
  stmt.run({
    timestamp: hb.timestamp,
    device_id: hb.device_id || 'ESP32_ACCI_01',
    wifi_status: hb.wifi_status || 'connected',
    wifi_ssid: hb.wifi_ssid || 'Redmi 13',
    wifi_rssi: hb.wifi_rssi ?? -65,
    mpu_status: hb.mpu_status || 'ok',
    gps_status: hb.gps_status || 'searching',
    latitude: hb.latitude ?? null,
    longitude: hb.longitude ?? null,
    satellites: hb.satellites ?? 0,
    uptime_seconds: hb.uptime_seconds ?? 0,
    free_heap: hb.free_heap ?? 0,
  });
}

export function getLatestHeartbeat(): DeviceHeartbeat | undefined {
  const stmt = db.prepare(`SELECT * FROM heartbeats ORDER BY timestamp DESC LIMIT 1`);
  return stmt.get() as DeviceHeartbeat | undefined;
}

export function clearHeartbeats(): void {
  db.prepare(`DELETE FROM heartbeats`).run();
}

export function getEventStats() {
  const total = db.prepare(`SELECT COUNT(*) as count FROM events`).get() as { count: number };
  const realCount = db.prepare(`SELECT COUNT(*) as count FROM events WHERE is_simulated = 0`).get() as { count: number };
  const simCount = db.prepare(`SELECT COUNT(*) as count FROM events WHERE is_simulated = 1`).get() as { count: number };
  const deliveredCount = db.prepare(`SELECT COUNT(*) as count FROM events WHERE delivery_status = 'delivered'`).get() as { count: number };
  const autoCount = db.prepare(`SELECT COUNT(*) as count FROM events WHERE event_type = 'automatic_collision'`).get() as { count: number };
  const sosCount = db.prepare(`SELECT COUNT(*) as count FROM events WHERE event_type = 'manual_sos'`).get() as { count: number };

  return {
    totalEvents: total.count,
    realEventsCount: realCount.count,
    simulatedEventsCount: simCount.count,
    deliveredCount: deliveredCount.count,
    automaticCollisionCount: autoCount.count,
    manualSosCount: sosCount.count,
  };
}
