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
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
          {['ALL', 'SUCCESS', 'FAILED'].map((st) => (
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
                  return (
                    <tr key={p.payment_id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.reference_id}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {p.sender?.name || 'User'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {p.merchant?.name || p.receiver?.name || 'Counterparty'}
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[11px] font-semibold text-slate-500">
                        {p.payment_mode}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">₹{p.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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

      {/* Inspector Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-100">
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
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Internal Payment UUID:</span>
                <span className="font-mono text-slate-800 text-[11px]">{selectedPayment.payment_id}</span>
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Amount & Status:</span>
                <span className="font-bold text-slate-900">
                  ₹{selectedPayment.amount.toFixed(2)} ({selectedPayment.status})
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Sender Profile:</span>
                <span className="font-medium text-slate-800">
                  {selectedPayment.sender?.name} ({selectedPayment.sender?.email})
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Recipient / Merchant:</span>
                <span className="font-medium text-slate-800">
                  {selectedPayment.merchant?.name || selectedPayment.receiver?.name}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Switch Authorization Outcome:</span>
                <span className="font-bold text-indigo-700 font-mono">
                  {selectedPayment.simulated_outcome || selectedPayment.status}
                </span>
              </div>

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

            <button
              onClick={() => setSelectedPayment(null)}
              className="w-full mt-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
