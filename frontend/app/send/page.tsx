'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SendHorizontal,
  Wallet,
  Smartphone,
  CreditCard,
  Building2,
  UserCheck,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  GitBranch,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { PaymentMode, SimulatorOutcome, PaymentReceipt, BankCode } from '../../lib/types';
import SimulatorControls from '../../components/SimulatorControls';
import PinModal from '../../components/PinModal';
import ReceiptModal from '../../components/ReceiptModal';

export default function SendMoneyPage() {
  const { user, wallet, bankAccount, refreshProfile } = useAuth();
  const router = useRouter();

  const [receiverIdentifier, setReceiverIdentifier] = useState('priya@example.com');
  const [amount, setAmount] = useState('1500');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('WALLET');
  const [simulatedOutcome, setSimulatedOutcome] = useState<SimulatorOutcome | 'AUTO'>('AUTO');
  const [selectedBank, setSelectedBank] = useState<BankCode>(
    (bankAccount?.bank_code as BankCode) || 'HDFC'
  );

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

  if (user.role === 'admin') {
    router.push('/admin');
    return null;
  }

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

    if (paymentMode === 'NET_BANKING' && bankAccount && amt > bankAccount.balance) {
      setPageError(`Insufficient bank balance. You have ₹${bankAccount.balance.toFixed(2)} in ${bankAccount.bank_name}`);
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
        senderBankCode: selectedBank,
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Send Money (Multi-Bank P2P)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Simulated fund transfer via Core Banking Rails, NPCI UPI, or Net Banking
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
            <p className="text-[11px] text-slate-400 mt-1">
              Demo recipients: <code className="text-indigo-600 font-semibold cursor-pointer" onClick={() => setReceiverIdentifier('priya@example.com')}>priya@example.com</code> (SBI),{' '}
              <code className="text-indigo-600 font-semibold cursor-pointer" onClick={() => setReceiverIdentifier('rohit@example.com')}>rohit@example.com</code> (ICICI)
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="25000"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Max single transaction: ₹25,000.00 • Test triggers: ending in <code className="text-slate-600">.02</code> (Decline), <code className="text-slate-600">.03</code> (Timeout), <code className="text-slate-600">.04</code> (Bank Down)
            </p>
          </div>

          {/* Issuing Bank Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Issuing / Debiting Bank</span>
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value as BankCode)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
            >
              <option value="HDFC">HDFC Bank (Primary Linked)</option>
              <option value="SBI">State Bank of India (SBI)</option>
              <option value="ICICI">ICICI Bank</option>
              <option value="AXIS">Axis Bank</option>
              <option value="PNB">Punjab National Bank (PNB)</option>
            </select>
          </div>

          {/* Payment Mode Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Select Payment Rail</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('WALLET')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'WALLET'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Wallet className="w-5 h-5 text-indigo-600" />
                <span className="text-xs">Wallet</span>
                <span className="text-[10px] text-slate-400">₹{(wallet?.balance ?? 0).toFixed(0)}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('NET_BANKING')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'NET_BANKING'
                    ? 'border-sky-600 bg-sky-50/50 text-sky-900 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Building2 className="w-5 h-5 text-sky-600" />
                <span className="text-xs">Net Banking</span>
                <span className="text-[10px] text-slate-400">Direct A/C</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span className="text-xs">UPI 2.0</span>
                <span className="text-[10px] text-slate-400">NPCI Switch</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('CARD')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMode === 'CARD'
                    ? 'border-amber-600 bg-amber-50/50 text-amber-900 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-600" />
                <span className="text-xs">Card</span>
                <span className="text-[10px] text-slate-400">Visa / RuPay</span>
              </button>
            </div>
          </div>

          {/* Card Details if Mode === CARD */}
          {paymentMode === 'CARD' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Simulated Card Details</span>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4111 2222 3333 4444"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Expiry</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to PIN Authentication</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* PIN Authentication Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSubmit={handlePinSubmit}
        isLoading={isAuthorizing}
        error={pinError}
        amount={parseFloat(amount) || 0}
        paymentMode={paymentMode}
        recipientName={receiverIdentifier}
      />

      {/* Printable Receipt & 11-Stage Timeline Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={receipt}
      />
    </div>
  );
}
