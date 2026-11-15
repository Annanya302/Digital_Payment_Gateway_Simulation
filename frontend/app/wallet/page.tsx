'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Building2,
  RefreshCw,
  Clock,
  AlertCircle,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { TransactionItem } from '../../lib/types';
import PinModal from '../../components/PinModal';

export default function WalletPage() {
  const { user, wallet, bankAccount, refreshProfile } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Masked Bank Balance State
  const [isBalanceRevealed, setIsBalanceRevealed] = useState(false);
  const [revealedBalance, setRevealedBalance] = useState<number | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Top-Up modal state
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpTarget, setTopUpTarget] = useState<'WALLET' | 'BANK'>('WALLET');
  const [topUpAmount, setTopUpAmount] = useState('2000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role === 'admin') {
      router.push('/admin');
      return;
    }

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

      if (topUpTarget === 'WALLET') {
        await api.topUpWallet(amountNum);
        setMessage({
          text: `Successfully added ₹${amountNum.toFixed(2)} demo funds to your simulated wallet!`,
          type: 'success',
        });
      } else {
        if (!bankAccount) {
          throw new Error('No linked bank account found');
        }
        await api.topUpBankAccount(bankAccount.account_id, amountNum);
        setMessage({
          text: `Successfully deposited ₹${amountNum.toFixed(2)} demo funds into ${bankAccount.bank_name}!`,
          type: 'success',
        });
      }

      await refreshProfile();
      await loadWalletTransactions();
      setTopUpModalOpen(false);
    } catch (err: any) {
      setMessage({ text: err.message || 'Top-up failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckBalancePinSubmit = async (pin: string) => {
    if (!bankAccount) return;
    setIsCheckingBalance(true);
    setPinError(null);
    try {
      const res = await api.checkBankAccountBalance(bankAccount.account_id, pin);
      setRevealedBalance(res.balance);
      setIsBalanceRevealed(true);
      setIsPinModalOpen(false);
    } catch (err: any) {
      setPinError(err.message || 'Incorrect PIN entered. Please try again.');
    } finally {
      setIsCheckingBalance(false);
    }
  };

  if (!user || user.role === 'admin') return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Simulated Balances & Top-Up</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative ledger balance, virtual card, and linked bank account rails
          </p>
        </div>

        <button
          onClick={() => setTopUpModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Demo Money</span>
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

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Virtual Card Visualization */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-indigo-400" />
              <span className="font-bold tracking-widest text-xs uppercase text-indigo-200">
                PaySim Virtual Pass
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
              {wallet?.status || 'Active'}
            </span>
          </div>

          <div className="my-6">
            <p className="text-xs text-indigo-300 font-semibold mb-1">Available Wallet Balance</p>
            <div className="text-3xl sm:text-5xl font-black tracking-tight">
              ₹{(wallet?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex items-end justify-between border-t border-white/10 pt-4 text-xs">
            <div>
              <p className="text-[10px] text-indigo-300 uppercase font-semibold">Account Holder</p>
              <p className="font-bold text-white uppercase tracking-wider">{user.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-indigo-300 uppercase font-semibold">Simulated VPA</p>
              <p className="font-mono text-xs text-indigo-100">{user.email.split('@')[0]}@paysim</p>
            </div>
          </div>
        </div>

        {/* Bank Account Card */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-sky-400" />
              <span className="font-bold tracking-widest text-xs uppercase text-sky-200">
                {bankAccount?.bank_name || 'Simulated Bank'}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{bankAccount?.verification_status || 'VERIFIED'}</span>
            </span>
          </div>

          <div className="my-6">
            <p className="text-xs text-sky-300 font-semibold mb-1">Bank Account Balance</p>
            <div className="flex items-baseline justify-between gap-2">
              {isBalanceRevealed && revealedBalance !== null ? (
                <div className="text-3xl sm:text-5xl font-black tracking-tight text-white animate-in fade-in duration-200">
                  ₹{revealedBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setPinError(null);
                    setIsPinModalOpen(true);
                  }}
                  className="text-3xl sm:text-5xl font-black font-mono tracking-widest text-sky-200/90 hover:text-white transition-colors cursor-pointer text-left"
                  title="Click to enter PIN and view balance"
                >
                  ₹ XXXX
                </button>
              )}

              {isBalanceRevealed && revealedBalance !== null ? (
                <button
                  onClick={() => {
                    setIsBalanceRevealed(false);
                    setRevealedBalance(null);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-sky-200 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setPinError(null);
                    setIsPinModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 hover:text-white border border-sky-400/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-300" />
                  <span>Check Balance</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between border-t border-white/10 pt-4 text-xs">
            <div>
              <p className="text-[10px] text-sky-300 uppercase font-semibold">Account Number</p>
              <p className="font-mono font-bold text-white text-xs">{bankAccount?.account_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] text-sky-300 uppercase font-semibold">IFSC Code</p>
              <p className="font-mono text-xs text-sky-100">{bankAccount?.ifsc_code || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History for Balances */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-1">Balance Top-Up & Funding Activity</h2>
        <p className="text-xs text-slate-500 mb-4">Historical record of all demo funds added to your account</p>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading ledger records...</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">No top-ups recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.transaction_id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{t.reference_id}</td>
                    <td className="py-3 px-3 font-semibold text-emerald-600 flex items-center gap-1">
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>{t.type}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      +₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(t.created_at).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top-Up Modal */}
      {topUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 relative border border-slate-100">
            <button
              onClick={() => setTopUpModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Add Demo Money</h3>
              <p className="text-xs text-slate-500">Fund your simulated wallet or bank account</p>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTopUpTarget('WALLET')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                      topUpTarget === 'WALLET'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <WalletIcon className="w-3.5 h-3.5" />
                    <span>Wallet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopUpTarget('BANK')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                      topUpTarget === 'BANK'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Bank A/C</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max="50000"
                  required
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                {[1000, 2000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(String(amt))}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Crediting Funds...' : `Credit ₹${topUpAmount || 0} to ${topUpTarget === 'WALLET' ? 'Wallet' : 'Bank'}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PIN Authentication Modal to reveal Bank Balance */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPinError(null);
        }}
        onSubmit={handleCheckBalancePinSubmit}
        isLoading={isCheckingBalance}
        error={pinError}
        amount={0}
        paymentMode="BANK"
        recipientName={
          bankAccount
            ? `${bankAccount.bank_name} (...${bankAccount.account_number.slice(-4)})`
            : 'Bank Account'
        }
      />
    </div>
  );
}
