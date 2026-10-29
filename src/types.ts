export type DeviceConnectionState = 'waiting' | 'connected' | 'disconnected';

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

export interface SystemStatus {
  // New refined 3-state connection model
  connectionState: DeviceConnectionState; // 'waiting' | 'connected' | 'disconnected'
  hardwareConnected: boolean; // true ONLY when state is 'connected'
  hasReceivedFirstHeartbeat: boolean; // false before first ever heartbeat arrives
  heartbeatTimeoutSeconds: number; // configurable timeout (e.g. 45 seconds)
  elapsedSinceHeartbeatSeconds: number | null;
  lastHeartbeatTime: string | null;
  lastHeartbeat: DeviceHeartbeat | null;
  stats: {
    totalEvents: number;
    realEventsCount: number;
    simulatedEventsCount: number;
    deliveredCount: number;
    automaticCollisionCount: number;
    manualSosCount: number;
  };
  latestEvent: AccidentEvent | null;
  deviceKeyConfigured: boolean;
  telegram: {
    configured: boolean;
    chatIdsCount: number;
    chatIds: string[];
  };
  serverTime: string;
}

export interface TelegramBotStatus {
  configured: boolean;
  connected: boolean;
  botUsername?: string;
  botFirstName?: string;
  configuredChatIds: string[];
  rawChatIdsCount: number;
  lastChecked: string;
  error?: string;
}

export interface TelegramRecipientResult {
  chatId: string;
  success: boolean;
  messageId?: number;
  error?: string;
  timestamp: string;
}

export interface TelegramTestResponse {
  success: boolean;
  deliveredCount: number;
  totalRecipients: number;
  status: 'delivered' | 'partial' | 'failed';
  details: TelegramRecipientResult[];
  message: string;
  error?: string;
}
