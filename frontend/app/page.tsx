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
  Building2,
  Activity,
  ArrowLeftRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-6 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-4 pb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-sm">
          <Cpu className="w-4 h-4 text-indigo-600" />
          <span>PaySim • Multi-Bank Payment Gateway & Transaction Processing Simulator</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          PaySim <br className="hidden sm:inline" />
          <span className="text-indigo-600">Payment Gateway Platform</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
          An enterprise-grade full-stack banking & payment gateway simulation demonstrating how digital transactions are
          initiated, authenticated via demo PIN, routed across multi-bank switches (SBI, HDFC, ICICI, Axis, PNB), atomically settled, and audited in real-time.
        </p>

        {/* Boundary Notice */}
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 text-left shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Strict Educational Simulation:</strong> This environment connects to simulated core-banking systems and NPCI/Card rails. No real currency is transferred, and no real credit card or bank credentials are ever required. All accounts start with ₹0.00.
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
            Register New Account (₹0 Demo)
          </Link>
        </div>
      </section>

      {/* Simulated Core Banks Banner */}
      <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Simulated Banking Switch Network</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Simulates interbank (NEFT/IMPS/UPI) and intra-bank transactions across 5 major core banking systems
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          {[
            { name: 'State Bank of India', code: 'SBI', ifsc: 'SBIN0001234' },
            { name: 'HDFC Bank', code: 'HDFC', ifsc: 'HDFC0004567' },
            { name: 'ICICI Bank', code: 'ICICI', ifsc: 'ICIC0007890' },
            { name: 'Axis Bank', code: 'AXIS', ifsc: 'UTIB0002468' },
            { name: 'Punjab National Bank', code: 'PNB', ifsc: 'PUNB0001357' },
          ].map((b) => (
            <div key={b.code} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center mx-auto mb-2">
                {b.code}
              </span>
              <p className="font-bold text-slate-900 text-xs">{b.name}</p>
              <p className="font-mono text-[10px] text-slate-400 mt-0.5">{b.ifsc}</p>
            </div>
          ))}
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
                Customer (HDFC)
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <p>Email: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">alex@example.com</code></p>
              <p>Password: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">Password123!</code></p>
              <p>Transaction PIN: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">1234</code></p>
              <p>Simulated Balance: <strong className="text-emerald-700">₹25,000.00</strong> (HDFC Bank: ₹50,000.00)</p>
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
                Admin (Monitoring Only)
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <p>Email: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">admin@paymentgateway.com</code></p>
              <p>Password: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">AdminPass123!</code></p>
              <p>Transaction PIN: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">1234</code></p>
              <p>Capability: <strong className="text-slate-800">Global Monitoring & Bank Switch Controls</strong></p>
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

      {/* 11-Stage Processing Pipeline Workflow */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900">11-Stage Payment Processing Engine</h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            PaySim enforces an explicit 11-stage pipeline for every payment with cryptographic logging and atomic double-entry bookkeeping.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { num: 1, title: 'Payment Initiation', desc: 'Client submits amount, rails, recipient & idempotency token.' },
            { num: 2, title: 'Request Validation', desc: 'Validates positive amount, payment mode schema, and limits.' },
            { num: 3, title: 'Recipient Verification', desc: 'Verifies recipient user or verified merchant exists and is active.' },
            { num: 4, title: 'Demo PIN Authentication', desc: 'Verifies bcrypt-hashed 4-digit transaction PIN.' },
            { num: 5, title: 'Gateway Processing', desc: 'Allocates unique reference ID and initiates gateway processing.' },
            { num: 6, title: 'Bank Switch Routing', desc: 'Routes to sender & receiver core banks (SBI, HDFC, ICICI, etc.).' },
            { num: 7, title: 'Balance Verification', desc: 'Ensures sender has sufficient funds without trusting frontend.' },
            { num: 8, title: 'Authorization', desc: 'Simulated bank switch grants authorization or declines.' },
            { num: 9, title: 'Atomic Debit & Credit', desc: 'Atomic ledger updates balances without loss or duplication.' },
            { num: 10, title: 'Status Update', desc: 'Finalizes transaction status (SUCCESS, FAILED, PENDING).' },
            { num: 11, title: 'Real-Time Notification', desc: 'Dispatches Socket.IO events to sender, receiver & admin.' },
          ].map((st) => (
            <div key={st.num} className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-start gap-3">
              <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                {st.num}
              </span>
              <div>
                <h3 className="font-bold text-xs text-slate-900">{st.title}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{st.desc}</p>
              </div>
            </div>
          ))}
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
            <h3 className="font-bold text-base text-slate-900">Multi-Bank Routing & P2P</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transfer funds across SBI, HDFC, ICICI, Axis Bank, and PNB accounts with automated intra-bank vs inter-bank detection and IFSC verification.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Controlled Reversals & Refunds</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Controlled transaction reversals (REVERSAL ledger entry) when debits occur without credit, plus merchant automated refund workflows.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Monitoring-Only Admin Center</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Strictly isolated admin dashboard with database-driven metrics, bank switch health toggles, hourly transaction volume, and immutable audit logs.
            </p>
          </div>
        </div>
      </section>

      {/* Engineering Team Section */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-xl font-bold">Project Team & Contributions</h2>
            <p className="text-xs text-slate-400 mt-1">PaySim Engineering Team • Academic Project 2026</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
            PaySim v2.0
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
