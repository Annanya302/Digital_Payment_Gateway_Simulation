'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Wallet,
  Smartphone,
  CreditCard,
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
import { Merchant, PaymentMode, SimulatorOutcome, PaymentReceipt } from '../../lib/types';
import SimulatorControls from '../../components/SimulatorControls';
import PinModal from '../../components/PinModal';
import ReceiptModal from '../../components/ReceiptModal';

export default function MerchantPaymentPage() {
  const { user, wallet, refreshProfile } = useAuth();
  const router = useRouter();

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [amount, setAmount] = useState('899');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('WALLET');
  const [simulatedOutcome, setSimulatedOutcome] = useState<SimulatorOutcome | 'AUTO'>('AUTO');

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
        setPageError(err.message || 'Merchant payment failed');
      }
    } finally {
      setIsAuthorizing(false);
    }
  };

  const selectedMerchant = merchants.find((m) => m.merchant_id === selectedMerchantId);

  const getMerchantIcon = (category: string) => {
    switch (category) {
      case 'Food & Dining':
        return <Utensils className="w-5 h-5 text-amber-600" />;
      case 'Entertainment':
        return <Tv className="w-5 h-5 text-rose-600" />;
      case 'Travel & Transit':
        return <Car className="w-5 h-5 text-blue-600" />;
      default:
        return <ShoppingBag className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pay a Merchant</h1>
        <p className="text-xs text-slate-500 mt-1">
          Simulated merchant checkout gateway supporting Wallet, UPI 2.0, and Card rails
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

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleInitiate} className="space-y-6">
          {/* Merchant Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Verified Merchant
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {merchants.map((m) => {
                const isSelected = m.merchant_id === selectedMerchantId;
                return (
                  <button
                    key={m.merchant_id}
                    type="button"
                    onClick={() => setSelectedMerchantId(m.merchant_id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        {getMerchantIcon(m.category)}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">{m.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{m.upi_id}</p>
                        <span className="inline-block mt-1 text-[9px] font-semibold text-slate-600 px-1.5 py-0.5 rounded bg-slate-100">
                          {m.category}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Checkout Amount (₹)
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
                placeholder="499.00"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-2">
              {['299', '499', '999', '1999'].map((amt) => (
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
                <Wallet className={`w-5 h-5 mb-2 ${paymentMode === 'WALLET' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <p className="font-bold text-xs text-slate-900">ApexPay Wallet</p>
                <p className="text-[11px] text-slate-500">₹{(wallet?.balance ?? 0).toFixed(2)}</p>
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
                <Smartphone className={`w-5 h-5 mb-2 ${paymentMode === 'UPI' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <p className="font-bold text-xs text-slate-900">Simulated UPI</p>
                <p className="text-[11px] text-slate-500">NPCI Switch</p>
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
                <CreditCard className={`w-5 h-5 mb-2 ${paymentMode === 'CARD' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <p className="font-bold text-xs text-slate-900">Simulated Card</p>
                <p className="text-[11px] text-slate-500">Visa / RuPay</p>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <span>Authorize Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSubmit={handlePinSubmit}
        amount={parseFloat(amount) || 0}
        paymentMode={paymentMode}
        recipientName={selectedMerchant?.name || 'Merchant'}
        isLoading={isAuthorizing}
        error={pinError}
      />

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
