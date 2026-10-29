import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  MapPin,
  ExternalLink,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AccidentEvent } from '../types.ts';

interface EventsTableProps {
  events: AccidentEvent[];
  isLoading: boolean;
  onSelectEvent: (event: AccidentEvent) => void;
  onOpenDemo: () => void;
}

export const EventsTable: React.FC<EventsTableProps> = ({
  events,
  isLoading,
  onSelectEvent,
  onOpenDemo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'collision' | 'sos'>('all');
  const [filterSimulated, setFilterSimulated] = useState<'all' | 'real' | 'simulated'>('all');

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Type filter
      if (filterType === 'collision' && evt.event_type !== 'automatic_collision') return false;
      if (filterType === 'sos' && evt.event_type !== 'manual_sos') return false;

      // Simulated filter
      if (filterSimulated === 'real' && evt.is_simulated !== 0) return false;
      if (filterSimulated === 'simulated' && evt.is_simulated !== 1) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = evt.id.toLowerCase().includes(query);
        const matchesType = evt.event_type.toLowerCase().includes(query);
        const matchesNotes = evt.notes ? evt.notes.toLowerCase().includes(query) : false;
        const matchesCoords =
          evt.latitude?.toString().includes(query) || evt.longitude?.toString().includes(query);

        return matchesId || matchesType || matchesNotes || matchesCoords;
      }

      return true;
    });
  }, [events, filterType, filterSimulated, searchQuery]);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden flex flex-col">
      {/* Table Header & Interactive Filter Bar */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              Collision & Incident Log
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Persistent SQLite audit history of all detected vehicle emergencies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              Showing {filteredEvents.length} of {events.length} records
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Event ID, type, coordinates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080d18] border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/80"
            />
          </div>

          {/* Type Segmented Buttons */}
          <div className="flex items-center p-0.5 bg-[#080d18] rounded-lg border border-slate-700/80">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('collision')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'collision'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Collision
            </button>
            <button
              onClick={() => setFilterType('sos')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'sos'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Manual SOS
            </button>
          </div>

          {/* Mode Filter */}
          <div className="flex items-center p-0.5 bg-[#080d18] rounded-lg border border-slate-700/80">
            <button
              onClick={() => setFilterSimulated('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterSimulated === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Sources
            </button>
            <button
              onClick={() => setFilterSimulated('real')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterSimulated === 'real'
                  ? 'bg-slate-700 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hardware Only
            </button>
            <button
              onClick={() => setFilterSimulated('simulated')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterSimulated === 'simulated'
                  ? 'bg-slate-700 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simulated Only
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#090e17] text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Event ID</th>
              <th className="px-4 py-3 font-semibold">Date & Time</th>
              <th className="px-4 py-3 font-semibold">Trigger Type</th>
              <th className="px-4 py-3 font-semibold">GPS Coordinates</th>
              <th className="px-4 py-3 font-semibold">Telegram Dispatch</th>
              <th className="px-4 py-3 font-semibold">Origin Mode</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading incidents from SQLite database...</span>
                  </div>
                </td>
              </tr>
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="text-sm text-slate-300 font-medium">No incidents match current filter</p>
                    <p className="text-xs text-slate-500">
                      Generate an exhibition demonstration collision or trigger an alert on the ESP32 to populate records.
                    </p>
                    <button
                      onClick={onOpenDemo}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-500 transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Trigger Demo Crash</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEvents.map((event) => {
                const isAuto = event.event_type === 'automatic_collision';
                const hasGps = Boolean(event.gps_valid && event.latitude && event.longitude);

                return (
                  <tr
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Event ID */}
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-200">
                      {event.id}
                    </td>

                    {/* Date Time */}
                    <td className="px-4 py-3.5 text-slate-300 font-mono tabular-nums whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>

                    {/* Trigger Type */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            isAuto ? 'text-rose-400' : 'text-purple-400'
                          }`}
                        >
                          {isAuto ? 'Automatic Collision' : 'Manual SOS Button'}
                        </span>
                        {event.g_force && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            ({event.g_force.toFixed(1)} m/s²)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* GPS Coordinates */}
                    <td className="px-4 py-3.5 font-mono tabular-nums text-slate-300">
                      {hasGps ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                          <span>
                            {Number(event.latitude).toFixed(4)}, {Number(event.longitude).toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-400/90 text-[11px]">No GPS Fix</span>
                      )}
                    </td>

                    {/* Telegram Delivery Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`font-medium ${
                          event.delivery_status === 'delivered'
                            ? 'text-emerald-400'
                            : event.delivery_status === 'partial'
                            ? 'text-amber-400'
                            : event.delivery_status === 'skipped_demo'
                            ? 'text-slate-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {event.delivery_status === 'delivered'
                          ? 'Delivered (3/3)'
                          : event.delivery_status === 'partial'
                          ? 'Partial Dispatch'
                          : event.delivery_status === 'skipped_demo'
                          ? 'Demo Mode (Safe)'
                          : 'Failed Delivery'}
                      </span>
                    </td>

                    {/* Origin Mode */}
                    <td className="px-4 py-3.5">
                      {event.is_simulated === 1 ? (
                        <span className="text-amber-300 font-medium">
                          Simulated
                        </span>
                      ) : (
                        <span className="text-emerald-300 font-medium">
                          Hardware
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(event);
                        }}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded transition-colors"
                        title="View Full Payload & Telegram Log"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
