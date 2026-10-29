import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  Send,
  Cpu,
  History,
  LayoutDashboard,
  Menu,
  X,
  FileCode,
  Sparkles,
  Server,
} from 'lucide-react';

import { DeviceConnectionState } from '../types.ts';

interface NavbarProps {
  activeTab: 'overview' | 'events' | 'hardware' | 'docs';
  setActiveTab: (tab: 'overview' | 'events' | 'hardware' | 'docs') => void;
  onOpenDemo: () => void;
  onOpenTelegramTest: () => void;
  onOpenBackendConfig: () => void;
  connectionState: DeviceConnectionState;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDemo,
  onOpenTelegramTest,
  onOpenBackendConfig,
  connectionState,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'events', label: 'Incident History', icon: History },
    { id: 'hardware', label: 'Hardware & Pins', icon: Cpu },
    { id: 'docs', label: 'Science Project Guide', icon: FileCode },
  ] as const;

  const getConnectionBadge = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ESP32 Connected</span>
          </span>
        );
      case 'disconnected':
        return (
          <span className="text-rose-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>ESP32 Disconnected</span>
          </span>
        );
      case 'waiting':
      default:
        return (
          <span className="text-amber-400/90 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Waiting for ESP32</span>
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090e17]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-400 shadow-inner">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                ACCI ALERT
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="hidden sm:inline-block text-xs font-medium text-slate-400 whitespace-nowrap">
                IoT Collision Response
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>School Exhibition System</span>
              <span className="text-slate-600">·</span>
              {getConnectionBadge()}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800/90 text-white border border-slate-700/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenBackendConfig}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap"
            title="Configure Backend Server Endpoint (for Netlify, Vercel, or custom hosting)"
          >
            <Server className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden md:inline">Backend API</span>
          </button>

          <button
            onClick={onOpenTelegramTest}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 bg-sky-950/60 border border-sky-600/30 rounded-lg hover:bg-sky-900/40 hover:border-sky-500/50 transition-colors whitespace-nowrap"
            title="Test real-time alert dispatch to designated emergency chat channels"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Test Telegram</span>
          </button>

          <button
            onClick={onOpenDemo}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg shadow-sm transition-colors whitespace-nowrap border border-rose-400/30"
            title="Open Science Fair Exhibition Simulation Mode"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Simulate Crash</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={onOpenDemo}
            className="p-1.5 text-white bg-rose-600 rounded-lg hover:bg-rose-500"
            title="Demo Crash"
          >
            <Play className="h-4 w-4 fill-current" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#090e17] px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800">
            <button
              onClick={() => {
                onOpenTelegramTest();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-sky-300 bg-sky-950/70 border border-sky-600/30 rounded-lg"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Test Telegram</span>
            </button>
            <button
              onClick={() => {
                onOpenDemo();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Simulate Crash</span>
            </button>
          </div>

          <button
            onClick={() => {
              onOpenBackendConfig();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-850 border border-slate-800 rounded-lg hover:bg-slate-800"
          >
            <Server className="h-3.5 w-3.5 text-indigo-400" />
            <span>Configure Backend API Endpoint</span>
          </button>

          <div className="flex flex-col gap-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
