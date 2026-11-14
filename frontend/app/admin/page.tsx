'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  Activity,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  RotateCcw,
  Sliders,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      setError('Access Denied: Administrator role required.');
      setIsLoading(false);
      return;
    }

    loadAdminStats();
  }, [user]);

  const loadAdminStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminDashboard();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator metrics');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  if (user.role !== 'admin' || error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Protected Admin Area</h2>
        <p className="text-xs text-slate-500 mt-1">
          {error || 'This section requires system administrator permissions.'}
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Return to Customer Dashboard
        </Link>
      </div>
    );
  }

  if (isLoading || !stats) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading system metrics...</div>;
  }

  const { metrics, modeBreakdown, simulatorOutcomes, recentPayments } = stats;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
              System Administrator Portal
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Payment Gateway Operations</h1>
          <p className="text-xs text-amber-100 mt-0.5">
            Real-time telemetry, simulated banking switch audit, and platform transactions
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/users"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-colors"
          >
            User Directory
          </Link>
          <Link
            href="/admin/transactions"
            className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Monitor All Transactions
          </Link>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Volume</p>
          <p className="text-2xl font-black text-slate-900">
            ₹{metrics.totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">Processed Successfully</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Transactions</p>
          <p className="text-2xl font-black text-slate-900">{metrics.totalPayments}</p>
          <span className="text-[10px] text-indigo-600 font-bold">{metrics.totalTransactions} ledger entries</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Success Rate</p>
          <p className="text-2xl font-black text-emerald-600">{metrics.successRate}%</p>
          <span className="text-[10px] text-slate-500 font-medium">{metrics.successfulCount} successful</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-black text-slate-900">{metrics.totalUsers}</p>
          <span className="text-[10px] text-slate-500 font-medium">Registered Accounts</span>
        </div>
      </div>

      {/* Breakdown Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Modes */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Volume by Payment Mode</span>
          </h2>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>ApexPay Wallet</span>
                <span>{modeBreakdown.WALLET} txns</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{
                    width: `${metrics.totalPayments ? (modeBreakdown.WALLET / metrics.totalPayments) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Simulated UPI 2.0</span>
                <span>{modeBreakdown.UPI} txns</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{
                    width: `${metrics.totalPayments ? (modeBreakdown.UPI / metrics.totalPayments) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Simulated Cards (Visa / RuPay)</span>
                <span>{modeBreakdown.CARD} txns</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-600 h-2 rounded-full"
                  style={{
                    width: `${metrics.totalPayments ? (modeBreakdown.CARD / metrics.totalPayments) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Simulator Switch Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>Bank Switch Telemetry Outcomes</span>
          </h2>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xl font-black text-emerald-900">{simulatorOutcomes.APPROVED}</p>
              <p className="text-[10px] font-bold text-emerald-700 uppercase">Approved</p>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <XCircle className="w-5 h-5 text-rose-600 mx-auto mb-1" />
              <p className="text-xl font-black text-rose-900">{simulatorOutcomes.DECLINED}</p>
              <p className="text-[10px] font-bold text-rose-700 uppercase">Declined</p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <p className="text-xl font-black text-amber-900">{simulatorOutcomes.TIMEOUT}</p>
              <p className="text-[10px] font-bold text-amber-700 uppercase">Timeout</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            Switch outcomes record full failure reasons, auth response codes, and network latency timestamps.
          </p>
        </div>
      </div>

      {/* Recent Global Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Global Payments Stream</h2>
            <p className="text-xs text-slate-500">Live monitoring of system-wide transactions</p>
          </div>
          <Link
            href="/admin/transactions"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Open Transaction Monitor</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Reference</th>
                <th className="py-3 px-3">Sender</th>
                <th className="py-3 px-3">Receiver / Merchant</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Failure Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPayments.map((p: any) => (
                <tr key={p.payment_id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{p.reference_id}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">{p.senderName}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">{p.counterpartyName}</td>
                  <td className="py-3 px-3 uppercase text-[11px] font-semibold text-slate-500">{p.payment_mode}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">₹{p.amount.toFixed(2)}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                    {p.failure_reason || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
