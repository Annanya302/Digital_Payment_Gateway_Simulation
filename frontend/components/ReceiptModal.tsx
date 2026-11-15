'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  X,
  ShieldCheck,
  Building2,
  GitBranch,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PaymentReceipt } from '../lib/types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: PaymentReceipt | null;
  onRequestRefund?: (paymentId: string) => void;
  onReversal?: (paymentId: string) => void;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  receipt,
  onRequestRefund,
  onReversal,
}: ReceiptModalProps) {
  const [showTimeline, setShowTimeline] = useState(true);

  if (!isOpen || !receipt) return null;

  const isSuccess = receipt.status === 'SUCCESS';
  const isReversed = receipt.status === 'REVERSED';
  const isPending = receipt.status === 'PENDING';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors no-print"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Receipt Content */}
        <div id="printable-receipt" className="text-center pt-2">
          {/* Status Icon with Celebratory Sonar Animation */}
          <div className="relative flex items-center justify-center w-16 h-16 mx-auto mb-3">
            {isSuccess && (
              <span className="absolute inline-flex h-16 w-16 rounded-full bg-emerald-400 opacity-30 animate-ping"></span>
            )}
            {!isSuccess && !isPending && !isReversed && (
              <span className="absolute inline-flex h-16 w-16 rounded-full bg-rose-400 opacity-30 animate-ping"></span>
            )}
            <div
              className={`relative w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg transition-transform ${
                isSuccess
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30'
                  : isReversed
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/30'
                  : isPending
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30'
                  : 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/30 animate-shake'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-8 h-8 animate-pulse" />
              ) : isPending ? (
                <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
            </div>
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

          <h3 className="text-2xl font-black text-slate-900">
            ₹{receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            {isSuccess
              ? 'Simulated Payment Authorized & Settled'
              : isReversed
              ? 'Payment Reversed • Funds Restored'
              : receipt.failureReason || 'Payment Declined by Bank Switch'}
          </p>

          {/* Receipt Breakdown Table */}
          <div className="mt-6 bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Transaction Ref:</span>
              <span className="font-mono font-bold text-slate-800">{receipt.referenceId}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Transfer Type:</span>
              <span className="font-semibold text-indigo-700 uppercase flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                <span>
                  {receipt.transferType === 'INTRA_BANK' ? 'Intra-Bank Clearing' : 'Inter-Bank Switch'}
                </span>
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-semibold text-slate-800 uppercase">{receipt.paymentMode}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Paid By:</span>
              <span className="font-medium text-slate-800">
                {receipt.sender.name} ({receipt.sender.bankCode || 'HDFC'})
              </span>
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

            {/* Switch Telemetry */}
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

          {/* 11-Stage Transaction Pipeline Timeline (Requirement E) */}
          <div className="mt-4 text-left border border-slate-200 rounded-2xl p-4 bg-white">
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-800 mb-2"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Transaction Processing Timeline (11 Stages)</span>
              </span>
              {showTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTimeline && (
              <div className="space-y-3 pt-2 text-xs border-t border-slate-100">
                {(receipt.pipelineStages && receipt.pipelineStages.length > 0
                  ? receipt.pipelineStages
                  : [
                      { stageNumber: 1, stageName: 'Payment Initiation', status: 'SUCCESS', timestamp: receipt.createdAt, detail: 'Request received' },
                      { stageNumber: 2, stageName: 'Request Validation', status: 'SUCCESS', timestamp: receipt.createdAt, detail: 'Parameters verified' },
                      { stageNumber: 3, stageName: 'Recipient Verification', status: 'SUCCESS', timestamp: receipt.createdAt, detail: 'Recipient validated' },
                      { stageNumber: 4, stageName: 'Demo PIN Authentication', status: 'SUCCESS', timestamp: receipt.createdAt, detail: 'PIN verified' },
                      { stageNumber: 5, stageName: 'Gateway Processing', status: 'SUCCESS', timestamp: receipt.createdAt, detail: 'Transaction assigned' },
                      { stageNumber: 6, stageName: 'Bank Routing', status: 'SUCCESS', timestamp: receipt.createdAt, detail: 'Switch routing established' },
                      { stageNumber: 7, stageName: 'Balance Verification', status: 'SUCCESS', timestamp: receipt.createdAt, detail: 'Sufficient funds verified' },
                      { stageNumber: 8, stageName: 'Transaction Authorization', status: receipt.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED', timestamp: receipt.createdAt, detail: receipt.simulatorResponse?.responseMessage || 'Switch response' },
                      { stageNumber: 9, stageName: 'Atomic Debit & Credit', status: receipt.status === 'SUCCESS' ? 'SUCCESS' : 'SKIPPED', timestamp: receipt.createdAt, detail: receipt.status === 'SUCCESS' ? 'Double-entry settled' : 'Skipped' },
                      { stageNumber: 10, stageName: 'Status Update', status: 'SUCCESS', timestamp: receipt.createdAt, detail: `Marked as ${receipt.status}` },
                      { stageNumber: 11, stageName: 'Notification Generation', status: 'SUCCESS', timestamp: receipt.createdAt, detail: 'Alerts dispatched' },
                    ]
                ).map((stage) => {
                  const isStageSuccess = stage.status === 'SUCCESS';
                  const isStageFailed = stage.status === 'FAILED';
                  return (
                    <div key={stage.stageNumber} className="flex items-start gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                          isStageSuccess
                            ? 'bg-emerald-100 text-emerald-700'
                            : isStageFailed
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {stage.stageNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-800 text-[11px]">{stage.stageName}</p>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                              isStageSuccess
                                ? 'bg-emerald-50 text-emerald-700'
                                : isStageFailed
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {stage.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{stage.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>PaySim Ledger Record • Double-Entry Verified</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-col gap-2 no-print">
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
