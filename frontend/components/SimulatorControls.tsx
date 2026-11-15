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
    <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm mb-6 no-print">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2 text-indigo-950 font-semibold text-sm">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>PaySim Multi-Bank Switch Simulator Testing Panel</span>
        </div>
        <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium border border-indigo-200">
          Evaluator Controls
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Select a deterministic switch outcome to simulate realistic banking rails, timeouts, or core bank outages:
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          type="button"
          onClick={() => onChange('AUTO')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
            selectedOutcome === 'AUTO'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span>⚡ Auto</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('APPROVED')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
            selectedOutcome === 'APPROVED'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Approved</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('DECLINED')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
            selectedOutcome === 'DECLINED'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200'
              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Declined</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('TIMEOUT')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
            selectedOutcome === 'TIMEOUT'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-200'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timeout</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('BANK_UNAVAILABLE')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
            selectedOutcome === 'BANK_UNAVAILABLE'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
              : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
          }`}
        >
          <ServerOff className="w-3.5 h-3.5" />
          <span>Bank Down</span>
        </button>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <span>
          Triggers: Amounts ending in <code className="text-slate-600 font-semibold">.02</code> = Decline, <code className="text-slate-600 font-semibold">.03</code> = Timeout, <code className="text-slate-600 font-semibold">.04</code> = Bank Unavailable.
        </span>
      </div>
    </div>
  );
}
