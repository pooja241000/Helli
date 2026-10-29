import React, { useState } from 'react';
import {
  Cpu,
  Wifi,
  WifiOff,
  Activity,
  Compass,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Radio,
  RotateCcw,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { SystemStatus, TelegramBotStatus, DeviceConnectionState } from '../types.ts';
import { apiUrl } from '../utils/api.ts';

interface StatusHeaderProps {
  status: SystemStatus | null;
  telegramStatus: TelegramBotStatus | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({
  status,
  telegramStatus,
  onRefresh,
  isRefreshing,
}) => {
  const connectionState: DeviceConnectionState = status?.connectionState || 'waiting';
  const hb = status?.lastHeartbeat;
  const timeoutSeconds = status?.heartbeatTimeoutSeconds || 45;
  const elapsedSec = status?.elapsedSinceHeartbeatSeconds;
  const [isResetting, setIsResetting] = useState(false);

  // Format last heartbeat time accurately
  const formatHeartbeatTime = (isoString?: string | null) => {
    if (!isoString) {
      return 'None received yet (Waiting for ESP32)';
    }
    const date = new Date(isoString);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (elapsedSec !== null && elapsedSec !== undefined) {
      if (elapsedSec < 60) return `${timeStr} (${elapsedSec}s ago)`;
      const mins = Math.floor(elapsedSec / 60);
      return `${timeStr} (${mins}m ago)`;
    }
    return timeStr;
  };

  // Reset heartbeat history (returns to initial "Waiting for ESP32" state)
  const handleResetHeartbeat = async () => {
    if (!confirm('Reset heartbeat history? This returns the system to the initial "Waiting for ESP32" development state.')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch(apiUrl('/api/heartbeat/reset'), { method: 'POST' });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      // Ignore
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Top Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Emergency Command Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time telemetry and collision alert hub for vehicle safety monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
            <span>Server Sync:</span>
            <span className="text-slate-200 tabular-nums">
              {status?.serverTime
                ? new Date(status.serverTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Connecting...'}
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-md transition-colors disabled:opacity-50"
          >
            <Radio className={`h-3.5 w-3.5 text-rose-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Poll State'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Telemetry & Hardware Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: ESP32 Hardware Connection Status */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                IoT Microcontroller
              </span>
              <h2 className="text-base font-semibold text-white mt-0.5">
                ESP32 Hardware
              </h2>
            </div>
            <div
              className={`p-2 rounded-lg ${
                connectionState === 'connected'
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                  : connectionState === 'disconnected'
                  ? 'bg-rose-950/70 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
              }`}
            >
              <Cpu className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Connection State:</span>
              <span
                className={`font-semibold flex items-center gap-1.5 ${
                  connectionState === 'connected'
                    ? 'text-emerald-400'
                    : connectionState === 'disconnected'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {connectionState === 'connected' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Connected</span>
                  </>
                )}
                {connectionState === 'disconnected' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Disconnected</span>
                  </>
                )}
                {connectionState === 'waiting' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Waiting for ESP32</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Last Heartbeat:</span>
              <span className="font-mono text-slate-300 tabular-nums">
                {formatHeartbeatTime(status?.lastHeartbeatTime)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Heartbeat Timeout:</span>
              <span className="font-mono text-slate-300 tabular-nums">
                {timeoutSeconds}s (every 15s)
              </span>
            </div>

            {connectionState === 'connected' && hb && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-800/40">
                <span>Free RAM:</span>
                <span className="font-mono text-emerald-300 tabular-nums">
                  {hb.free_heap ? `${Math.round(hb.free_heap / 1024)} KB` : 'N/A'}
                </span>
              </div>
            )}

            {connectionState !== 'waiting' && (
              <div className="pt-1 flex justify-end">
                <button
                  onClick={handleResetHeartbeat}
                  disabled={isResetting}
                  className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                  title="Clear history and return to Waiting for ESP32 state"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  <span>Reset to Waiting State</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: ESP32 Hardware Wi-Fi Link (Isolated from Phone/Browser) */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Reported by ESP32 Node
              </span>
              <h2 className="text-base font-semibold text-white mt-0.5">
                ESP32 Wi-Fi Link
              </h2>
            </div>
            <div
              className={`p-2 rounded-lg ${
                connectionState === 'connected' && hb?.wifi_status === 'connected'
                  ? 'bg-cyan-950/70 text-cyan-400 border border-cyan-500/30'
                  : connectionState === 'disconnected'
                  ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800/70 text-slate-400 border border-slate-700/40'
              }`}
            >
              {connectionState === 'connected' && hb?.wifi_status === 'connected' ? (
                <Wifi className="h-5 w-5" />
              ) : (
                <WifiOff className="h-5 w-5" />
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Hardware AP Link:</span>
              <span className="font-medium text-slate-200">
                {connectionState === 'connected'
                  ? `${hb?.wifi_ssid || 'Redmi 13'} (2.4 GHz)`
                  : connectionState === 'disconnected'
                  ? `Last: ${hb?.wifi_ssid || 'Redmi 13'} (Offline)`
                  : 'Awaiting ESP32 report'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Reported Signal (RSSI):</span>
              <span className="font-mono text-slate-300 tabular-nums">
                {connectionState === 'connected' && hb?.wifi_rssi !== undefined
                  ? `${hb.wifi_rssi} dBm (Active)`
                  : connectionState === 'disconnected' && hb?.wifi_rssi !== undefined
                  ? `${hb.wifi_rssi} dBm (Last known)`
                  : 'Pending report'}
              </span>
            </div>

            <div className="text-[10px] text-slate-500 leading-tight pt-1 border-t border-slate-800/40">
              *Reflects the ESP32 chip's hotspot connection, distinct from your browser or phone network.
            </div>
          </div>
        </div>

        {/* Card 3: MPU6050 & NEO-6M GPS */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Sensory Array
              </span>
              <h2 className="text-base font-semibold text-white mt-0.5">
                MPU6050 & GPS
              </h2>
            </div>
            <div className="p-2 rounded-lg bg-indigo-950/70 text-indigo-400 border border-indigo-500/30">
              <Activity className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">MPU6050 Accelerometer:</span>
              <span
                className={`font-semibold ${
                  connectionState === 'connected'
                    ? hb?.mpu_status === 'ok'
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {connectionState === 'connected'
                  ? hb?.mpu_status === 'ok'
                    ? 'Armed (25.0 m/s²)'
                    : 'Sensor Error'
                  : connectionState === 'disconnected'
                  ? `Last: ${hb?.mpu_status || 'Offline'}`
                  : 'Pending report'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>NEO-6M GPS Fix:</span>
              <span
                className={`font-semibold ${
                  connectionState === 'connected' && hb?.gps_status === 'fix_acquired'
                    ? 'text-emerald-400'
                    : connectionState === 'connected'
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {connectionState === 'connected'
                  ? hb?.gps_status === 'fix_acquired'
                    ? `Locked (${hb.satellites ?? 0} sats)`
                    : 'Searching Sky'
                  : connectionState === 'disconnected'
                  ? `Last: ${hb?.gps_status || 'Unavailable'}`
                  : 'Pending report'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>I2C Bus Address:</span>
              <span className="font-mono text-slate-300">0x68 (MPU) · 0x27 (LCD)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Telegram Emergency Dispatch */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Dispatch Gateway
              </span>
              <h2 className="text-base font-semibold text-white mt-0.5">
                Telegram Service
              </h2>
            </div>
            <div
              className={`p-2 rounded-lg ${
                telegramStatus?.connected
                  ? 'bg-sky-950/70 text-sky-400 border border-sky-500/30'
                  : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
              }`}
            >
              <Send className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bot Service:</span>
              <span
                className={`font-semibold ${
                  telegramStatus?.connected
                    ? 'text-emerald-400'
                    : telegramStatus?.configured
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {telegramStatus?.connected
                  ? `@${telegramStatus.botUsername || 'Active'}`
                  : telegramStatus?.configured
                  ? 'Token Check Failed'
                  : 'Missing Token'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Recipients Configured:</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {telegramStatus?.rawChatIdsCount || status?.telegram?.chatIdsCount || 3} Channels
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Total Delivered Alerts:</span>
              <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                {status?.stats?.deliveredCount ?? 0} Dispatched
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Statistics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="p-3 rounded-lg border border-slate-800 bg-[#0b101c] flex flex-col">
          <span className="text-[11px] text-slate-400">Total Recorded</span>
          <span className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
            {status?.stats?.totalEvents ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">System Lifetime</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-[#0b101c] flex flex-col">
          <span className="text-[11px] text-slate-400">Real Hardware Alerts</span>
          <span className="text-lg font-bold text-rose-400 font-mono tabular-nums mt-0.5">
            {status?.stats?.realEventsCount ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Authenticated Incidents</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-[#0b101c] flex flex-col">
          <span className="text-[11px] text-slate-400">Exhibition Demos</span>
          <span className="text-lg font-bold text-amber-400 font-mono tabular-nums mt-0.5">
            {status?.stats?.simulatedEventsCount ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Simulation Trials</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-[#0b101c] flex flex-col">
          <span className="text-[11px] text-slate-400">Automatic Crashes</span>
          <span className="text-lg font-bold text-sky-400 font-mono tabular-nums mt-0.5">
            {status?.stats?.automaticCollisionCount ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">MPU6050 &gt; 25.0 m/s²</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-[#0b101c] flex flex-col">
          <span className="text-[11px] text-slate-400">Manual SOS Triggers</span>
          <span className="text-lg font-bold text-purple-400 font-mono tabular-nums mt-0.5">
            {status?.stats?.manualSosCount ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">GPIO 19 Emergency</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-[#0b101c] flex flex-col">
          <span className="text-[11px] text-slate-400">Dispatch Ratio</span>
          <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
            {status?.stats?.totalEvents && status.stats.totalEvents > 0
              ? `${Math.round((status.stats.deliveredCount / status.stats.totalEvents) * 100)}%`
              : '100%'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Success Metric</span>
        </div>
      </div>
    </div>
  );
};
