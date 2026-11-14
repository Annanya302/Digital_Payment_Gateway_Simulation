'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  RotateCcw,
  Bell,
  Cpu,
  Lock,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-6 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-4 pb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-sm">
          <Cpu className="w-4 h-4 text-indigo-600" />
          <span>Interactive Fintech Engineering Simulation</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Digital Payment Gateway <br className="hidden sm:inline" />
          <span className="text-indigo-600">Simulation Platform</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
          An educational full-stack simulator demonstrating how digital payments are initiated,
          validated, authorized via simulated banking switches (UPI & Card networks), settled atomically,
          and audited in real-time.
        </p>

        {/* Boundary Notice */}
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 text-left shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Strict Educational Simulation:</strong> This environment connects to a simulated Bank and UPI switch. No real currency is transferred, and no real credit card or bank credentials are ever required.
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
          >
            <span>Launch Simulation Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm rounded-2xl shadow-sm transition-all"
          >
            Create Test Account
          </Link>
        </div>
      </section>

      {/* Quick Test Accounts Box */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Lock className="w-5 h-5 text-indigo-600" />
          <span>Pre-Seeded Demo Credentials</span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Use these ready-to-test accounts to immediately inspect the system:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-slate-900">Customer Account (Alex Rivera)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                Customer
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <p>Email: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">alex@example.com</code></p>
              <p>Password: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">Password123!</code></p>
              <p>Transaction PIN: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">1234</code></p>
              <p>Simulated Balance: <strong className="text-emerald-700">₹25,000.00</strong></p>
            </div>
            <Link
              href="/login?email=alex@example.com"
              className="mt-3 block text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Sign In as Alex
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-slate-900">Administrator Account</span>
              <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                Admin
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <p>Email: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">admin@paymentgateway.com</code></p>
              <p>Password: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">AdminPass123!</code></p>
              <p>Transaction PIN: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">1234</code></p>
              <p>Capability: <strong className="text-slate-800">Global Monitoring & Audit</strong></p>
            </div>
            <Link
              href="/login?email=admin@paymentgateway.com"
              className="mt-3 block text-center py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Sign In as Admin
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow Diagram & Steps */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Payment Lifecycle Workflow</h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            From checkout initiation to bank authorization switch and atomic ledger settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900">Initiate & Validate</h3>
            <p className="text-xs text-slate-500">
              User enters amount, selects Wallet, UPI, or Card mode, and enters secure 4-digit PIN.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900">Bank/UPI Switch</h3>
            <p className="text-xs text-slate-500">
              Request passes to simulated NPCI/Card rails, generating APPROVED, DECLINED, or TIMEOUT outcomes.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900">Atomic Settlement</h3>
            <p className="text-xs text-slate-500">
              If approved, balances are atomically debited/credited with strict negative-balance protection.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm">
              4
            </div>
            <h3 className="font-bold text-sm text-slate-900">Receipt & Alerts</h3>
            <p className="text-xs text-slate-500">
              Generates an immutable receipt, updates user ledger, and dispatches in-app notifications.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 text-center">Core Modules & Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">P2P & Merchant Payments</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transfer funds instantly to any registered user by email or mobile, or check out with verified simulated merchants like Amazon India, Swiggy, and Flipkart.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Automated Refunds</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Validate refund eligibility, prevent double-refunds or excessive refunds, and atomically restore refunded balances back into the user wallet.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Admin Audit Center</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Inspect total transaction volume, user registries, detailed failure reasons, simulator response codes, and system throughput.
            </p>
          </div>
        </div>
      </section>

      {/* Engineering Team Section */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-xl font-bold">Project Team & Contributions</h2>
            <p className="text-xs text-slate-400 mt-1">Digital Payment Gateway Simulation Engineering Team</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
            Academic Project 2026
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <p className="text-sm font-bold text-white">Ankur</p>
            <p className="text-xs text-indigo-400 mt-0.5">Coding and Testing</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <p className="text-sm font-bold text-white">Atul</p>
            <p className="text-xs text-indigo-400 mt-0.5">Coding and Testing</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <p className="text-sm font-bold text-white">Anamay</p>
            <p className="text-xs text-emerald-400 mt-0.5">Documentation</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <p className="text-sm font-bold text-white">Annanya</p>
            <p className="text-xs text-rose-400 mt-0.5">Design</p>
          </div>
        </div>
      </section>
    </div>
  );
}
