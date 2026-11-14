'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  History,
  Search,
  Filter,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { TransactionItem, PaymentReceipt } from '../../lib/types';
import ReceiptModal from '../../components/ReceiptModal';

export default function TransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [user, statusFilter, typeFilter, page]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTransactions({
        status: statusFilter,
        type: typeFilter,
        search,
        page,
        limit: 10,
      });
      setTransactions(data.transactions || []);
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
    loadTransactions();
  };

  const handleOpenReceipt = async (t: TransactionItem) => {
    try {
      const details = await api.getTransactionById(t.transaction_id);
      setSelectedReceipt(details.receipt);
      setIsReceiptOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transaction History</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete searchable ledger of simulated payments, transfers, and refunds
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by transaction reference or ID..."
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

        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px] font-semibold mr-1">Status:</span>
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
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px] font-semibold mr-1">Type:</span>
            {['ALL', 'DEBIT', 'CREDIT', 'REFUND'].map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => {
                  setTypeFilter(tp);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  typeFilter === tp
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No transactions match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Counterparty</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status & Details</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => {
                  const isDebit = t.type === 'DEBIT';
                  const isSuccess = t.status === 'SUCCESS';

                  return (
                    <tr key={t.transaction_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {t.reference_id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {t.counterparty || 'External User'}
                      </td>
                      <td className="py-3.5 px-4 uppercase font-semibold text-[11px] text-slate-500">
                        {t.paymentMode || 'WALLET'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold inline-flex items-center gap-1 ${
                            isDebit ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isDebit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                          <span>{t.type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {isDebit ? '-' : '+'}₹{t.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span
                            className={`inline-block w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {t.status}
                          </span>
                          {t.failure_reason && (
                            <span className="text-[10px] text-rose-600 mt-0.5 line-clamp-1 max-w-xs">
                              {t.failure_reason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(t.created_at).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenReceipt(t)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
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

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
        onRequestRefund={(paymentId) => {
          router.push(`/refunds?paymentId=${paymentId}`);
        }}
      />
    </div>
  );
}
