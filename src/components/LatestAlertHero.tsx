import React from 'react';
import {
  AlertTriangle,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Clock,
  Navigation,
  Activity,
  Send,
  Sparkles,
  Info,
} from 'lucide-react';
import { AccidentEvent } from '../types.ts';

interface LatestAlertHeroProps {
  latestEvent: AccidentEvent | null;
  onViewDetails: (event: AccidentEvent) => void;
  onOpenDemo: () => void;
}

export const LatestAlertHero: React.FC<LatestAlertHeroProps> = ({
  latestEvent,
  onViewDetails,
  onOpenDemo,
}) => {
  if (!latestEvent) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-[#0c1220]/60 p-6 sm:p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
        </div>
        <h2 className="text-base font-semibold text-white mt-3">
          No Collision Incidents Detected
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          The ACCI ALERT monitoring system is active and monitoring telemetry. When the ESP32 MPU6050 exceeds the 25 m/s² threshold or the manual SOS button is pressed, live telemetry will register here.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={onOpenDemo}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Launch Simulation Demo</span>
          </button>
        </div>
      </div>
    );
  }

  const isSimulated = latestEvent.is_simulated === 1;
  const isAuto = latestEvent.event_type === 'automatic_collision';
  const hasValidGps = Boolean(latestEvent.gps_valid && latestEvent.latitude && latestEvent.longitude);
  const mapsUrl = hasValidGps
    ? `https://maps.google.com/?q=${latestEvent.latitude},${latestEvent.longitude}`
    : null;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 sm:p-6 transition-all ${
        isAuto
          ? 'border-rose-900/60 bg-gradient-to-br from-rose-950/40 via-[#0d1424] to-[#0a0f1d]'
          : 'border-purple-900/60 bg-gradient-to-br from-purple-950/40 via-[#0d1424] to-[#0a0f1d]'
      }`}
    >
      {/* Top Banner Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              isAuto
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Latest Registered Incident
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-mono text-slate-300">
                ID: {latestEvent.id}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
              {isAuto ? 'Automatic Collision Impact Detected' : 'Manual Emergency SOS Triggered'}
            </h2>
          </div>
        </div>

        {/* Real vs Simulated Indicator */}
        <div className="flex items-center gap-2">
          {isSimulated ? (
            <span className="px-2.5 py-1 text-[11px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-500/40 rounded-md">
              Simulated Exhibition Event
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[11px] font-semibold text-rose-300 bg-rose-950/80 border border-rose-500/40 rounded-md">
              Verified Hardware Alert
            </span>
          )}

          <button
            onClick={() => onViewDetails(latestEvent)}
            className="px-3 py-1 text-xs font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-md transition-colors"
          >
            View Payload
          </button>
        </div>
      </div>

      {/* Main Grid: Telemetry & Location */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Timestamp & Trigger */}
        <div className="rounded-lg bg-[#090e17]/80 border border-slate-800/80 p-3.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>Incident Timestamp</span>
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-100 font-mono tabular-nums">
            {new Date(latestEvent.timestamp).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
            <span>Detection:</span>
            <span className="text-slate-300 font-medium">
              {isAuto ? 'MPU6050 Accelerometer Peak' : 'GPIO 19 Emergency Switch'}
            </span>
          </div>
        </div>

        {/* Metric 2: G-Force & Sensor Reading */}
        <div className="rounded-lg bg-[#090e17]/80 border border-slate-800/80 p-3.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity className="h-4 w-4 text-slate-400" />
            <span>Impact Intensity</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-rose-400 tabular-nums">
              {latestEvent.g_force ? `${latestEvent.g_force.toFixed(1)} m/s²` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400">
              (Threshold: 25.0 m/s²)
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Status:{' '}
            <span className="text-emerald-400 font-medium">
              Countdown Completed (10s window expired)
            </span>
          </div>
        </div>

        {/* Metric 3: Telegram Alert Outcome */}
        <div className="rounded-lg bg-[#090e17]/80 border border-slate-800/80 p-3.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Send className="h-4 w-4 text-slate-400" />
            <span>Telegram Alert Dispatch</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-sm font-semibold font-mono ${
                latestEvent.delivery_status === 'delivered'
                  ? 'text-emerald-400'
                  : latestEvent.delivery_status === 'partial'
                  ? 'text-amber-400'
                  : latestEvent.delivery_status === 'skipped_demo'
                  ? 'text-slate-400'
                  : 'text-rose-400'
              }`}
            >
              {latestEvent.delivery_status === 'delivered'
                ? 'Delivered to All 3 Contacts'
                : latestEvent.delivery_status === 'partial'
                ? 'Partially Delivered'
                : latestEvent.delivery_status === 'skipped_demo'
                ? 'Demo Mode (Telegram Skipped)'
                : 'Delivery Failed'}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Recipients: 8202503146 · 7275581412 · 8312506925
          </div>
        </div>
      </div>

      {/* GPS Location Strip */}
      <div className="mt-4 rounded-lg bg-[#080d18] border border-slate-800/90 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-500/30">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">NEO-6M GPS Telemetry Location</div>
            {hasValidGps ? (
              <div className="text-sm font-mono text-slate-100 tabular-nums font-semibold flex flex-wrap items-center gap-3 mt-0.5">
                <span>Lat: {Number(latestEvent.latitude).toFixed(6)}°</span>
                <span className="text-slate-600">·</span>
                <span>Lon: {Number(latestEvent.longitude).toFixed(6)}°</span>
              </div>
            ) : (
              <div className="text-xs text-amber-400 mt-0.5">
                GPS Fix was unavailable during incident (Satellites acquiring)
              </div>
            )}
          </div>
        </div>

        {hasValidGps && mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
