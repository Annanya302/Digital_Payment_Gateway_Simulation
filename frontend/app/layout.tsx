import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import SimulationDisclaimer from '../components/SimulationDisclaimer';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export const metadata: Metadata = {
  title: 'PaySim - Multi-Bank Payment Gateway & Transaction Processing Simulator',
  description:
    'An educational simulation of a multi-bank payment gateway showcasing 11-stage transaction lifecycles, core banking switches (SBI, HDFC, ICICI, Axis, PNB), atomic ledgers, and real-time audit telemetry.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-slate-800 bg-slate-50 min-h-screen flex flex-col">
        <AuthProvider>
          <SimulationDisclaimer />
          <Navbar />
          <div className="flex-1 flex max-w-7xl w-full mx-auto">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 min-w-0 overflow-y-auto">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
