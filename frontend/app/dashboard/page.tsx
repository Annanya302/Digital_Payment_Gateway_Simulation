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
  Building2,
  ShieldCheck,
  CreditCard,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { TransactionItem, PaymentReceipt, BankAccount } from '../../lib/types';
import ReceiptModal from '../../components/ReceiptModal';
import PinModal from '../../components/PinModal';

export default function DashboardPage() {
  const { user, wallet, bankAccount, refreshProfile, socket } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoadingTxns, setIsLoadingTxns] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);

  // Masked Bank Balance State (Protected by PIN)
  const [isBalanceRevealed, setIsBalanceRevealed] = useState(false);
  const [revealedBalance, setRevealedBalance] = useState<number | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Admin is monitoring-only: redirect to Admin overview
    if (user.role === 'admin') {
      router.push('/admin');
      return;
    }

    loadDashboardData();
  }, [user]);

  // Real-time socket updates for new transactions
  useEffect(() => {
    if (socket && user) {
      const handleNewTxn = (receipt: PaymentReceipt) => {
        loadDashboardData();
      };
      socket.on('transaction_created', handleNewTxn);
      return () => {
        socket.off('transaction_created', handleNewTxn);
      };
    }
  }, [socket, user]);

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

  const handleCopyAccount = (accNum: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
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
      {/* Top Banner with Welcome & Quick Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, {user.name} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulated Account • Registered Email: <strong className="text-slate-700">{user.email}</strong> • Role: Customer
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Balances</span>
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Balance Hero Card */}
        <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-indigo-400" />
                <span>Simulated Wallet Balance</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                Active
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black tracking-tight mb-1">
              ₹{(wallet?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-indigo-200">
              Currency: INR • Daily Transaction Limit: ₹{(wallet?.daily_limit ?? 50000).toLocaleString('en-IN')}
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
              <span>Add Demo Money</span>
            </Link>
          </div>
        </div>

        {/* Bank Information Card (Requirement B & C) */}
        <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-sky-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Simulated Bank Account</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{bankAccount?.verification_status || 'VERIFIED'}</span>
              </span>
            </div>

            {/* Masked Bank Balance by Default - Requires PIN to reveal (UPI/Banking Standard) */}
            <div className="mb-2">
              <div className="flex items-baseline justify-between gap-2">
                {isBalanceRevealed && revealedBalance !== null ? (
                  <div className="text-3xl sm:text-4xl font-black tracking-tight text-sky-50 animate-in fade-in duration-200">
                    ₹{revealedBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setPinError(null);
                      setIsPinModalOpen(true);
                    }}
                    className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-sky-200/90 hover:text-white transition-colors cursor-pointer text-left"
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
              <p className="text-[11px] text-sky-200 mt-1">
                {bankAccount?.bank_name || 'Simulated Bank'} • {bankAccount?.account_type || 'SAVINGS'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-sky-300 text-[11px]">A/C Number:</span>
              <button
                onClick={() => bankAccount && handleCopyAccount(bankAccount.account_number)}
                className="font-mono font-bold text-sky-100 hover:text-white flex items-center gap-1 text-[11px]"
                title="Click to copy"
              >
                <span>{bankAccount?.account_number || 'N/A'}</span>
                {copiedAcc ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-sky-300" />}
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sky-300 text-[11px]">IFSC Code:</span>
              <span className="font-mono text-sky-100 text-[11px]">{bankAccount?.ifsc_code || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Quick Transfer Actions Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Instant Inter-Bank & P2P</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Transfer between simulated banks (SBI, HDFC, ICICI, Axis, PNB) with multi-stage switch routing and PIN security.
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <Link
              href="/send"
              className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-between transition-colors"
            >
              <span>Peer-to-Peer Transfer</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/merchant"
              className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-between transition-colors"
            >
              <span>Merchant Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Live ledger activity on your simulated account</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View Complete Ledger</span>
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
              href="/wallet"
              className="mt-3 inline-block px-4 py-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-100"
            >
              Add Demo Money to Start
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
                  <th className="py-3 px-3 text-right">Receipt & Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => {
                  const isDebit = t.type === 'DEBIT';
                  const isSuccess = t.status === 'SUCCESS';
                  const isReversed = t.status === 'REVERSED';

                  return (
                    <tr key={t.transaction_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-800">
                        {t.reference_id}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-800">
                        {t.counterparty || 'External Entity'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 uppercase font-semibold text-[11px]">
                        {t.paymentMode || 'WALLET'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                            t.type === 'CREDIT'
                              ? 'text-emerald-600'
                              : t.type === 'REFUND' || t.type === 'REVERSAL'
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {t.type === 'CREDIT' ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span>{t.type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {isDebit ? '-' : '+'}₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700'
                              : isReversed
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleViewReceipt(t)}
                          className="px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 font-bold rounded-lg text-xs transition-colors"
                        >
                          View Details
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

      {/* Transaction Details & Timeline Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
