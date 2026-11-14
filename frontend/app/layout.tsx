import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import SimulationDisclaimer from '../components/SimulationDisclaimer';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export const metadata: Metadata = {
  title: 'ApexPay - Digital Payment Gateway Simulation',
  description:
    'An educational simulation of a digital payment gateway showcasing transaction lifecycles, UPI switches, card processing, and atomic wallet management.',
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
