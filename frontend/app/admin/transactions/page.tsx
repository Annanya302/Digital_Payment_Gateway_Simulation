'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  History,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Building2,
  ArrowRight,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

export default function AdminTransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Inspector modal state
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadAdminTransactions();
  }, [user, statusFilter, page]);

  const loadAdminTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminTransactions({
        status: statusFilter,
        search,
        page,
        limit: 15,
      });
      setPayments(data.payments || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAdminTransactions();
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Transaction Monitor</h1>
          <p className="text-xs text-slate-500">
            Real-time audit log of all simulated authorizations, declines, timeouts, and settlement records
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference ID, payment ID, or failure reason..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold text-[11px]">Filter Status:</span>
          {['ALL', 'SUCCESS', 'FAILED', 'PENDING', 'REVERSED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading system transactions...</div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No transactions match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Sender</th>
                  <th className="py-3.5 px-4">Receiver / Merchant</th>
                  <th className="py-3.5 px-4">Bank Routing</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Switch Telemetry</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const isSuccess = p.status === 'SUCCESS';
                  const isPending = p.status === 'PENDING';
                  const isReversed = p.status === 'REVERSED';
                  const isFailed = p.status === 'FAILED';

                  return (
                    <tr key={p.payment_id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.reference_id}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {p.sender?.name || 'User'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {p.merchant?.name || p.receiver?.name || 'Counterparty'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="font-bold text-slate-700">{p.sender_bank_code || 'WALLET'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-700">{p.receiver_bank_code || 'MERCHANT'}</span>
                          {p.transfer_type && (
                            <span
                              className={`ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                p.transfer_type === 'INTRA_BANK'
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {p.transfer_type === 'INTRA_BANK' ? 'Intra' : 'Inter'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[11px] font-semibold text-slate-500">
                        {p.payment_mode}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">₹{p.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700'
                              : isPending
                              ? 'bg-amber-50 text-amber-700'
                              : isReversed
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-mono text-slate-600">
                          {p.simulated_outcome || (isSuccess ? 'APPROVED' : 'DECLINED')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspector Modal with 11-Stage Pipeline */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative border border-slate-100 my-8">
            <button
              onClick={() => setSelectedPayment(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                AUDIT
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Transaction Switch Audit Record</h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedPayment.reference_id}</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                <div>
                  <span className="text-slate-500">Internal Payment UUID:</span>
                  <div className="font-mono text-slate-800 text-[11px] font-bold">
                    {selectedPayment.payment_id}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Amount & Status:</span>
                  <div className="font-bold text-slate-900 text-[12px]">
                    ₹{selectedPayment.amount.toFixed(2)}{' '}
                    <span className="font-mono text-amber-700">({selectedPayment.status})</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                <div>
                  <span className="text-slate-500">Sender Profile:</span>
                  <div className="font-medium text-slate-800">
                    {selectedPayment.sender?.name || 'Customer'}{' '}
                    <span className="font-mono text-[11px] text-slate-500">
                      ({selectedPayment.sender_bank_code || 'Wallet'})
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Recipient / Merchant:</span>
                  <div className="font-medium text-slate-800">
                    {selectedPayment.merchant?.name || selectedPayment.receiver?.name || 'Counterparty'}{' '}
                    <span className="font-mono text-[11px] text-slate-500">
                      ({selectedPayment.receiver_bank_code || 'Merchant'})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Switch Authorization Outcome:</span>
                <span className="font-bold text-indigo-700 font-mono">
                  {selectedPayment.simulated_outcome || selectedPayment.status}
                </span>
              </div>

              {selectedPayment.reversal_status && (
                <div className="flex justify-between border-b border-slate-200 pb-2 bg-purple-50/50 p-2 rounded-lg">
                  <span className="text-purple-700 font-bold">Reversal Status:</span>
                  <span className="font-bold text-purple-800 font-mono">
                    {selectedPayment.reversal_status} ({selectedPayment.reversal_reason || 'Reversed by User'})
                  </span>
                </div>
              )}

              {selectedPayment.failure_reason && (
                <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                  <span className="text-rose-600 font-semibold">Recorded Failure Reason:</span>
                  <p className="bg-rose-50 text-rose-800 p-2 rounded-lg font-mono text-[11px]">
                    {selectedPayment.failure_reason}
                  </p>
                </div>
              )}

              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Timestamp:</span>
                <span>{new Date(selectedPayment.created_at).toISOString()}</span>
              </div>
            </div>

            {/* 11-Stage Pipeline Timeline */}
            {selectedPayment.pipeline_stages && selectedPayment.pipeline_stages.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>11-Stage Transaction Pipeline Trace</span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {selectedPayment.pipeline_stages.map((st: any) => {
                    const isSuccess = st.status === 'SUCCESS';
                    const isFailed = st.status === 'FAILED';
                    const isPending = st.status === 'PENDING';

                    return (
                      <div
                        key={st.stage}
                        className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between ${
                          isSuccess
                            ? 'bg-emerald-50/40 border-emerald-100'
                            : isFailed
                            ? 'bg-rose-50 border-rose-200'
                            : isPending
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isSuccess
                                ? 'bg-emerald-600 text-white'
                                : isFailed
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-300 text-slate-700'
                            }`}
                          >
                            {st.stage}
                          </span>
                          <div>
                            <span className="font-bold text-slate-800">{st.name}</span>
                            <p className="text-[10px] text-slate-500 font-mono">{st.details}</p>
                          </div>
                        </div>
                        <span
                          className={`font-mono text-[10px] font-bold uppercase ${
                            isSuccess
                              ? 'text-emerald-700'
                              : isFailed
                              ? 'text-rose-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {st.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedPayment(null)}
              className="w-full mt-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
