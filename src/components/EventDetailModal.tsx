import React from 'react';
import {
  X,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Clock,
  Activity,
  Send,
  CheckCircle2,
  XCircle,
  Copy,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { AccidentEvent } from '../types.ts';

interface EventDetailModalProps {
  event: AccidentEvent | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  const isSimulated = event.is_simulated === 1;
  const isAuto = event.event_type === 'automatic_collision';
  const hasGps = Boolean(event.gps_valid && event.latitude && event.longitude);
  const mapsUrl = hasGps
    ? `https://maps.google.com/?q=${event.latitude},${event.longitude}`
    : null;

  let deliveryDetails: any[] = [];
  try {
    if (event.delivery_details) {
      deliveryDetails = JSON.parse(event.delivery_details);
    }
  } catch (e) {
    deliveryDetails = [{ note: event.delivery_details }];
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0d1424] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#090e17]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isAuto
                  ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                  : 'bg-purple-950 text-purple-400 border border-purple-500/40'
              }`}
            >
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">
                  {event.id}
                </span>
                <span className="text-slate-600">·</span>
                <span
                  className={`text-xs font-semibold ${
                    isSimulated ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {isSimulated ? 'Exhibition Simulation' : 'Verified ESP32 Hardware'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                {isAuto ? 'Automatic Collision Event' : 'Manual SOS Emergency'}
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Key Facts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#080d18] border border-slate-800/80">
              <span className="text-[11px] text-slate-400">Recorded Timestamp</span>
              <p className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#080d18] border border-slate-800/80">
              <span className="text-[11px] text-slate-400">Impact G-Force</span>
              <p className="text-sm font-semibold text-rose-400 font-mono tabular-nums mt-0.5">
                {event.g_force ? `${event.g_force.toFixed(2)} m/s²` : 'N/A (Manual SOS)'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#080d18] border border-slate-800/80">
              <span className="text-[11px] text-slate-400">NEO-6M GPS Status</span>
              <p
                className={`text-sm font-semibold mt-0.5 ${
                  hasGps ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {hasGps ? 'Fix Acquired & Valid' : 'Fix Unavailable'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#080d18] border border-slate-800/80">
              <span className="text-[11px] text-slate-400">Delivery State</span>
              <p
                className={`text-sm font-semibold font-mono mt-0.5 ${
                  event.delivery_status === 'delivered'
                    ? 'text-emerald-400'
                    : event.delivery_status === 'partial'
                    ? 'text-amber-400'
                    : event.delivery_status === 'skipped_demo'
                    ? 'text-slate-400'
                    : 'text-rose-400'
                }`}
              >
                {event.delivery_status}
              </p>
            </div>
          </div>

          {/* GPS Location & Map Box */}
          <div className="p-4 rounded-lg bg-[#080d18] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Geographic Coordinates
              </span>
              {hasGps && mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {hasGps ? (
              <div className="font-mono text-xs text-slate-200 tabular-nums">
                <span className="text-slate-400">Latitude:</span> {event.latitude} ·{' '}
                <span className="text-slate-400">Longitude:</span> {event.longitude}
              </div>
            ) : (
              <p className="text-xs text-amber-400/90">
                GPS satellite fix was not locked at the instant of impact.
              </p>
            )}
          </div>

          {/* Telegram Dispatch Audit Log */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300">
              Telegram Recipient Dispatch Audit
            </span>
            <div className="divide-y divide-slate-800 rounded-lg bg-[#080d18] border border-slate-800 p-2 text-xs">
              {Array.isArray(deliveryDetails) && deliveryDetails.length > 0 ? (
                deliveryDetails.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      {item.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      )}
                      <span className="font-mono text-slate-300">
                        {item.chatId ? `Chat ID: ${item.chatId}` : item.note || 'Telegram Dispatch'}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-mono ${
                        item.success ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {item.success
                        ? `Message ID: ${item.messageId}`
                        : item.error || item.note || 'Skipped'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-2 text-slate-500 text-center">
                  No recipient logs available for this event.
                </div>
              )}
            </div>
          </div>

          {/* Raw JSON Payload */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 font-mono">
              Raw Record Payload
            </span>
            <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto">
              {JSON.stringify(event, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#090e17] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
