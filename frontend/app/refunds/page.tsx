'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { RefundItem, TransactionItem } from '../../lib/types';

function RefundsContent() {
  const { user, refreshProfile } = useAuth();
  const searchParams = useSearchParams();

  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [eligibleTxns, setEligibleTxns] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refund modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('Duplicate payment / Customer request');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    const qPaymentId = searchParams.get('paymentId');
    if (qPaymentId) {
      setSelectedPaymentId(qPaymentId);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [refundData, txnData] = await Promise.all([
        api.getRefunds(),
        api.getTransactions({ status: 'SUCCESS', type: 'DEBIT', limit: 20 }),
      ]);
      setRefunds(refundData || []);
      setEligibleTxns(txnData.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRefundModal = (paymentId: string, amount: number) => {
    setSelectedPaymentId(paymentId);
    setRefundAmount(String(amount));
    setIsModalOpen(true);
    setMessage(null);
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const amt = parseFloat(refundAmount);
      await api.requestRefund({
        paymentId: selectedPaymentId,
        reason: refundReason,
        amount: isNaN(amt) ? undefined : amt,
      });

      await refreshProfile();
      await loadData();
      setIsModalOpen(false);
      setMessage({
        text: 'Simulated refund has been approved and credited back to your wallet!',
        type: 'success',
      });
    } catch (err: any) {
      setMessage({
        text: err.message || 'Refund request was rejected',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Refund Center</h1>
        <p className="text-xs text-slate-500 mt-1">
          Initiate and monitor refunds for eligible successful transactions
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Eligible Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-1">Eligible Successful Transactions</h2>
        <p className="text-xs text-slate-500 mb-4">
          Select any recent successful payment to request a full or partial refund
        </p>

        {isLoading ? (
          <div className="py-10 text-center text-xs text-slate-400">Loading eligible transactions...</div>
        ) : eligibleTxns.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No eligible debit transactions found for refund.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Paid To</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Original Amount</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eligibleTxns.map((t) => (
                  <tr key={t.transaction_id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{t.reference_id}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{t.counterparty || 'Recipient'}</td>
                    <td className="py-3 px-3 uppercase text-slate-500 font-semibold text-[11px]">
                      {t.paymentMode || 'WALLET'}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">₹{t.amount.toFixed(2)}</td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(t.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenRefundModal(t.payment_id, t.amount)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request Refund</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Processed Refunds History */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-1">Processed Refunds Ledger</h2>
        <p className="text-xs text-slate-500 mb-4">History of all requested and completed refund records</p>

        {refunds.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No refunds processed on your account yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Refund Ref</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.map((r) => (
                  <tr key={r.refund_id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{r.reference_id}</td>
                    <td className="py-3 px-3 font-bold text-emerald-600">+₹{r.amount.toFixed(2)}</td>
                    <td className="py-3 px-3 text-slate-600">{r.reason}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(r.created_at).toLocaleString('en-IN', {
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

      {/* Refund Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative border border-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Request Refund</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Funds will be atomically restored back to your wallet
              </p>
            </div>

            <form onSubmit={handleSubmitRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Refund
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Duplicate payment / Customer request">Duplicate payment / Customer request</option>
                  <option value="Defective or non-delivered merchandise">Defective or non-delivered merchandise</option>
                  <option value="Order cancellation before delivery">Order cancellation before delivery</option>
                  <option value="Incorrect amount billed">Incorrect amount billed</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <span>
                  Validation will ensure the requested amount does not exceed the remaining eligible refundable balance.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
              >
                {isSubmitting ? 'Verifying & Refunding...' : 'Confirm Simulated Refund'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RefundsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading Refund Center...</div>}>
      <RefundsContent />
    </Suspense>
  );
}
