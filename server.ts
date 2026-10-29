import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  saveEvent,
  getEvents,
  getEventById,
  saveHeartbeat,
  getLatestHeartbeat,
  clearHeartbeats,
  getEventStats,
  AccidentEvent,
} from './server/db.ts';
import {
  checkTelegramBotStatus,
  sendAccidentAlert,
  getConfiguredChatIds,
} from './server/telegram.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-device-key', 'x-api-key', 'Authorization', 'Accept'],
    credentials: true,
  })
);
app.use(express.json());

// In-memory rate limiter helper
const rateLimitBuckets = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(ip: string, limit = 15, windowMs = 60000): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip);
  if (!bucket || now > bucket.resetTime) {
    rateLimitBuckets.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) {
    return false;
  }
  bucket.count++;
  return true;
}

// Global state tracking
let lastRealHeartbeatTime: number | null = null;
let lastHeartbeatData: any = null;

// Helper to authenticate ESP32 requests
function verifyDeviceAuth(req: express.Request): boolean {
  const configuredKey = process.env.DEVICE_API_KEY?.trim();
  // If no key is configured on server, warn and reject for strict security
  if (!configuredKey) {
    return false;
  }

  const providedKey =
    req.headers['x-device-key'] ||
    req.headers['x-api-key'] ||
    req.headers['authorization']?.replace(/^Bearer\s+/i, '') ||
    req.body?.deviceApiKey;

  return typeof providedKey === 'string' && providedKey === configuredKey;
}

// ================= API ROUTES =================

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'ACCI ALERT Central Monitoring API',
  });
});

/**
 * GET /api/status
 * Comprehensive system overview adhering to 3-state connection model:
 * 1. 'waiting': Before first real device heartbeat arrives
 * 2. 'connected': Valid authenticated heartbeat received within timeout
 * 3. 'disconnected': Heartbeats ceased beyond configurable timeout
 */
