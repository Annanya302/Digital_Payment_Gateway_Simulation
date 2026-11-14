'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { TransactionItem, PaymentReceipt } from '../../lib/types';
import ReceiptModal from '../../components/ReceiptModal';

export default function DashboardPage() {
  const { user, wallet, refreshProfile } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoadingTxns, setIsLoadingTxns] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoadingTxns(true);
    try {
      const data = await api.getTransactions({ limit: 5 });
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTxns(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleViewReceipt = async (txn: TransactionItem) => {
    try {
      const details = await api.getTransactionById(txn.transaction_id);
      setSelectedReceipt(details.receipt);
      setIsReceiptOpen(true);
    } catch (err) {
      console.error('Failed to load transaction receipt', err);
    }
  };

  if (!user) return null;

  // Compute local quick totals
  const totalSpent = transactions
    .filter((t) => t.type === 'DEBIT' && t.status === 'SUCCESS')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceived = transactions
    .filter((t) => t.type === 'CREDIT' && t.status === 'SUCCESS')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner with Name & Quick Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, {user.name} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulated Account • Registered Email: <strong className="text-slate-700">{user.email}</strong>
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance Hero Card */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">
                Primary Simulated Wallet
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                Active
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black tracking-tight mb-1">
              ₹{(wallet?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-indigo-200">
              Currency: INR • Daily Limit: ₹{(wallet?.daily_limit ?? 50000).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="pt-6 flex gap-2">
            <Link
              href="/send"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Send Money</span>
            </Link>
            <Link
              href="/wallet"
              className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors backdrop-blur-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Top-Up</span>
            </Link>
          </div>
        </div>

        {/* Quick Send Money Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Peer-to-Peer Transfer</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Instant simulated transfers to any registered user by email or mobile number with 4-digit PIN verification.
            </p>
          </div>
          <Link
            href="/send"
            className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
          >
            <span>Initiate P2P Transfer</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Quick Pay Merchant Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Merchant Checkout</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Execute test payments to verified merchants: Amazon India, Swiggy, Flipkart, and Netflix.
            </p>
          </div>
          <Link
            href="/merchant"
            className="mt-4 text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 group"
          >
            <span>Pay a Merchant</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Latest activity on your simulated account</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoadingTxns ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading ledger records...</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">No transactions recorded yet.</p>
            <Link
              href="/send"
              className="mt-3 inline-block px-4 py-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-100"
            >
              Make Your First Payment
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Reference / ID</th>
                  <th className="py-3 px-3">Counterparty</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => {
                  const isDebit = t.type === 'DEBIT';
                  const isSuccess = t.status === 'SUCCESS';

                  return (
                    <tr key={t.transaction_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-800">
                        {t.reference_id}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-800">
                        {t.counterparty || 'External User'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 uppercase font-semibold text-[11px]">
                        {t.paymentMode || 'WALLET'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`font-bold ${
                            isDebit ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {isDebit ? '-' : '+'}₹{t.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleViewReceipt(t)}
                          className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold text-[11px]"
                          title="View Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
        onRequestRefund={(paymentId) => {
          router.push(`/refunds?paymentId=${paymentId}`);
        }}
      />
    </div>
  );
}
