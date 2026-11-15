'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h2 className="text-2xl font-black text-slate-900">404 - Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm">
        The requested simulated endpoint or page does not exist on this payment gateway.
      </p>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}