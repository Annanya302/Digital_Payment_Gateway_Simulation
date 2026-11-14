'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { TransactionItem } from '../../lib/types';

export default function WalletPage() {
  const { user, wallet, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('2000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadWalletTransactions();
  }, [user]);

  const loadWalletTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getWalletTransactions();
      setTransactions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const amountNum = parseFloat(topUpAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      await api.topUpWallet(amountNum);
      await refreshProfile();
      await loadWalletTransactions();
      setTopUpModalOpen(false);
      setMessage({ text: `Successfully credited ₹${amountNum.toFixed(2)} to your wallet!`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Top-up failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wallet & Balances</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative ledger balance, virtual card, and top-up facility
          </p>
        </div>

        <button
          onClick={() => setTopUpModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Top-Up Wallet</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Virtual Card Visualization */}
        <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-indigo-400" />
              <span className="font-bold tracking-widest text-xs uppercase text-indigo-200">
                ApexPay Virtual Pass
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
              {wallet?.status || 'Active'}
            </span>
          </div>

          <div className="my-6">
            <p className="text-xs text-indigo-300 font-semibold mb-1">Available Ledger Balance</p>
            <div className="text-3xl sm:text-5xl font-black tracking-tight">
              ₹{(wallet?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex items-end justify-between border-t border-white/10 pt-4 text-xs">
            <div>
              <p className="text-[10px] text-indigo-300 uppercase font-semibold">Cardholder</p>
              <p className="font-bold text-white uppercase tracking-wider">{user.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-indigo-300 uppercase font-semibold">UPI Virtual Handle</p>
              <p className="font-mono text-xs text-indigo-100">{user.email.split('@')[0]}@apexpay</p>
            </div>
          </div>
        </div>

        {/* Limits & Status Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Simulated Controls & Limits</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Daily Transaction Limit:</span>
                  <strong className="text-slate-900">₹{(wallet?.daily_limit ?? 50000).toLocaleString('en-IN')}</strong>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-600 h-2 rounded-full w-1/4" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Single Txn Max:</span>
                  <span className="font-semibold text-slate-800">₹25,000.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Currency Code:</span>
                  <span className="font-semibold text-slate-800">{wallet?.currency || 'INR'}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Atomic Guarantee:</span>
                  <span className="font-semibold text-emerald-600">Strict balance &gt;= 0</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setTopUpModalOpen(true)}
            className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            Add Demo Funds
          </button>
        </div>
      </div>

      {/* Wallet Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Wallet Transaction Ledger</h2>
        <p className="text-xs text-slate-500 mb-4">Complete audit trail of balance debits, credits, and refunds</p>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading wallet ledger...</div>
        ) : transactions.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">No wallet transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.transaction_id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{t.reference_id}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          t.type === 'DEBIT' ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {t.type === 'DEBIT' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                        <span>{t.type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {t.type === 'DEBIT' ? '-' : '+'}₹{t.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(t.created_at).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      {topUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative border border-slate-100">
            <button
              onClick={() => setTopUpModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Top-Up Wallet</h3>
              <p className="text-xs text-slate-500 mt-0.5">Add simulated demo funds to your account</p>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max="50000"
                  step="1"
                  required
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['500', '1000', '2500', '5000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTopUpAmount(val)}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                  >
                    +₹{val}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
              >
                {isSubmitting ? 'Processing Credit...' : 'Confirm Top-Up'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
