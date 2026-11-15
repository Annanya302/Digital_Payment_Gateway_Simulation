'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  CornerDownLeft,
  AlertCircle,
  Building2,
  GitBranch,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';
import { PaymentReceipt } from '../../../lib/types';

export default function TransactionDetailPage() {
  const { user, refreshProfile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReversing, setIsReversing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && transactionId) {
      loadReceipt();
    }
  }, [user, transactionId]);

  const loadReceipt = () => {
    api
      .getTransactionById(transactionId)
      .then((data) => {
        setReceipt(data.receipt);
      })
      .catch((err) => {
        setError(err.message || 'Transaction not found');
      })
      .finally(() => setIsLoading(false));
  };

  const handleReverse = async () => {
    if (!receipt) return;
    setIsReversing(true);
    setError(null);
    try {
      const updated = await api.reversePayment(receipt.paymentId, 'User requested transaction reversal');
      setReceipt(updated);
      setSuccessMsg('Transaction reversed successfully and funds restored.');
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to reverse transaction');
    } finally {
      setIsReversing(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading receipt details...</div>;
  }

  if (error && !receipt) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Receipt Not Available</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'Could not find the requested transaction.'}</p>
        <Link
          href="/transactions"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Transactions</span>
        </Link>
      </div>
    );
  }

  if (!receipt) return null;

  const isSuccess = receipt.status === 'SUCCESS';
  const isReversed = receipt.status === 'REVERSED';
  const isPending = receipt.status === 'PENDING';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between no-print">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Transactions</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Invoice Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="text-center pb-6 border-b border-slate-100">
          <div
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3 shadow-md ${
              isSuccess
                ? 'bg-emerald-100 text-emerald-600 shadow-emerald-100'
                : isReversed
                ? 'bg-amber-100 text-amber-600 shadow-amber-100'
                : isPending
                ? 'bg-blue-100 text-blue-600 shadow-blue-100'
                : 'bg-rose-100 text-rose-600 shadow-rose-100'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : isPending ? (
              <Clock className="w-8 h-8" />
            ) : (
              <XCircle className="w-8 h-8" />
            )}
          </div>

          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              isSuccess
                ? 'bg-emerald-50 text-emerald-700'
                : isReversed
                ? 'bg-amber-50 text-amber-700'
                : isPending
                ? 'bg-blue-50 text-blue-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            Payment {receipt.status}
          </span>

          <h1 className="text-3xl font-black text-slate-900">
            ₹{receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            {isSuccess
              ? 'Simulated Payment Authorized & Settled'
              : isReversed
              ? 'Payment Reversed • Funds Restored to Source'
              : receipt.failureReason || 'Declined by Simulated Banking Rails'}
          </p>
        </div>

        {/* Invoice details */}
        <div className="py-6 space-y-3 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Transaction Reference:</span>
            <span className="font-mono font-bold text-slate-900">{receipt.referenceId}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Transfer Type:</span>
            <span className="font-semibold text-indigo-700 uppercase flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" />
              <span>
                {receipt.transferType === 'INTRA_BANK' ? 'Intra-Bank Clearing' : 'Inter-Bank Switch'}
              </span>
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Payment ID:</span>
            <span className="font-mono text-slate-700">{receipt.paymentId}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Sender Account:</span>
            <span className="font-semibold text-slate-800">
              {receipt.sender.name} ({receipt.sender.bankCode || 'HDFC'})
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Receiver / Merchant:</span>
            <span className="font-semibold text-slate-800">
              {receipt.merchant?.name || receipt.receiver?.name || 'External'}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Payment Mode:</span>
            <span className="font-bold uppercase text-slate-800">{receipt.paymentMode}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Timestamp:</span>
            <span className="text-slate-700">
              {new Date(receipt.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'medium',
              })}
            </span>
          </div>
        </div>

        {/* 11-Stage Transaction Pipeline Timeline (Requirement E) */}
        <div className="mt-2 border border-slate-200 rounded-2xl p-4 bg-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-xs text-slate-900">Transaction Processing Timeline</h3>
          </div>

          <div className="space-y-3">
            {(receipt.pipelineStages && receipt.pipelineStages.length > 0
              ? receipt.pipelineStages
              : [
                  { stageNumber: 1, stageName: 'Payment Initiation', status: 'SUCCESS', detail: 'Payment request initiated' },
                  { stageNumber: 2, stageName: 'Request Validation', status: 'SUCCESS', detail: 'Request format and limits validated' },
                  { stageNumber: 3, stageName: 'Recipient Verification', status: 'SUCCESS', detail: 'Recipient account confirmed active' },
                  { stageNumber: 4, stageName: 'Demo PIN Authentication', status: 'SUCCESS', detail: 'Transaction PIN verified' },
                  { stageNumber: 5, stageName: 'Gateway Processing', status: 'SUCCESS', detail: 'Gateway reference assigned' },
                  { stageNumber: 6, stageName: 'Bank Routing', status: 'SUCCESS', detail: 'Bank switch routing established' },
                  { stageNumber: 7, stageName: 'Balance Verification', status: 'SUCCESS', detail: 'Sufficient source funds verified' },
                  { stageNumber: 8, stageName: 'Transaction Authorization', status: isSuccess ? 'SUCCESS' : 'FAILED', detail: receipt.simulatorResponse?.responseMessage || 'Switch response' },
                  { stageNumber: 9, stageName: 'Atomic Debit & Credit', status: isSuccess ? 'SUCCESS' : 'SKIPPED', detail: isSuccess ? 'Atomic ledger update complete' : 'Skipped' },
                  { stageNumber: 10, stageName: 'Status Update', status: 'SUCCESS', detail: `Status recorded as ${receipt.status}` },
                  { stageNumber: 11, stageName: 'Notification Generation', status: 'SUCCESS', detail: 'Real-time notifications sent' },
                ]
            ).map((st) => (
              <div key={st.stageNumber} className="flex items-start gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                    st.status === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-700'
                      : st.status === 'FAILED'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {st.stageNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-[11px]">{st.stageName}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        st.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : st.status === 'FAILED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {st.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{st.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions: Reversal if eligible */}
        {isSuccess && !isReversed && receipt.sender.userId === user.user_id && (
          <div className="mt-6 pt-4 border-t border-slate-100 no-print">
            <button
              onClick={handleReverse}
              disabled={isReversing}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReversing ? 'animate-spin' : ''}`} />
              <span>{isReversing ? 'Reversing Payment...' : 'Controlled Reversal (Refund to Source)'}</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-1">
              Controlled rollback restores balances and records an immutable REVERSAL ledger entry.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
