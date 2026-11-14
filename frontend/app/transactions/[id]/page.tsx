'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  CornerDownLeft,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';
import { PaymentReceipt } from '../../../lib/types';

export default function TransactionDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && transactionId) {
      api
        .getTransactionById(transactionId)
        .then((data) => {
          setReceipt(data.receipt);
        })
        .catch((err) => {
          setError(err.message || 'Transaction not found');
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, transactionId]);

  if (!user) return null;

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading receipt details...</div>;
  }

  if (error || !receipt) {
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

  const isSuccess = receipt.status === 'SUCCESS';

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

      {/* Invoice Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="text-center pb-6 border-b border-slate-100">
          <div
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3 shadow-md ${
              isSuccess
                ? 'bg-emerald-100 text-emerald-600 shadow-emerald-100'
                : 'bg-rose-100 text-rose-600 shadow-rose-100'
            }`}
          >
            {isSuccess ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>

          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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
            <span className="text-slate-500">Payment ID:</span>
            <span className="font-mono text-slate-700">{receipt.paymentId}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Sender Account:</span>
            <span className="font-semibold text-slate-800">{receipt.sender.name} ({receipt.sender.email})</span>
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
                dateStyle: 'full',
                timeStyle: 'medium',
              })}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Simulated Bank Switch:</span>
            <span className="font-bold text-indigo-700">{receipt.simulatorResponse?.simulatedGateway}</span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-slate-500">Switch Auth Code:</span>
            <span className="font-mono font-semibold text-slate-800">{receipt.simulatorResponse?.authCode}</span>
          </div>
        </div>

        {/* Refund CTA if eligible */}
        {isSuccess && (
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 no-print">
            <Link
              href={`/refunds?paymentId=${receipt.paymentId}`}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <CornerDownLeft className="w-4 h-4" />
              <span>Request Refund for this Payment</span>
            </Link>
          </div>
        )}

        <div className="mt-6 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span>ApexPay Simulated Financial Records • Academic Demonstration Only</span>
        </div>
      </div>
    </div>
  );
}
