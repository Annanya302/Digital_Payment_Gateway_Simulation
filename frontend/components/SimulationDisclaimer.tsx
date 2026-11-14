import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function SimulationDisclaimer() {
  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 border-b border-amber-600 no-print">
      <AlertCircle className="w-4 h-4 shrink-0 text-slate-950" />
      <span>
        <strong>ACADEMIC SIMULATION:</strong> This is an educational demonstration. No real banks, real UPI handles, or real funds are processed.
      </span>
    </div>
  );
}
