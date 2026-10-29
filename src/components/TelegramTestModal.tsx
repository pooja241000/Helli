import React, { useState } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { TelegramBotStatus, TelegramTestResponse } from '../types.ts';
import { apiUrl } from '../utils/api.ts';

interface TelegramTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  telegramStatus: TelegramBotStatus | null;
  onRefreshStatus: () => void;
}

export const TelegramTestModal: React.FC<TelegramTestModalProps> = ({
  isOpen,
  onClose,
  telegramStatus,
  onRefreshStatus,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<TelegramTestResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendTest = async () => {
    setIsSending(true);
    setTestResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch(apiUrl('/api/telegram/test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult(data);
      } else {
        setErrorMsg(data.error || 'Failed to dispatch test notification.');
        if (data.result) {
          setTestResult(data);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Network failure contacting server');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-sky-900/50 bg-[#0d1424] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#090e17]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-500/30">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-sky-400">
                  EMERGENCY BROADCAST GATEWAY
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-[11px] text-slate-400">Telegram Bot</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Test Telegram Notification
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Bot Connection Health Status */}
          <div className="p-3.5 rounded-lg bg-[#080d18] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Bot Connection State:</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  telegramStatus?.connected ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {telegramStatus?.connected ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Active (@{telegramStatus.botUsername || 'BotFather'})</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{telegramStatus?.error || 'Awaiting Valid Bot Token'}</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Target Contacts:</span>
              <span className="font-mono text-slate-300">
                8202503146 · 7275581412 · 8312506925
              </span>
            </div>
          </div>

          {/* Test Action Trigger */}
          <div className="space-y-2">
            <p className="text-xs text-slate-300">
              Triggering this test sends a real emergency handshake ping to each configured emergency chat ID through Telegram's official Bot API.
            </p>
            <button
              onClick={handleSendTest}
              disabled={isSending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className={`h-4 w-4 ${isSending ? 'animate-pulse' : ''}`} />
              <span>{isSending ? 'Transmitting to Telegram Servers...' : 'Send Live Handshake Test'}</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
              <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Test Results Output */}
          {testResult && (
            <div className="p-4 rounded-lg bg-[#080d18] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Broadcast Results:</span>
                <span
                  className={`font-mono font-semibold ${
                    testResult.status === 'delivered'
                      ? 'text-emerald-400'
                      : testResult.status === 'partial'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {testResult.deliveredCount} / {testResult.totalRecipients} Confirmed
                </span>
              </div>

              <p className="text-xs text-slate-300">{testResult.message}</p>

              {/* Per-contact breakdown */}
              <div className="divide-y divide-slate-800 border-t border-slate-800/80 pt-2 text-xs">
                {testResult.details?.map((rec, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {rec.success ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-rose-400" />
                      )}
                      <span className="font-mono text-slate-300">
                        Chat ID: {rec.chatId}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-mono ${
                        rec.success ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {rec.success ? `Msg #${rec.messageId}` : rec.error || 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#090e17] flex justify-between items-center">
          <button
            onClick={onRefreshStatus}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Recheck Bot Status</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
