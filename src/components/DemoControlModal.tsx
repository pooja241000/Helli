import React, { useState } from 'react';
import {
  X,
  Play,
  AlertTriangle,
  MapPin,
  Send,
  ShieldAlert,
  Info,
  Sparkles,
  Radio,
} from 'lucide-react';
import { apiUrl } from '../utils/api.ts';

interface DemoControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

const PRESET_LOCATIONS = [
  { name: 'School Science Fair Pavilion', lat: 12.971598, lon: 77.594562 },
  { name: 'City Arterial Highway (Accident Hotspot)', lat: 13.035842, lon: 77.597022 },
  { name: 'Suburban Intersection', lat: 12.935242, lon: 77.624462 },
  { name: 'Underground Tunnel (GPS Unavailable)', lat: null, lon: null },
];

export const DemoControlModal: React.FC<DemoControlModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const [eventType, setEventType] = useState<'automatic_collision' | 'manual_sos'>('automatic_collision');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customLat, setCustomLat] = useState('12.971598');
  const [customLon, setCustomLon] = useState('77.594562');
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [simGForce, setSimGForce] = useState(31.4);
  const [sendTelegram, setSendTelegram] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    let lat: number | null = null;
    let lon: number | null = null;
    let gpsValid = false;

    if (useCustomLocation) {
      if (customLat.trim() && customLon.trim()) {
        lat = parseFloat(customLat);
        lon = parseFloat(customLon);
        gpsValid = !isNaN(lat) && !isNaN(lon);
      }
    } else {
      const preset = PRESET_LOCATIONS[selectedPresetIndex];
      lat = preset.lat;
      lon = preset.lon;
      gpsValid = lat !== null && lon !== null;
    }

    try {
      const res = await fetch(apiUrl('/api/accident'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          latitude: lat,
          longitude: lon,
          gpsValid,
          gForce: eventType === 'automatic_collision' ? simGForce : null,
          sensorSummary: {
            simulation: true,
            simulatedBy: 'Exhibition Judge Demonstration',
            accelX: 2.1,
            accelY: -1.4,
            accelZ: simGForce,
          },
          isSimulated: true, // Clearly marks event as simulated in SQLite and API
          sendTelegram, // Safety toggle: real alerts only if explicitly opted-in
          notes: `Simulated exhibition event: ${eventType === 'automatic_collision' ? `Collision impact ${simGForce.toFixed(1)} m/s²` : 'Manual SOS triggered'}${sendTelegram ? ' (Live Telegram broadcast enabled)' : ' (Safe local demo)'}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage(
          sendTelegram
            ? 'Simulated collision registered and test Telegram alerts dispatched!'
            : 'Simulated collision registered in database. (Telegram alerts withheld by safety policy)'
        );
        onEventCreated();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(data.error || 'Failed to simulate accident event');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-rose-900/50 bg-[#0d1424] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#090e17]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-400">
                  EXHIBITION DEMONSTRATION MODE
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-[11px] text-slate-400">Judge Controls</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Simulate Collision Scenario
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitSimulation} className="p-5 overflow-y-auto space-y-4">
          {/* Transparency Disclaimer Notice */}
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div>
                <strong>Science Fair Rule Compliance:</strong> Simulated events are recorded as <code className="text-amber-300 font-mono">is_simulated = true</code>.
              </div>
              <div className="text-[11px] text-amber-300/80">
                Simulation mode is strictly decoupled from device telemetry: it will never generate fake heartbeats or alter ESP32 hardware connection state.
              </div>
            </div>
          </div>

          {/* Event Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Select Emergency Trigger Type:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEventType('automatic_collision')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  eventType === 'automatic_collision'
                    ? 'border-rose-500 bg-rose-950/40 text-white'
                    : 'border-slate-800 bg-[#090e17] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs text-rose-400">
                  Automatic Collision
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  MPU6050 Accelerometer spike
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEventType('manual_sos')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  eventType === 'manual_sos'
                    ? 'border-purple-500 bg-purple-950/40 text-white'
                    : 'border-slate-800 bg-[#090e17] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs text-purple-400">
                  Manual SOS Switch
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  GPIO 19 Emergency button
                </div>
              </button>
            </div>
          </div>

          {/* G-Force Slider (if automatic collision) */}
          {eventType === 'automatic_collision' && (
            <div className="space-y-1.5 p-3 rounded-lg bg-[#080d18] border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">
                  Simulated Impact Force:
                </span>
                <span className="font-mono text-rose-400 font-bold tabular-nums">
                  {simGForce.toFixed(1)} m/s²
                </span>
              </div>
              <input
                type="range"
                min="25.5"
                max="50.0"
                step="0.5"
                value={simGForce}
                onChange={(e) => setSimGForce(parseFloat(e.target.value))}
                className="w-full accent-rose-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Threshold: 25.0 m/s²</span>
                <span>Severe Crash: 50.0 m/s²</span>
              </div>
            </div>
          )}

          {/* Location Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              NEO-6M GPS Location Scenario:
            </label>
            <div className="space-y-1.5">
              {PRESET_LOCATIONS.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedPresetIndex(idx);
                    setUseCustomLocation(false);
                  }}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-colors ${
                    !useCustomLocation && selectedPresetIndex === idx
                      ? 'border-sky-500 bg-sky-950/40 text-white'
                      : 'border-slate-800 bg-[#080d18] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-medium">{loc.name}</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {loc.lat ? `${loc.lat.toFixed(4)}, ${loc.lon?.toFixed(4)}` : 'Fix Unavailable'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Telegram Notification Safety Option */}
          <div className="p-3 rounded-lg bg-[#080d18] border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="telegram-toggle" className="text-xs font-semibold text-slate-200 cursor-pointer">
                Send Real Telegram Notification to 3 Contacts
              </label>
              <input
                id="telegram-toggle"
                type="checkbox"
                checked={sendTelegram}
                onChange={(e) => setSendTelegram(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              When checked, this simulation will dispatch a verified test alert to the 3 configured Telegram emergency numbers. Keep unchecked for local-only demonstration.
            </p>
          </div>

          {/* Feedback Messages */}
          {statusMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
              {statusMessage}
            </div>
          )}
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isSubmitting ? 'Simulating...' : 'Dispatch Simulation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
