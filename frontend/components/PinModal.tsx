'use client';

import React, { useState, useEffect } from 'react';
import { Lock, X, AlertTriangle } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  amount: number;
  paymentMode?: string;
  recipientName: string;
  isLoading?: boolean;
  error?: string | null;
}

export default function PinModal({
  isOpen,
  onClose,
  onSubmit,
  amount,
  paymentMode = 'WALLET',
  recipientName,
  isLoading = false,
  error = null,
}: PinModalProps) {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (pin.length === 4) {
      onSubmit(pin);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative border border-slate-100">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {amount > 0 ? 'Authorize Payment' : 'Enter UPI / Bank PIN'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {amount > 0 ? (
              <>
                Paying <strong className="text-slate-900">₹{amount.toFixed(2)}</strong> to{' '}
                <strong className="text-slate-900">{recipientName}</strong> via{' '}
                <span className="uppercase font-semibold">{paymentMode}</span>
              </>
            ) : (
              <>
                Verify 4-digit PIN to reveal balance for{' '}
                <strong className="text-slate-900">{recipientName}</strong>
              </>
            )}
          </p>

          {/* Masked PIN dots */}
          <div className="flex justify-center items-center gap-3 my-6">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    isFilled
                      ? 'bg-indigo-600 border-indigo-600 scale-110'
                      : 'border-slate-300 bg-slate-50'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Simulated PIN Pad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                disabled={isLoading}
                className="py-3 text-lg font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              disabled={isLoading}
              className="py-3 text-xs font-semibold text-slate-400 hover:text-slate-700 rounded-xl"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              disabled={isLoading}
              className="py-3 text-lg font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ⌫
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={pin.length !== 4 || isLoading}
            className={`w-full py-3 rounded-2xl font-bold text-sm transition-all shadow-md ${
              pin.length === 4 && !isLoading
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isLoading ? 'Authorizing with Bank Simulator...' : 'Confirm & Authenticate'}
          </button>

          <p className="text-[11px] text-slate-400 mt-3">
            Demo Transaction PIN: <code className="font-bold text-slate-600">1234</code>
          </p>
        </div>
      </div>
    </div>
  );
}
