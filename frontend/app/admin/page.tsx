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
  Building2,
  FileText,
  Radio,
  Server,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

export default function AdminDashboardPage() {
  const { user, socket } = useAuth();
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

  // Real-time socket listener for admin payment stream
  useEffect(() => {
    if (socket && user?.role === 'admin') {
      const handleNewPayment = () => {
        loadAdminStats();
      };
      socket.on('admin_payment_stream', handleNewPayment);
      socket.on('audit_log_created', handleNewPayment);
      socket.on('bank_health_updated', handleNewPayment);

      return () => {
        socket.off('admin_payment_stream', handleNewPayment);
        socket.off('audit_log_created', handleNewPayment);
        socket.off('bank_health_updated', handleNewPayment);
      };
    }
  }, [socket, user]);

  const loadAdminStats = async () => {
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
        <h2 className="text-xl font-bold text-slate-900">Protected Administrator Center</h2>
        <p className="text-xs text-slate-500 mt-1">
          {error || 'This section is strictly restricted to administrator telemetry.'}
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Return to Customer Portal
        </Link>
      </div>
    );
  }

  if (isLoading || !stats) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading system metrics and telemetry...</div>;
  }

  const {
    metrics,
    modeBreakdown,
    bankStats,
    failureReasons,
    hourlyActivity,
    dailyVolume,
    userRegistrationTrends,
    recentPayments,
  } = stats;

  const totalPaymentsForModes =
    (modeBreakdown.WALLET || 0) +
    (modeBreakdown.UPI || 0) +
    (modeBreakdown.CARD || 0) +
    (modeBreakdown.NET_BANKING || 0) || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Monitoring Only • Zero Personal Assets</span>
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">PaySim Operations Control Center</h1>
          <p className="text-xs text-amber-100 mt-0.5">
            Real-time multi-bank switch telemetry, double-entry audit, and live transaction processing stream
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/audit-logs"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </Link>
          <Link
            href="/admin/banks"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Bank Switches</span>
          </Link>
          <Link
            href="/admin/transactions"
            className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Monitor Ledger
          </Link>
        </div>
      </div>

      {/* Main Metric Cards Grid (Requirement F) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Volume</p>
          <p className="text-2xl font-black text-slate-900">
            ₹{metrics.totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">Cleared & Settled</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Transactions</p>
          <p className="text-2xl font-black text-slate-900">{metrics.totalPayments}</p>
          <span className="text-[10px] text-indigo-600 font-bold">{metrics.totalTransactions} ledger records</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Success Rate</p>
          <p className="text-2xl font-black text-emerald-600">{metrics.successRate}%</p>
          <span className="text-[10px] text-slate-500 font-medium">
            {metrics.successfulCount} success • {metrics.failedCount} failed
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bank Accounts & Users</p>
          <p className="text-2xl font-black text-slate-900">{metrics.totalBankAccounts}</p>
          <span className="text-[10px] text-sky-600 font-bold">{metrics.totalUsers} registered users</span>
        </div>
      </div>

      {/* Bank-Wise Statistics & Switch Health (Requirement C & F) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Simulated Bank Rails Telemetry</h2>
          </div>
          <Link
            href="/admin/banks"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Manage Switch Outages</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Bank Name</th>
                <th className="py-2.5 px-3">Switch Status</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Accounts</th>
                <th className="py-2.5 px-3">Transactions</th>
                <th className="py-2.5 px-3">Settled Volume</th>
                <th className="py-2.5 px-3">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bankStats?.map((b: any) => (
                <tr key={b.code} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span>{b.name} ({b.code})</span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.healthStatus === 'ONLINE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : b.healthStatus === 'DEGRADED'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {b.healthStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{b.latencyMs}ms</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{b.totalAccounts}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">{b.totalTransactions}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    ₹{b.volume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${b.successRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-emerald-700">{b.successRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Breakdown Grid (Requirement H) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Payment Methods Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Payment Method Distribution</span>
          </h2>

          <div className="space-y-3 pt-2 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Simulated Wallet</span>
                <span>{modeBreakdown.WALLET} txns ({Math.round((modeBreakdown.WALLET / totalPaymentsForModes) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${(modeBreakdown.WALLET / totalPaymentsForModes) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Net Banking (Direct CBS)</span>
                <span>{modeBreakdown.NET_BANKING || 0} txns ({Math.round(((modeBreakdown.NET_BANKING || 0) / totalPaymentsForModes) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-sky-600 h-2 rounded-full"
                  style={{ width: `${((modeBreakdown.NET_BANKING || 0) / totalPaymentsForModes) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Simulated UPI 2.0</span>
                <span>{modeBreakdown.UPI} txns ({Math.round((modeBreakdown.UPI / totalPaymentsForModes) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${(modeBreakdown.UPI / totalPaymentsForModes) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Simulated Cards (Visa / RuPay)</span>
                <span>{modeBreakdown.CARD} txns ({Math.round((modeBreakdown.CARD / totalPaymentsForModes) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-amber-600 h-2 rounded-full"
                  style={{ width: `${(modeBreakdown.CARD / totalPaymentsForModes) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Failure Reason Analytics */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Failure Reason Analytics</span>
          </h2>

          <div className="space-y-3 pt-2">
            {failureReasons && failureReasons.length > 0 ? (
              failureReasons.slice(0, 4).map((f: any) => (
                <div key={f.reason} className="text-xs">
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span className="truncate max-w-[200px]" title={f.reason}>{f.reason}</span>
                    <span className="font-bold text-rose-600">{f.count} ({f.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-rose-500 h-2 rounded-full"
                      style={{ width: `${f.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No failure reasons recorded yet</p>
            )}
          </div>
        </div>

        {/* Hourly Transaction Activity (24H Bar Visualization) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Hourly Activity (Last 24h)</span>
          </h2>

          <div className="h-28 flex items-end gap-1 pt-4">
            {hourlyActivity?.map((h: any, idx: number) => {
              const maxCount = Math.max(...hourlyActivity.map((x: any) => x.count), 1);
              const heightPct = Math.max((h.count / maxCount) * 100, 6);
              return (
                <div
                  key={idx}
                  className="flex-1 bg-indigo-100 hover:bg-indigo-600 transition-colors rounded-t relative group"
                  style={{ height: `${heightPct}%` }}
                  title={`${h.hour}: ${h.count} transactions (₹${h.volume})`}
                >
                  <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                    {h.hour}: {h.count} txns
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>24h ago</span>
            <span>12h ago</span>
            <span>Now</span>
          </div>
        </div>
      </div>

      {/* Global Payments Stream Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Global Payments Stream</h2>
            <p className="text-xs text-slate-500">Real-time ledger audit log of all customer transactions</p>
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
                <th className="py-3 px-3">Failure Reason / Switch Detail</th>
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
                        p.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700'
                          : p.status === 'REVERSED'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                    {p.failure_reason || (p.status === 'SUCCESS' ? 'Cleared via Switch' : '-')}
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
