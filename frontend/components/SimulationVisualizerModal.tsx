'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Cpu,
  Landmark,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Activity,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { PaymentReceipt } from '../lib/types';

export interface SimulationStep {
  id: number;
  title: string;
  subtitle: string;
  detail: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'timeout';
}

interface SimulationVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt?: () => void;
  amount?: number;
  paymentMode?: string;
  recipient?: string;
  receipt?: PaymentReceipt | null;
  error?: string | null;
  isProcessing?: boolean;
}

export default function SimulationVisualizerModal({
  isOpen,
  onClose,
  onViewReceipt,
  amount = 1500,
  paymentMode = 'UPI',
  recipient = 'priya@example.com',
  receipt,
  error,
}: SimulationVisualizerModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [outcome, setOutcome] = useState<'PROCESSING' | 'APPROVED' | 'DECLINED' | 'TIMEOUT'>('PROCESSING');
  const [logs, setLogs] = useState<string[]>([]);
  const [latency, setLatency] = useState<number>(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setOutcome('PROCESSING');
      setLogs([]);
      setLatency(0);
      return;
    }

    let isMounted = true;
    const startTime = Date.now();

    const addLog = (msg: string) => {
      if (!isMounted) return;
      const now = new Date();
      const timeStr =
        now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      setLogs((prev) => [...prev, `[${timeStr}] ${msg}`]);
    };

    // Stage 1: Crypto Auth
    addLog(`INIT: Payment packet dispatched • ₹${amount.toLocaleString()} via ${paymentMode}`);
    addLog('AUTH: Verifying client PIN hash & locking idempotency token...');
    setCurrentStep(1);

    const timer1 = setTimeout(() => {
      if (!isMounted) return;
      addLog('AUTH: PIN signature verified. Idempotency lock confirmed.');
      addLog('SWITCH: Dispatching packet to Gateway Routing Engine...');
      setCurrentStep(2);
    }, 450);

    // Stage 2: Gateway Routing
    const timer2 = setTimeout(() => {
      if (!isMounted) return;
      addLog('ROUTING: Velocity limits clean. Risk score: 0.02.');
      addLog(`RAIL: Connecting to ${paymentMode === 'CARD' ? 'Visa / RuPay Network Rail' : 'NPCI UPI 2.0 Clearing Rail'}...`);
      setCurrentStep(3);
    }, 950);

    // Stage 3: Bank Switch Evaluation
    const timer3 = setTimeout(() => {
      if (!isMounted) return;

      if (error) {
        if (error.toLowerCase().includes('timeout')) {
          addLog('SWITCH: [TIMEOUT] Code 91 — Simulated bank rail SLA dropped.');
          addLog('RECOVERY: Gateway queued automatic reversal verification.');
          setCurrentStep(3);
          setOutcome('TIMEOUT');
          setLatency(Date.now() - startTime);
          return;
        } else {
          addLog(`SWITCH: [DECLINED] Code 51 — ${error}`);
          addLog('GATEWAY: Transaction declined by issuing bank simulator.');
          setCurrentStep(3);
          setOutcome('DECLINED');
          setLatency(Date.now() - startTime);
          return;
        }
      }

      addLog('SWITCH: [APPROVED] Code 00 — Auth granted by issuing bank.');
      addLog('LEDGER: Initiating atomic double-entry balance mutation...');
      setCurrentStep(4);

      // Stage 4: Atomic Settlement
      const timer4 = setTimeout(() => {
        if (!isMounted) return;
        addLog('LEDGER: Debit & credit wallets committed atomically (WAL synced).');
        addLog(`SETTLED: Ref: ${receipt?.referenceId || receipt?.paymentId || 'TXN-SIM-SETTLED'}`);
        setOutcome('APPROVED');
        setLatency(Date.now() - startTime);
      }, 550);

      return () => clearTimeout(timer4);
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen, receipt, error, amount, paymentMode]);

  if (!isOpen) return null;

  const steps: SimulationStep[] = [
    {
      id: 1,
      title: 'PIN & Crypto Auth',
      subtitle: 'Client Security',
      detail: 'Bcrypt salt & session token verification',
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : 'pending',
    },
    {
      id: 2,
      title: 'Gateway Routing',
      subtitle: 'ApexPay Switch',
      detail: 'Risk eval & protocol dispatch',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : 'pending',
    },
    {
      id: 3,
      title: 'Bank / UPI Switch',
      subtitle: 'Simulated Network Rail',
      detail: 'ISO-8583 MTI 0200/0210 Auth evaluation',
      status:
        outcome === 'DECLINED'
          ? 'failed'
          : outcome === 'TIMEOUT'
          ? 'timeout'
          : currentStep > 3
          ? 'completed'
          : currentStep === 3
          ? 'active'
          : 'pending',
    },
    {
      id: 4,
      title: 'Ledger Settlement',
      subtitle: 'Double-Entry Ledger',
      detail: 'Atomic WAL write & audit sync',
      status: outcome === 'APPROVED' ? 'completed' : currentStep === 4 ? 'active' : 'pending',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Payment Gateway Simulation</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE RAILS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                ₹{amount.toLocaleString()} • {paymentMode} • To: {recipient}
              </p>
            </div>
          </div>

          {outcome !== 'PROCESSING' && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Close [ESC]
            </button>
          )}
        </div>

        {/* Pipeline Visualizer Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 4 Pipeline Stages */}
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative z-10">
              {steps.map((step) => {
                const isActive = step.status === 'active';
                const isCompleted = step.status === 'completed';
                const isFailed = step.status === 'failed';
                const isTimedOut = step.status === 'timeout';

                return (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                      isActive
                        ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200 shadow-md shadow-indigo-100 scale-[1.02]'
                        : isCompleted
                        ? 'bg-emerald-50 border-emerald-300'
                        : isFailed
                        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                        : isTimedOut
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Step Number & Icon */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          STAGE 0{step.id}
                        </span>
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isActive
                              ? 'bg-indigo-600 text-white animate-pulse'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isFailed
                              ? 'bg-rose-600 text-white'
                              : isTimedOut
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : isFailed ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : isTimedOut ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : step.id === 1 ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : step.id === 2 ? (
                            <Cpu className="w-3.5 h-3.5" />
                          ) : step.id === 3 ? (
                            <Landmark className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{step.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{step.subtitle}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 text-[9px] text-slate-400 font-mono">
                      {isActive && (
                        <span className="text-indigo-600 font-semibold flex items-center gap-1 animate-pulse">
                          ● Running...
                        </span>
                      )}
                      {isCompleted && <span className="text-emerald-700 font-semibold">✓ Verified</span>}
                      {isFailed && <span className="text-rose-700 font-semibold">✗ Refused</span>}
                      {isTimedOut && <span className="text-amber-700 font-semibold">⏱ Timeout</span>}
                      {step.status === 'pending' && <span>Standby</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Switch Telemetry Log Console */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-[11px] shadow-inner">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-bold text-slate-300 uppercase">
                  Simulated Switch Telemetry
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-slate-400">Socket: Connected</span>
              </div>
            </div>

            <div className="h-32 overflow-y-auto telemetry-scroll space-y-1 text-slate-300 pr-1">
              {logs.map((log, index) => (
                <div key={index} className="leading-tight">
                  {log.includes('[APPROVED]') || log.includes('SETTLED') ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.includes('[TIMEOUT]') ? (
                    <span className="text-amber-400">{log}</span>
                  ) : log.includes('[DECLINED]') ? (
                    <span className="text-rose-400">{log}</span>
                  ) : log.includes('INIT') ? (
                    <span className="text-indigo-300">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Bottom Telemetry Bar */}
            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
              <span>Protocol: ISO-8583 / UPI-2.0</span>
              <span>Latency: {latency > 0 ? `${latency}ms` : 'Measuring...'}</span>
            </div>
          </div>

          {/* Outcome Status Banner with High-Impact Animation */}
          {outcome === 'APPROVED' && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border-2 border-emerald-400 shadow-xl shadow-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-5 animate-fade-in relative overflow-hidden">
              {/* Ambient radial glow */}
              <div className="absolute -right-12 -top-12 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center gap-4 relative z-10">
                {/* Double Sonar Pulse Animated Checkmark */}
                <div className="relative flex items-center justify-center shrink-0">
                  <span className="absolute inline-flex h-12 w-12 rounded-2xl bg-emerald-400 opacity-40 animate-ping"></span>
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transform hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-7 h-7 animate-pulse" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      Settled 00
                    </span>
                    <span className="text-xs font-mono text-emerald-800 font-semibold">
                      Atomic WAL Committed
                    </span>
                  </div>
                  <h4 className="text-base font-black text-emerald-950 mt-1">
                    Payment Simulation Successful!
                  </h4>
                  <p className="text-xs text-emerald-700">
                    ₹{amount.toLocaleString()} settled to <strong className="text-emerald-900">{recipient}</strong> • Code 00 (Approved)
                  </p>
                </div>
              </div>

              {onViewReceipt && (
                <button
                  type="button"
                  onClick={onViewReceipt}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center gap-2 shrink-0 group relative z-10"
                >
                  <span>View Official Receipt</span>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          )}

          {outcome === 'DECLINED' && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-red-50 to-rose-100/50 border-2 border-rose-400 shadow-xl shadow-rose-500/10 flex flex-col sm:flex-row items-center justify-between gap-5 animate-shake relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-36 h-36 bg-rose-400/20 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center gap-4 relative z-10">
                {/* Sonar Pulse Animated X mark */}
                <div className="relative flex items-center justify-center shrink-0">
                  <span className="absolute inline-flex h-12 w-12 rounded-2xl bg-rose-400 opacity-40 animate-ping"></span>
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
                    <XCircle className="w-7 h-7" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white">
                      Declined 51
                    </span>
                    <span className="text-xs font-mono text-rose-800 font-semibold">
                      Bank Rail Refused
                    </span>
                  </div>
                  <h4 className="text-base font-black text-rose-950 mt-1">
                    Simulated Bank Switch Rejected Payment
                  </h4>
                  <p className="text-xs text-rose-700">
                    {error || 'Code 51: Insufficient funds or bank rule violation. No money deducted.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-rose-500/20 shrink-0 relative z-10"
              >
                Dismiss & Retry
              </button>
            </div>
          )}

          {outcome === 'TIMEOUT' && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 border-2 border-amber-400 shadow-xl shadow-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-5 animate-fade-in relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center gap-4 relative z-10">
                {/* Pulsing Clock Icon */}
                <div className="relative flex items-center justify-center shrink-0">
                  <span className="absolute inline-flex h-12 w-12 rounded-2xl bg-amber-400 opacity-40 animate-ping"></span>
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Clock className="w-7 h-7 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-600 text-white">
                      Timeout 91
                    </span>
                    <span className="text-xs font-mono text-amber-800 font-semibold">
                      SLA Dropped (1200ms)
                    </span>
                  </div>
                  <h4 className="text-base font-black text-amber-950 mt-1">
                    Simulated Network Rail Timed Out
                  </h4>
                  <p className="text-xs text-amber-700">
                    The mock bank rail did not respond in time. Gateway queued for auto-reversal polling.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 shrink-0 relative z-10"
              >
                Acknowledge
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            ApexPay Sandbox • In-Memory Simulated Switch
          </span>
          {outcome !== 'PROCESSING' ? (
            <button onClick={onClose} className="text-indigo-600 font-semibold hover:underline">
              Done
            </button>
          ) : (
            <span className="font-mono text-indigo-600 font-semibold">Simulating packet traversal...</span>
          )}
        </div>
      </div>
    </div>
  );
}