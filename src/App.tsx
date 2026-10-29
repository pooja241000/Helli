/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { StatusHeader } from './components/StatusHeader.tsx';
import { LatestAlertHero } from './components/LatestAlertHero.tsx';
import { EventsTable } from './components/EventsTable.tsx';
import { EventDetailModal } from './components/EventDetailModal.tsx';
import { DemoControlModal } from './components/DemoControlModal.tsx';
import { TelegramTestModal } from './components/TelegramTestModal.tsx';
import { HardwareDocsTab } from './components/HardwareDocsTab.tsx';
import { ScienceProjectDocsTab } from './components/ScienceProjectDocsTab.tsx';
import { MapVisualizer } from './components/MapVisualizer.tsx';
import { BackendConfigModal } from './components/BackendConfigModal.tsx';
import { apiUrl, getApiBaseUrl } from './utils/api.ts';
import {
  SystemStatus,
  TelegramBotStatus,
  AccidentEvent,
} from './types.ts';
import {
  AlertCircle,
  Play,
  Sparkles,
  ShieldAlert,
  Radio,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'hardware' | 'docs'>('overview');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<TelegramBotStatus | null>(null);
  const [events, setEvents] = useState<AccidentEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AccidentEvent | null>(null);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isTelegramTestOpen, setIsTelegramTestOpen] = useState(false);
  const [isBackendConfigOpen, setIsBackendConfigOpen] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch status from backend
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/status'));
      if (res.ok) {
        const data: SystemStatus = await res.json();
        setStatus(data);
        setFetchError(null);
      }
    } catch (err: unknown) {
      setFetchError('Unable to sync with ACCI ALERT central server.');
    }
  }, []);

  // Fetch Telegram status
  const fetchTelegramStatus = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/telegram/status'));
      if (res.ok) {
        const data: TelegramBotStatus = await res.json();
        setTelegramStatus(data);
      }
    } catch (err) {
      // Graceful fallback
    }
  }, []);

  // Fetch Events from backend SQLite
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoadingEvents(true);
      const res = await fetch(apiUrl('/api/events?limit=100'));
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      // Keep existing list
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Combined refresh
  const handleFullRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStatus(), fetchTelegramStatus(), fetchEvents()]);
    setIsRefreshing(false);
  }, [fetchStatus, fetchTelegramStatus, fetchEvents]);

  // Initial load and periodic polling every 6 seconds
  useEffect(() => {
    handleFullRefresh();
    const interval = setInterval(() => {
      fetchStatus();
      fetchEvents();
    }, 6000);
    return () => clearInterval(interval);
  }, [handleFullRefresh, fetchStatus, fetchEvents]);

  const latestEvent = status?.latestEvent || events[0] || null;

  return (
    <div className="min-h-screen bg-[#090e17] text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenTelegramTest={() => setIsTelegramTestOpen(true)}
        onOpenBackendConfig={() => setIsBackendConfigOpen(true)}
        connectionState={status?.connectionState || 'waiting'}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Error Notification if backend unreachable */}
        {fetchError && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{fetchError} Check that your backend server is running, or configure a remote backend URL.</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setIsBackendConfigOpen(true)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200"
              >
                Configure Backend URL
              </button>
              <button
                onClick={handleFullRefresh}
                className="px-2.5 py-1 text-[11px] font-semibold bg-rose-900 hover:bg-rose-800 rounded text-white"
              >
                Retry Sync
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Telemetry and Node Status Header */}
            <StatusHeader
              status={status}
              telegramStatus={telegramStatus}
              onRefresh={handleFullRefresh}
              isRefreshing={isRefreshing}
            />

            {/* Latest Collision Incident Banner */}
            <LatestAlertHero
              latestEvent={latestEvent}
              onViewDetails={(evt) => setSelectedEvent(evt)}
              onOpenDemo={() => setIsDemoOpen(true)}
            />

            {/* Two-Column Telemetry & Geospatial View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Live Geospatial Map */}
              <div className="lg:col-span-2">
                <MapVisualizer
                  latitude={latestEvent?.latitude ?? null}
                  longitude={latestEvent?.longitude ?? null}
                  gpsValid={Boolean(latestEvent?.gps_valid)}
                  eventTitle={
                    latestEvent
                      ? `Last Incident (${latestEvent.event_type})`
                      : 'Live GPS Navigation Standby'
                  }
                />
              </div>

              {/* Right Col: Science Fair Quick Controls & System Summary */}
              <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Exhibition Controls
                    </span>
                    <span className="text-[11px] text-amber-400 font-medium">
                      Demonstration
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Presenting to judges? Use the interactive simulation module to demonstrate how instantaneous collision forces trigger the 10-second grace window, capture GPS coordinates, and broadcast emergency alerts to Telegram.
                    </p>

                    <button
                      onClick={() => setIsDemoOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span>Simulate Collision Scenario</span>
                    </button>

                    <button
                      onClick={() => setIsTelegramTestOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-600/30 rounded-lg transition-colors"
                    >
                      <Radio className="h-3.5 w-3.5" />
                      <span>Test Telegram Broadcast</span>
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Emergency Contacts:</span>
                    <span className="font-mono text-slate-200">3 Configured</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Acceleration Threshold:</span>
                    <span className="font-mono text-slate-200">25.0 m/s²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancel Window:</span>
                    <span className="font-mono text-slate-200">10 Seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database Engine:</span>
                    <span className="font-mono text-slate-200">SQLite (WAL)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Incident Table Snippet */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Recent Incident Records
                </h3>
                <button
                  onClick={() => setActiveTab('events')}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                >
                  View All Records &rarr;
                </button>
              </div>
              <EventsTable
                events={events.slice(0, 10)}
                isLoading={isLoadingEvents}
                onSelectEvent={(evt) => setSelectedEvent(evt)}
                onOpenDemo={() => setIsDemoOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Full Incident History Table */}
        {activeTab === 'events' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <EventsTable
              events={events}
              isLoading={isLoadingEvents}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onOpenDemo={() => setIsDemoOpen(true)}
            />
          </div>
        )}

        {/* Tab 3: Hardware Pinout & Updated ESP32 Firmware */}
        {activeTab === 'hardware' && (
          <div className="animate-in fade-in duration-200">
            <HardwareDocsTab />
          </div>
        )}

        {/* Tab 4: School Science Fair Exhibition Guide */}
        {activeTab === 'docs' && (
          <div className="animate-in fade-in duration-200">
            <ScienceProjectDocsTab />
          </div>
        )}
      </main>

      {/* Global Modals */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <DemoControlModal
        isOpen={isDemoOpen}
        onClose={() => {
          setIsDemoOpen(false);
          handleFullRefresh();
        }}
        onEventCreated={handleFullRefresh}
      />

      <TelegramTestModal
        isOpen={isTelegramTestOpen}
        onClose={() => setIsTelegramTestOpen(false)}
        telegramStatus={telegramStatus}
        onRefreshStatus={fetchTelegramStatus}
      />

      <BackendConfigModal
        isOpen={isBackendConfigOpen}
        onClose={() => setIsBackendConfigOpen(false)}
        onBackendChanged={handleFullRefresh}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#070b13] py-4 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">ACCI ALERT</span>
            <span>·</span>
            <span>Vehicle Collision Detection & Emergency Response System</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>School Science Exhibition Project</span>
            <span>·</span>
            <span className="font-mono text-slate-300">ESP32 + MPU6050 + NEO-6M</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
