'use client';

import React from 'react';
import { Sliders, CheckCircle, XCircle, Clock, ServerOff, Info } from 'lucide-react';
import { SimulatorOutcome } from '../lib/types';

interface SimulatorControlsProps {
  selectedOutcome: SimulatorOutcome | 'AUTO';
  onChange: (outcome: SimulatorOutcome | 'AUTO') => void;
}

export default function SimulatorControls({ selectedOutcome, onChange }: SimulatorControlsProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-sm mb-5 no-print">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <span>Switch Outcome Override</span>
        </div>
        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold border border-indigo-200">
          Simulation Controls
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        <button
          type="button"
          onClick={() => onChange('AUTO')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
            selectedOutcome === 'AUTO'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span>⚡ Auto</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('APPROVED')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
            selectedOutcome === 'APPROVED'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Approve</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('DECLINED')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
            selectedOutcome === 'DECLINED'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Decline</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('TIMEOUT')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
            selectedOutcome === 'TIMEOUT'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timeout</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('BANK_UNAVAILABLE')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
            selectedOutcome === 'BANK_UNAVAILABLE'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50'
          }`}
        >
          <ServerOff className="w-3.5 h-3.5" />
          <span>Bank Outage</span>
        </button>
      </div>
    </div>
  );
}
