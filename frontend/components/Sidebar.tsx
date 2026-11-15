'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  SendHorizontal,
  Store,
  History,
  RotateCcw,
  Bell,
  ShieldAlert,
  Users,
  Activity,
  CreditCard,
  FileText,
  Building2,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const customerNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Wallet & Bank', href: '/wallet', icon: Wallet },
    { label: 'Send Money', href: '/send', icon: SendHorizontal },
    { label: 'Pay Merchant', href: '/merchant', icon: Store },
    { label: 'Transaction History', href: '/transactions', icon: History },
    { label: 'Refunds', href: '/refunds', icon: RotateCcw },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ];

  const adminNav = [
    { label: 'Admin Overview', href: '/admin', icon: Activity },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Transaction Monitor', href: '/admin/transactions', icon: History },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
    { label: 'Bank Switches', href: '/admin/banks', icon: Building2 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 min-h-[calc(100vh-4rem)] p-4 no-print">
      {/* Navigation Groups */}
      <div className="space-y-6 flex-1">
        {/* Customer Navigation (Hidden for Admin: Admin is strictly monitoring-only) */}
        {!isAdmin && (
          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Customer Services
            </p>
            <nav className="space-y-1">
              {customerNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Administrator Navigation */}
        {isAdmin && (
          <div>
            <p className="px-3 text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Monitoring Operations</span>
            </p>
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Simulator Mode Card at bottom of sidebar */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs mb-1">
          <CreditCard className="w-4 h-4" />
          <span>PaySim Multi-Bank Active</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">
          Simulating SBI, HDFC, ICICI, Axis & PNB. Default PIN: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-bold">1234</code>
        </p>
      </div>
    </aside>
  );
}
