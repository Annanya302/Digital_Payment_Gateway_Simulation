'use client';

import React from 'react';
import { CheckCircle2, XCircle, Printer, X, ShieldCheck, ArrowRight, CornerDownLeft } from 'lucide-react';
import { PaymentReceipt } from '../lib/types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: PaymentReceipt | null;
  onRequestRefund?: (paymentId: string) => void;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  receipt,
  onRequestRefund,
}: ReceiptModalProps) {
  if (!isOpen || !receipt) return null;

  const isSuccess = receipt.status === 'SUCCESS';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors no-print"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Receipt Content */}
        <div id="printable-receipt" className="text-center pt-2">
          {/* Status Icon */}
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

          <h3 className="text-2xl font-black text-slate-900">
            ₹{receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            {isSuccess
              ? 'Simulated Payment Authorized & Settled'
              : receipt.failureReason || 'Payment Declined by Bank Switch'}
          </p>

          {/* Receipt Breakdown Table */}
          <div className="mt-6 bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Transaction Ref:</span>
              <span className="font-mono font-bold text-slate-800">{receipt.referenceId}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-semibold text-slate-800 uppercase">{receipt.paymentMode}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Paid By:</span>
              <span className="font-medium text-slate-800">{receipt.sender.name}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Paid To:</span>
              <span className="font-medium text-slate-800">
                {receipt.merchant?.name || receipt.receiver?.name || 'Counterparty'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Date & Time:</span>
              <span className="text-slate-700">
                {new Date(receipt.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'medium',
                })}
              </span>
            </div>

            {/* Simulator Details */}
            <div className="pt-2 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Simulated Switch:</span>
                <span className="font-semibold text-indigo-700">{receipt.simulatorResponse?.simulatedGateway}</span>
              </div>
              <div className="flex justify-between">
                <span>Switch Auth Code:</span>
                <span className="font-mono text-slate-700">{receipt.simulatorResponse?.authCode}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Simulated Gateway Ledger Record • Non-Negotiable</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-2 no-print">
            <button
              onClick={handlePrint}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Receipt</span>
            </button>

            {isSuccess && onRequestRefund && (
              <button
                onClick={() => {
                  onClose();
                  onRequestRefund(receipt.paymentId);
                }}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <CornerDownLeft className="w-4 h-4" />
                <span>Request Refund for this Payment</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold"
            >
              Close Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