app.get('/api/status', async (req, res) => {
  try {
    const stats = getEventStats();
    const latestEvent = getEvents(1)[0] || null;
    const latestHb = getLatestHeartbeat() || null;

    // Configurable heartbeat timeout (default: 45s for 15s ESP32 heartbeat cycle)
    const timeoutSeconds = Math.max(
      15,
      parseInt((req.query.timeout as string) || process.env.HEARTBEAT_TIMEOUT_SECONDS || '45', 10)
    );

    const now = Date.now();
    let connectionState: 'waiting' | 'connected' | 'disconnected' = 'waiting';
    let elapsedSinceHeartbeatSeconds: number | null = null;
    let lastHeartbeatTime: string | null = null;

    if (!latestHb) {
      // Requirement 1 & 2: Before the first real device heartbeat, state is strictly "waiting"
      connectionState = 'waiting';
      elapsedSinceHeartbeatSeconds = null;
      lastHeartbeatTime = null;
    } else {
      lastHeartbeatTime = latestHb.timestamp;
      const hbTimeMs = new Date(latestHb.timestamp).getTime();
      // Guard against potential future clock skews
      elapsedSinceHeartbeatSeconds = Math.max(0, Math.floor((now - hbTimeMs) / 1000));

      if (elapsedSinceHeartbeatSeconds <= timeoutSeconds) {
        // Requirement 3: "Connected" only after receiving a valid heartbeat from real ESP32
        connectionState = 'connected';
      } else {
        // Requirement 4: "Disconnected" if heartbeats stop arriving beyond timeout
        connectionState = 'disconnected';
      }
    }

    const chatIds = getConfiguredChatIds();
    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'MY_TELEGRAM_BOT_TOKEN';

    res.json({
      connectionState,
      hardwareConnected: connectionState === 'connected',
      hasReceivedFirstHeartbeat: !!latestHb,
      heartbeatTimeoutSeconds: timeoutSeconds,
      elapsedSinceHeartbeatSeconds,
      lastHeartbeat: latestHb,
      lastHeartbeatTime,
      stats,
      latestEvent,
      deviceKeyConfigured: !!process.env.DEVICE_API_KEY,
      telegram: {
        configured: hasToken,
        chatIdsCount: chatIds.length,
        chatIds: chatIds.map((id) => `${id.slice(0, 3)}***${id.slice(-2)}`),
      },
      serverTime: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    res.status(500).json({ error: 'Failed to retrieve system status', details: errorMsg });
  }
});

/**
 * GET /api/telegram/status
 * Returns verified status from Telegram getMe without exposing the bot token
 */
app.get('/api/telegram/status', async (req, res) => {
  try {
    const status = await checkTelegramBotStatus();
    // Mask chat IDs in response
    const maskedChatIds = status.configuredChatIds.map((id) => {
      if (id.length <= 4) return id;
      return `${id.slice(0, 3)}****${id.slice(-2)}`;
    });

    res.json({
      ...status,
      configuredChatIds: maskedChatIds,
      rawChatIdsCount: status.configuredChatIds.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Telegram check error';
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * POST /api/telegram/test
 * Sends a real test notification to all configured Telegram channels
 */
app.post('/api/telegram/test', async (req, res) => {
  const clientIp = req.ip || 'local';
  if (!checkRateLimit(clientIp, 6, 60000)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute before sending another test.' });
  }

  try {
    const result = await sendAccidentAlert({
      eventType: 'system_test',
      timestamp: new Date().toISOString(),
      gpsValid: false,
      isSimulated: false,
    });

    if (result.status === 'skipped_no_token') {
      return res.status(400).json({
        success: false,
        error: 'Telegram Bot Token is not configured. Please set TELEGRAM_BOT_TOKEN in .env',
        result,
      });
    }

    res.json({
      success: result.deliveredCount > 0,
      deliveredCount: result.deliveredCount,
      totalRecipients: result.totalRecipients,
      status: result.status,
      details: result.details,
      message:
        result.deliveredCount === result.totalRecipients
          ? `All ${result.totalRecipients} emergency contacts received the test notification!`
          : result.deliveredCount > 0
          ? `Delivered to ${result.deliveredCount} of ${result.totalRecipients} contacts.`
          : 'Failed to dispatch to Telegram contacts. Check bot token and chat permissions.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to send test Telegram message';
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * GET /api/events
 * Returns event history with optional limit and query filters
 */
app.get('/api/events', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
    const events = getEvents(limit);
    res.json({ events, count: events.length });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database error';
    res.status(500).json({ error: 'Failed to retrieve event history', details: errorMsg });
  }
});

/**
 * GET /api/events/:id
 * Single event detail view
 */
app.get('/api/events/:id', (req, res) => {
  try {
    const event = getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Accident event not found' });
    }
    res.json({ event });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database error';
    res.status(500).json({ error: 'Failed to retrieve event details', details: errorMsg });
  }
});

/**
 * POST /api/accident
 * Ingest accident event from ESP32 hardware or Exhibition Demo Mode
 */
app.post('/api/accident', async (req, res) => {
  const clientIp = req.ip || 'local';
  if (!checkRateLimit(clientIp, 30, 60000)) {
    return res.status(429).json({ error: 'Rate limit exceeded.' });
  }

  const {
    eventType = 'automatic_collision', // 'automatic_collision' | 'manual_sos'
    latitude,
    longitude,
    gpsValid = false,
    gForce,
    sensorSummary,
    isSimulated = false,
    sendTelegram = false,
    notes = '',
  } = req.body;

  // Validation
  const validEventTypes = ['automatic_collision', 'manual_sos'];
  const sanitizedEventType = validEventTypes.includes(eventType)
    ? (eventType as 'automatic_collision' | 'manual_sos')
    : 'automatic_collision';

  const isReal = !isSimulated;

  // Strict Hardware Authentication for Real Events
  if (isReal) {
    const isAuthenticated = verifyDeviceAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({
        error:
          'Unauthorized: Missing or invalid x-device-key header. Unauthenticated events cannot be accepted as real hardware collisions.',
      });
    }
  }

  const eventId = `ACC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const timestamp = new Date().toISOString();

  const parsedLat = latitude !== undefined && latitude !== null && !isNaN(Number(latitude))
    ? Number(latitude)
    : null;
  const parsedLon = longitude !== undefined && longitude !== null && !isNaN(Number(longitude))
    ? Number(longitude)
    : null;
  const isGpsValid = Boolean(gpsValid && parsedLat !== null && parsedLon !== null);
  const parsedGForce = gForce !== undefined && !isNaN(Number(gForce)) ? Number(gForce) : null;

  let deliveryStatus: 'delivered' | 'partial' | 'failed' | 'skipped_demo' = 'skipped_demo';
  let deliveryDetailsJson = '';

  // Trigger real telegram dispatch if:
  // 1. It is a genuine authenticated hardware alert, OR
  // 2. It is a simulation with explicit sendTelegram permission toggled on by user
  if (isReal || sendTelegram) {
    try {
      const dispatchResult = await sendAccidentAlert({
        eventType: sanitizedEventType,
        timestamp,
        latitude: parsedLat,
        longitude: parsedLon,
        gpsValid: isGpsValid,
        gForce: parsedGForce,
        isSimulated: Boolean(isSimulated),
      });

      deliveryStatus = dispatchResult.status === 'skipped_no_token' ? 'failed' : dispatchResult.status;
      deliveryDetailsJson = JSON.stringify(dispatchResult.details);
    } catch (err: unknown) {
      deliveryStatus = 'failed';
      deliveryDetailsJson = JSON.stringify([
        {
          error: err instanceof Error ? err.message : 'Telegram notification dispatch error',
          timestamp,
        },
      ]);
    }
  } else {
    deliveryStatus = 'skipped_demo';
    deliveryDetailsJson = JSON.stringify([
      { note: 'Demonstration event: Live Telegram alert withheld by safety policy.', timestamp },
    ]);
  }

  const newEvent: AccidentEvent = {
    id: eventId,
    timestamp,
    event_type: sanitizedEventType,
    latitude: parsedLat,
    longitude: parsedLon,
    gps_valid: isGpsValid ? 1 : 0,
    g_force: parsedGForce,
    sensor_summary: typeof sensorSummary === 'object' ? JSON.stringify(sensorSummary) : (sensorSummary || null),
    delivery_status: deliveryStatus,
    delivery_details: deliveryDetailsJson,
    is_simulated: isSimulated ? 1 : 0,
    notes: notes || (isSimulated ? 'Generated in Exhibition Demonstration Mode' : 'ESP32 Hardware Incident'),
  };

  try {
    saveEvent(newEvent);
    res.status(201).json({
      success: true,
      message: isReal ? 'Accident event authenticated and recorded' : 'Demonstration event recorded',
      event: newEvent,
      telegramDispatched: deliveryStatus === 'delivered' || deliveryStatus === 'partial',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database write error';
    res.status(500).json({ error: 'Failed to record event to database', details: errorMsg });
  }
});

/**
 * POST /api/heartbeat
 * Receives periodic telemetry and heartbeat from ESP32
 */
app.post('/api/heartbeat', (req, res) => {
  const isAuthenticated = verifyDeviceAuth(req);
  if (!isAuthenticated) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid x-device-key header for device heartbeat.',
    });
  }

  const {
    deviceId = 'ESP32_ACCI_01',
    wifiStatus = 'connected',
    wifiSsid = 'Redmi 13',
    wifiRssi = -65,
    mpuStatus = 'ok',
    gpsStatus = 'searching',
    latitude = null,
    longitude = null,
    satellites = 0,
    uptimeSeconds = 0,
    freeHeap = 0,
  } = req.body;

  const now = Date.now();
  lastRealHeartbeatTime = now;
  lastHeartbeatData = {
    timestamp: new Date(now).toISOString(),
    deviceId,
    wifiStatus,
    wifiSsid,
    wifiRssi,
    mpuStatus,
    gpsStatus,
    latitude,
    longitude,
    satellites,
    uptimeSeconds,
    freeHeap,
  };

  try {
    saveHeartbeat(lastHeartbeatData);
    res.json({
      success: true,
      serverTime: new Date(now).toISOString(),
      message: 'Heartbeat registered',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Heartbeat error';
    res.status(500).json({ error: 'Failed to record heartbeat', details: errorMsg });
  }
});

/**
 * POST /api/heartbeat/reset
 * Diagnostic endpoint to clear historical heartbeats and return system to "Waiting for ESP32" state
 */
app.post('/api/heartbeat/reset', (req, res) => {
  try {
    clearHeartbeats();
    lastRealHeartbeatTime = null;
    lastHeartbeatData = null;
    res.json({
      success: true,
      message: 'Heartbeat history cleared. System returned to "Waiting for ESP32" state.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Reset error';
    res.status(500).json({ error: 'Failed to reset heartbeat state', details: errorMsg });
  }
});

// ================= FRONTEND / VITE SERVING =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ACCI ALERT] Emergency response server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ACCI ALERT] Failed to initialize server:', err);
  process.exit(1);
});
