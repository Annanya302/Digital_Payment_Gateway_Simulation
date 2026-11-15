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
  CreditCard,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

type SimulationScenario = 'APPROVED_UPI' | 'APPROVED_CARD' | 'DECLINED' | 'TIMEOUT';

export default function LiveSimulationSandbox() {
  const [scenario, setScenario] = useState<SimulationScenario>('APPROVED_UPI');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'SUCCESS' | 'DECLINED' | 'TIMEOUT'>('IDLE');
  const [logs, setLogs] = useState<string[]>([
    '[STANDBY] ApexPay Bank/UPI Simulation Switch v2.4 online',
    '[READY] Click any test scenario below to simulate payment packet traversal',
  ]);
  const [latency, setLatency] = useState<number>(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [logs]);

  const runSimulation = (selectedScenario: SimulationScenario) => {
    if (isRunning) return;
    setScenario(selectedScenario);
    setIsRunning(true);
    setStatus('RUNNING');
    setActiveStep(1);
    setLatency(0);

    const startTime = Date.now();
    const mode = selectedScenario === 'APPROVED_CARD' ? 'CARD (VISA)' : 'UPI (NPCI)';
    const amount =
      selectedScenario === 'APPROVED_CARD'
        ? 2499
        : selectedScenario === 'DECLINED'
        ? 500.02
        : selectedScenario === 'TIMEOUT'
        ? 500.03
        : 750;

    const newLogs: string[] = [
      `[${new Date().toLocaleTimeString()}] ▶ INITIATE: Dispatching ₹${amount} simulation via ${mode}...`,
      `[${new Date().toLocaleTimeString()}] STAGE 1: Bcrypt salt & user PIN verified. Idempotency lock acquired.`,
    ];
    setLogs([...newLogs]);

    // Step 2: Gateway Routing
    setTimeout(() => {
      setActiveStep(2);
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] STAGE 2: ApexPay Switch evaluated Risk Score: 0.01. Routing to ${mode} rail.`,
      ]);
    }, 600);

    // Step 3: Bank Switch
    setTimeout(() => {
      setActiveStep(3);

      if (selectedScenario === 'DECLINED') {
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] STAGE 3: Issuing Bank Switch responded with RC=51 (DECLINED / INSUFFICIENT_FUNDS).`,
          `[${new Date().toLocaleTimeString()}] REJECT: Gateway halted transaction. No balance deducted.`,
        ]);
        setStatus('DECLINED');
        setIsRunning(false);
        setLatency(Date.now() - startTime);
        return;
      }

      if (selectedScenario === 'TIMEOUT') {
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] STAGE 3: Bank Switch did not respond within 1200ms window (RC=91 TIMEOUT).`,
          `[${new Date().toLocaleTimeString()}] WARNING: Transaction marked as TIMEOUT. Reversal queue alerted.`,
        ]);
        setStatus('TIMEOUT');
        setIsRunning(false);
        setLatency(Date.now() - startTime);
        return;
      }

      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] STAGE 3: NPCI / Bank Switch responded: RC=00 (AUTH_APPROVED).`,
      ]);

      // Step 4: Atomic Settlement
      setTimeout(() => {
        setActiveStep(4);
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] STAGE 4: Core Ledger executed atomic balance mutation (WAL synced).`,
          `[${new Date().toLocaleTimeString()}] COMPLETED: Settlement Ref TXN-SIM-${Math.floor(
            100000 + Math.random() * 900000
          )} generated.`,
        ]);
        setStatus('SUCCESS');
        setIsRunning(false);
        setLatency(Date.now() - startTime);
      }, 700);
    }, 1300);
  };

  const steps = [
    { num: 1, title: 'Validation & PIN', sub: 'Bcrypt Hash & Limits', icon: ShieldCheck },
    { num: 2, title: 'Gateway Router', sub: 'Risk Engine & Routing', icon: Cpu },
    { num: 3, title: 'Bank / UPI Switch', sub: 'ISO-8583 / NPCI Clearing', icon: Landmark },
    { num: 4, title: 'Atomic Settlement', sub: 'Double-Entry WAL Commit', icon: CheckCircle2 },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
      {/* Background ambient glow effect */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white">
                Live Gateway Simulation Visualizer
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                INTERACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Watch simulated payment packets traverse gateway routing, banking rails & atomic ledgers
            </p>
          </div>
        </div>

        {/* Latency badge */}
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-slate-400">Latency:</span>
          <span className="text-emerald-400 font-bold">{latency > 0 ? `${latency}ms` : 'Ready'}</span>
        </div>
      </div>

      {/* Visual Pipeline Nodes */}
      <div className="relative mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
          {steps.map((st) => {
            const Icon = st.icon;
            const isActive = isRunning && activeStep === st.num;
            const isCompleted = activeStep > st.num || (activeStep === 4 && status === 'SUCCESS');
            const isFailedAtThis = activeStep === st.num && status === 'DECLINED';
            const isTimeoutAtThis = activeStep === st.num && status === 'TIMEOUT';

            return (
              <div
                key={st.num}
                className={`p-4 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-400 shadow-lg shadow-indigo-500/20 scale-105'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : isFailedAtThis
                    ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/20 animate-shake'
                    : isTimeoutAtThis
                    ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800/40 border-slate-700/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      NODE 0{st.num}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-indigo-500 text-white animate-pulse shadow-md shadow-indigo-500/50'
                          : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isFailedAtThis
                          ? 'bg-rose-500 text-white'
                          : isTimeoutAtThis
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isFailedAtThis ? (
                        <XCircle className="w-4 h-4" />
                      ) : isTimeoutAtThis ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-white mb-0.5">{st.title}</h4>
                  <p className="text-[10px] text-slate-400">{st.sub}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/50 text-[10px] font-mono">
                  {isActive && (
                    <span className="text-indigo-400 font-semibold animate-pulse flex items-center gap-1">
                      ● Processing...
                    </span>
                  )}
                  {isCompleted && <span className="text-emerald-400 font-semibold">✓ Verified</span>}
                  {isFailedAtThis && <span className="text-rose-400 font-semibold">✗ Refused (RC 51)</span>}
                  {isTimeoutAtThis && <span className="text-amber-400 font-semibold">⏱ Timeout (RC 91)</span>}
                  {!isActive && !isCompleted && !isFailedAtThis && !isTimeoutAtThis && (
                    <span className="text-slate-500">Standby</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scenario Trigger Buttons */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
          Select Simulation Scenario:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => runSimulation('APPROVED_UPI')}
            disabled={isRunning}
            className={`p-3 rounded-2xl border text-left transition-all ${
              scenario === 'APPROVED_UPI' && isRunning
                ? 'bg-emerald-600/30 border-emerald-400 ring-2 ring-emerald-500/40'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">UPI Pay ₹750</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Simulate NPCI 00 Auth</p>
          </button>

          <button
            type="button"
            onClick={() => runSimulation('APPROVED_CARD')}
            disabled={isRunning}
            className={`p-3 rounded-2xl border text-left transition-all ${
              scenario === 'APPROVED_CARD' && isRunning
                ? 'bg-indigo-600/30 border-indigo-400 ring-2 ring-indigo-500/40'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Card Pay ₹2,499</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Simulate VISA Rail</p>
          </button>

          <button
            type="button"
            onClick={() => runSimulation('DECLINED')}
            disabled={isRunning}
            className={`p-3 rounded-2xl border text-left transition-all ${
              scenario === 'DECLINED' && isRunning
                ? 'bg-rose-600/30 border-rose-400 ring-2 ring-rose-500/40'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-white">Force Decline</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Bank RC 51 Reject</p>
          </button>

          <button
            type="button"
            onClick={() => runSimulation('TIMEOUT')}
            disabled={isRunning}
            className={`p-3 rounded-2xl border text-left transition-all ${
              scenario === 'TIMEOUT' && isRunning
                ? 'bg-amber-600/30 border-amber-400 ring-2 ring-amber-500/40'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Force Timeout</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Simulate SLA Drop</p>
          </button>
        </div>
      </div>

      {/* Outcome High-Impact Banner */}
      {status === 'SUCCESS' && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="absolute inline-flex h-10 w-10 rounded-full bg-emerald-400 opacity-50 animate-ping"></span>
              <div className="relative w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-300">
                Payment Simulation Settled (Code 00)
              </h4>
              <p className="text-xs text-emerald-200/80">
                Transaction authorized by issuing switch • Wallets updated atomically
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'DECLINED' && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-400 flex items-center justify-between gap-4 animate-shake">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="absolute inline-flex h-10 w-10 rounded-full bg-rose-400 opacity-50 animate-ping"></span>
              <div className="relative w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-300">
                Bank Switch Rejected Payment (Code 51)
              </h4>
              <p className="text-xs text-rose-200/80">
                Simulated response: Insufficient balance or card rail blocked
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'TIMEOUT' && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="absolute inline-flex h-10 w-10 rounded-full bg-amber-400 opacity-50 animate-ping"></span>
              <div className="relative w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                Switch Timeout Warning (Code 91)
              </h4>
              <p className="text-xs text-amber-200/80">
                Bank switch did not respond within 1200ms • Auto-reversal scheduled
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Telemetry Terminal Logs */}
      <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-4 font-mono text-[11px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-slate-400 text-[10px]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold text-slate-300">ISO-8583 PACKET INSPECTOR & SWITCH LOGS</span>
          </div>
          <span className="text-slate-500">Live Telemetry</span>
        </div>

        <div
          ref={terminalEndRef}
          className="h-28 overflow-y-auto telemetry-scroll space-y-1 text-slate-300 pr-1"
        >
          {logs.map((log, index) => (
            <div key={index} className="leading-relaxed">
              {log.includes('COMPLETED') || log.includes('AUTH_APPROVED') ? (
                <span className="text-emerald-400 font-semibold">{log}</span>
              ) : log.includes('DECLINED') || log.includes('REJECT') ? (
                <span className="text-rose-400 font-semibold">{log}</span>
              ) : log.includes('TIMEOUT') || log.includes('WARNING') ? (
                <span className="text-amber-400 font-semibold">{log}</span>
              ) : log.includes('▶ INITIATE') ? (
                <span className="text-indigo-300 font-semibold">{log}</span>
              ) : (
                <span>{log}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}