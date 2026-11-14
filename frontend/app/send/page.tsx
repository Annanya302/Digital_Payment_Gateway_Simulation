'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SendHorizontal,
  Wallet,
  Smartphone,
  CreditCard,
  UserCheck,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { PaymentMode, SimulatorOutcome, PaymentReceipt } from '../../lib/types';
import SimulatorControls from '../../components/SimulatorControls';
import PinModal from '../../components/PinModal';
import ReceiptModal from '../../components/ReceiptModal';

export default function SendMoneyPage() {
  const { user, wallet, refreshProfile } = useAuth();
  const router = useRouter();

  const [receiverIdentifier, setReceiverIdentifier] = useState('priya@example.com');
  const [amount, setAmount] = useState('1500');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('WALLET');
  const [simulatedOutcome, setSimulatedOutcome] = useState<SimulatorOutcome | 'AUTO'>('AUTO');

  // Card details if mode === 'CARD'
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  // Modals & execution state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  if (!user) return null;

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    setPageError(null);
    setPinError(null);

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setPageError('Please enter a valid amount greater than ₹0');
      return;
    }

    if (amt > 25000) {
      setPageError('Maximum single transfer limit is ₹25,000.00');
      return;
    }

    if (paymentMode === 'WALLET' && wallet && amt > wallet.balance) {
      setPageError(`Insufficient wallet balance. You have ₹${wallet.balance.toFixed(2)}`);
      return;
    }

    if (receiverIdentifier.trim().toLowerCase() === user.email.toLowerCase()) {
      setPageError('You cannot transfer money to your own email address.');
      return;
    }

    setIsPinModalOpen(true);
  };

  const handlePinSubmit = async (pin: string) => {
    setIsAuthorizing(true);
    setPinError(null);

    try {
      const payload: any = {
        receiverIdentifier: receiverIdentifier.trim(),
        amount: parseFloat(amount),
        paymentMode,
        pin,
        simulatedOutcome: simulatedOutcome === 'AUTO' ? undefined : simulatedOutcome,
      };

      if (paymentMode === 'CARD') {
        payload.cardDetails = {
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiry: cardExpiry,
          cvv: cardCvv,
        };
      }

      const receiptData = await api.sendMoney(payload);
      setIsPinModalOpen(false);
      setReceipt(receiptData);
      setIsReceiptOpen(true);
      await refreshProfile();
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('pin')) {
        setPinError(err.message);
      } else {
        setIsPinModalOpen(false);
        setPageError(err.message || 'Payment failed');
      }
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Send Money (P2P)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Initiate a simulated transfer to any registered user using Wallet, UPI, or Card
        </p>
      </div>

      {/* Simulator Test Controller */}
      <SimulatorControls
        selectedOutcome={simulatedOutcome}
        onChange={(outcome) => setSimulatedOutcome(outcome)}
      />

      {pageError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{pageError}</span>
        </div>
      )}

      {/* Payment Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleInitiate} className="space-y-6">
          {/* Recipient Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Recipient Email or Mobile Number
            </label>
            <input
              type="text"
              required
              value={receiverIdentifier}
              onChange={(e) => setReceiverIdentifier(e.target.value)}
              placeholder="e.g. priya@example.com or +919876543212"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />

            {/* Quick recipient pills */}
            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-slate-500">
              <span className="text-[11px] font-semibold text-slate-400">Quick Select:</span>
              <button
                type="button"
                onClick={() => setReceiverIdentifier('priya@example.com')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-[11px] transition-colors"
              >
                Priya Sharma (priya@example.com)
              </button>
              <button
                type="button"
                onClick={() => setReceiverIdentifier('rohit@example.com')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-[11px] transition-colors"
              >
                Rohit Verma (rohit@example.com)
              </button>
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Amount to Transfer (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-lg font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="1"
                max="25000"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000.00"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Quick amount shortcuts */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {['500', '1000', '2500', '5000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className="py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMode('WALLET')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  paymentMode === 'WALLET'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Wallet className={`w-5 h-5 ${paymentMode === 'WALLET' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    Instant
                  </span>
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">ApexPay Wallet</p>
                  <p className="text-[11px] text-slate-500">₹{(wallet?.balance ?? 0).toFixed(2)} available</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  paymentMode === 'UPI'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Smartphone className={`w-5 h-5 ${paymentMode === 'UPI' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    UPI 2.0
                  </span>
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Simulated UPI</p>
                  <p className="text-[11px] text-slate-500">NPCI Simulator Rail</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('CARD')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  paymentMode === 'CARD'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className={`w-5 h-5 ${paymentMode === 'CARD' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    Debit/Credit
                  </span>
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Simulated Card</p>
                  <p className="text-[11px] text-slate-500">Visa / RuPay Rail</p>
                </div>
              </button>
            </div>
          </div>

          {/* Card Mock Inputs if CARD mode */}
          {paymentMode === 'CARD' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-slate-700">Test Card Details (Sandbox)</p>
              <div>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4111 2222 3333 4444"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
                <input
                  type="password"
                  maxLength={3}
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  placeholder="CVV"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to PIN Verification</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Simulated PIN Dialog */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSubmit={handlePinSubmit}
        amount={parseFloat(amount) || 0}
        paymentMode={paymentMode}
        recipientName={receiverIdentifier}
        isLoading={isAuthorizing}
        error={pinError}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={receipt}
        onRequestRefund={(paymentId) => {
          router.push(`/refunds?paymentId=${paymentId}`);
        }}
      />
    </div>
  );
}
