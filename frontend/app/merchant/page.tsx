'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Wallet,
  Smartphone,
  CreditCard,
  Building2,
  ShoppingBag,
  Utensils,
  Tv,
  Car,
  AlertCircle,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { Merchant, PaymentMode, SimulatorOutcome, PaymentReceipt, BankCode } from '../../lib/types';
import SimulatorControls from '../../components/SimulatorControls';
import PinModal from '../../components/PinModal';
import ReceiptModal from '../../components/ReceiptModal';

export default function MerchantPaymentPage() {
  const { user, wallet, bankAccount, refreshProfile } = useAuth();
  const router = useRouter();

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [amount, setAmount] = useState('899');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('WALLET');
  const [simulatedOutcome, setSimulatedOutcome] = useState<SimulatorOutcome | 'AUTO'>('AUTO');
  const [senderBankCode, setSenderBankCode] = useState<BankCode>(
    (bankAccount?.bank_code as BankCode) || 'HDFC'
  );

  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    api
      .getMerchants()
      .then((data) => {
        setMerchants(data || []);
        if (data && data.length > 0) {
          setSelectedMerchantId(data[0].merchant_id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

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
      setPageError('Maximum single transaction limit is ₹25,000.00');
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

    setIsPinModalOpen(true);
  };

  const handlePinSubmit = async (pin: string) => {
    setIsAuthorizing(true);
    setPinError(null);

    try {
      const payload: any = {
        merchantId: selectedMerchantId,
        amount: parseFloat(amount),
        paymentMode,
        pin,
        senderBankCode,
        simulatedOutcome: simulatedOutcome === 'AUTO' ? undefined : simulatedOutcome,
      };

      if (paymentMode === 'CARD') {
        payload.cardDetails = {
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiry: cardExpiry,
          cvv: cardCvv,
        };
      }

      const receiptData = await api.payMerchant(payload);
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

  const selectedMerchant = merchants.find((m) => m.merchant_id === selectedMerchantId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Merchant Checkout Simulator</h1>
        <p className="text-xs text-slate-500 mt-1">
          Execute payment gateway checkout requests to simulated online merchants
        </p>
      </div>

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

      {/* Merchant Selector Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <label className="block text-xs font-bold text-slate-700">Select Merchant for Checkout</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {merchants.map((m) => {
            const isSelected = m.merchant_id === selectedMerchantId;
            return (
              <button
                key={m.merchant_id}
                type="button"
                onClick={() => setSelectedMerchantId(m.merchant_id)}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Store className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate">{m.name}</p>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500">{m.category}</p>
                  <p className="text-[10px] font-mono text-indigo-600 truncate">{m.upi_id}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Configuration */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleInitiate} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (₹)</label>
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
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Issuing Bank Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Issuing Bank (Debit Source)</span>
            </label>
            <select
              value={senderBankCode}
              onChange={(e) => setSenderBankCode(e.target.value as BankCode)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
            >
              <option value="HDFC">HDFC Bank</option>
              <option value="SBI">State Bank of India (SBI)</option>
              <option value="ICICI">ICICI Bank</option>
              <option value="AXIS">Axis Bank</option>
              <option value="PNB">Punjab National Bank (PNB)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Checkout Payment Rail</label>
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
                <span className="text-[10px] text-slate-400">Bank Switch</span>
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
                <span className="text-xs">UPI Intent</span>
                <span className="text-[10px] text-slate-400">NPCI Gateway</span>
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

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to PIN Authentication</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSubmit={handlePinSubmit}
        isLoading={isAuthorizing}
        error={pinError}
        amount={parseFloat(amount) || 0}
        paymentMode={paymentMode}
        recipientName={selectedMerchant?.name || 'Selected Merchant'}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={receipt}
      />
    </div>
  );
}
