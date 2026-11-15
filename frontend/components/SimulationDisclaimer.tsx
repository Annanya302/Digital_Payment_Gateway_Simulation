import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function SimulationDisclaimer() {
  return (
    <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs font-mono flex items-center justify-center gap-2 border-b border-slate-800 no-print">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      <span className="text-slate-200 font-semibold">Sandbox Simulation</span>
      <span className="text-slate-500">•</span>
      <span className="text-slate-400">Mock UPI & Banking Switch Rails</span>
    </div>
  );
}
