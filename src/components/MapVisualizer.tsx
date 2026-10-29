import React, { useState } from 'react';
import {
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Compass,
  Navigation,
  Layers,
} from 'lucide-react';

interface MapVisualizerProps {
  latitude: number | null;
  longitude: number | null;
  gpsValid: boolean;
  eventTitle?: string;
}

export const MapVisualizer: React.FC<MapVisualizerProps> = ({
  latitude,
  longitude,
  gpsValid,
  eventTitle = 'Vehicle Collision Coordinates',
}) => {
  const [copied, setCopied] = useState(false);

  const hasCoords = gpsValid && latitude !== null && longitude !== null;
  const latStr = latitude !== null ? Number(latitude).toFixed(6) : 'N/A';
  const lonStr = longitude !== null ? Number(longitude).toFixed(6) : 'N/A';

  const googleMapsUrl = hasCoords
    ? `https://maps.google.com/?q=${latitude},${longitude}`
    : '#';

  const embedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : null;

  const copyToClipboard = () => {
    if (!hasCoords) return;
    navigator.clipboard.writeText(`${latStr}, ${lonStr}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-white">
            Geospatial Telemetry & Mapping
          </h2>
        </div>

        {hasCoords && (
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
              title="Copy GPS coordinates"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy Lat/Lon'}</span>
            </button>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors"
            >
              <span>Google Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Map Content Viewport */}
      <div className="relative w-full h-72 sm:h-80 bg-slate-950 flex items-center justify-center overflow-hidden">
        {hasCoords && embedUrl ? (
          <iframe
            title="Accident Location Map"
            src={embedUrl}
            className="w-full h-full border-0 filter contrast-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-center p-6 space-y-2">
            <Compass className="h-10 w-10 text-slate-600 mx-auto animate-pulse" />
            <h4 className="text-sm font-medium text-slate-300">
              No Satellite Fix Acquired
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              The NEO-6M GPS module is either indoors, synchronizing with satellites, or no active coordinates were logged for this record.
            </p>
          </div>
        )}

        {/* Floating Coordinates Chip */}
        {hasCoords && (
          <div className="absolute bottom-3 left-3 bg-[#090e17]/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{latStr}, {lonStr}</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#0a0f1d] border-t border-slate-800/70 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span>Hardware: NEO-6M Serial UART (GPIO 16 RX / GPIO 17 TX)</span>
        <span className="font-mono text-slate-300">NMEA 0183 standard · 9600 baud</span>
      </div>
    </div>
  );
};
