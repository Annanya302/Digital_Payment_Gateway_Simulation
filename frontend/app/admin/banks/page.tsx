'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Zap,
  Clock,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';
import { Bank, BankHealthStatus } from '../../../lib/types';

export default function AdminBanksPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadBanks();
  }, [user]);

  const loadBanks = async () => {
    setIsLoading(true);
    try {
      const data = await api.getBanks();
      setBanks(data || []);
    } catch (err) {
      console.error('Failed to load banks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateHealth = async (bankCode: string, newStatus: BankHealthStatus) => {
    setUpdatingCode(bankCode);
    setFeedbackMsg(null);
    try {
      await api.updateBankHealth(bankCode, newStatus);
      setBanks((prev) =>
        prev.map((b) => (b.code === bankCode ? { ...b, health_status: newStatus } : b))
      );
      setFeedbackMsg({
        text: `Bank switch for ${bankCode} updated to ${newStatus}.`,
        type: 'success',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({
        text: err.message || `Failed to update status for ${bankCode}.`,
        type: 'error',
      });
    } finally {
      setUpdatingCode(null);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-600" />
            <span>Simulated Bank Network Switch Status</span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-time control plane for core banking switches (SBI, HDFC, ICICI, Axis Bank, PNB)
          </p>
        </div>

        <button
          onClick={() => loadBanks()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          <span>Refresh Switches</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Simulator Guidance Alert */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-950">
            Interactive Failure Testing (Requirement E: Bank Server Unavailable)
          </p>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            You can toggle any simulated bank switch to <strong>DOWN</strong> below. When a bank is DOWN, any customer transfer routed through that bank (either sender or receiver) will fail at the <em>Bank Routing</em> stage with an explicit <code>BANK_UNAVAILABLE</code> outcome. The atomic ledger ensures no balances are deducted, and an audit event is logged immediately.
          </p>
        </div>
      </div>

      {/* Bank Switch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            Querying bank gateway switches...
          </div>
        ) : (
          banks.map((bank) => {
            const isUpdating = updatingCode === bank.code;
            const isOnline = bank.health_status === 'ONLINE';
            const isDegraded = bank.health_status === 'DEGRADED';
            const isDown = bank.health_status === 'DOWN';

            return (
              <div
                key={bank.bank_id}
                className={`bg-white rounded-3xl border p-5 shadow-sm space-y-4 transition-all ${
                  isDown
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : isDegraded
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs ${
                        isDown
                          ? 'bg-rose-100 text-rose-700'
                          : isDegraded
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {bank.code.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{bank.name}</h3>
                      <p className="text-[11px] font-mono text-slate-400">
                        IFSC: {bank.ifsc_prefix}XXXX
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isOnline
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isDegraded
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isOnline && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    {isDegraded && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                    {isDown && <XCircle className="w-3 h-3 text-rose-600" />}
                    <span>{bank.health_status}</span>
                  </span>
                </div>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl text-xs border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      Switch Latency
                    </span>
                    <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isDown ? 'TIMEOUT' : `${bank.latency_ms} ms`}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      Switch Route
                    </span>
                    <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                      <span>{bank.code}-SWITCH-1</span>
                    </p>
                  </div>
                </div>

                {/* Interactive Status Switcher */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Force Switch State:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleUpdateHealth(bank.code, 'ONLINE')}
                      disabled={isUpdating || isOnline}
                      className={`py-1.5 text-center text-[10px] font-bold rounded-xl transition-all ${
                        isOnline
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      ONLINE
                    </button>
                    <button
                      onClick={() => handleUpdateHealth(bank.code, 'DEGRADED')}
                      disabled={isUpdating || isDegraded}
                      className={`py-1.5 text-center text-[10px] font-bold rounded-xl transition-all ${
                        isDegraded
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      DEGRADED
                    </button>
                    <button
                      onClick={() => handleUpdateHealth(bank.code, 'DOWN')}
                      disabled={isUpdating || isDown}
                      className={`py-1.5 text-center text-[10px] font-bold rounded-xl transition-all ${
                        isDown
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                      }`}
                    >
                      DOWN
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
