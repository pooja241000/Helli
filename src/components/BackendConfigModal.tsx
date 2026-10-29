import React, { useState } from 'react';
import {
  X,
  Server,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  ExternalLink,
} from 'lucide-react';
import { getApiBaseUrl, getCustomBackendUrl, setCustomBackendUrl, apiUrl } from '../utils/api.ts';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackendChanged: () => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  onBackendChanged,
}) => {
  const [urlInput, setUrlInput] = useState(getCustomBackendUrl() || '');
  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const currentEffectiveUrl = getApiBaseUrl() || '(Same-Origin / Unified Backend)';
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);

    const targetBase = urlInput.trim().replace(/\/+$/, '');
    const healthUrl = targetBase ? `${targetBase}/api/health` : '/api/health';

    try {
      const res = await fetch(healthUrl, { method: 'GET' });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setTestStatus({
          tested: true,
          success: true,
          message: `Connection successful! Server uptime: ${data.uptime}s (${data.service || 'ACCI ALERT API'})`,
        });
      } else {
        setTestStatus({
          tested: true,
          success: false,
          message: `Server reached but returned unexpected response: ${JSON.stringify(data)}`,
        });
      }
    } catch (err: unknown) {
      setTestStatus({
        tested: true,
        success: false,
        message: err instanceof Error ? err.message : 'Failed to connect. Check CORS and URL.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setCustomBackendUrl(urlInput);
    onBackendChanged();
    onClose();
  };

  const handleResetToDefault = () => {
    setCustomBackendUrl(null);
    setUrlInput('');
    onBackendChanged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d1424] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#090e17]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-400">
                  DEPLOYMENT CONFIGURATION
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-[11px] text-slate-400">Netlify & Vercel Bridge</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Backend Server Endpoint
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-3.5 rounded-lg bg-[#080d18] border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Active API Base URL:</span>
              <span className="font-mono text-emerald-400 font-semibold truncate max-w-[240px]">
                {currentEffectiveUrl}
              </span>
            </div>
            {envUrl && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">VITE_API_BASE_URL (Build Env):</span>
                <span className="font-mono text-sky-400 truncate max-w-[240px]">
                  {envUrl}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">
              Custom Backend Server URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="https://acci-alert-backend.onrender.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-[#080d18] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`h-3 w-3 ${isTesting ? 'animate-spin' : ''}`} />
                <span>Test</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              When hosting the frontend on Vercel or Netlify, enter the public URL of your deployed Node.js backend (e.g. Render, Railway, Fly.io, or ngrok tunnel). Leave blank for default same-origin routing.
            </p>
          </div>

          {/* Test connection output */}
          {testStatus && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                testStatus.success
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/30 text-xs text-sky-200/90 flex items-start gap-2">
            <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              <strong>Zero-Secret Architecture:</strong> This setting only configures the public REST API endpoint. Your Telegram bot token and device API keys remain exclusively inside the backend server environment.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#090e17] flex justify-between items-center">
          <button
            onClick={handleResetToDefault}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Reset to Default
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
