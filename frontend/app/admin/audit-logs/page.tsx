'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  User,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';
import { AuditLogItem } from '../../../lib/types';

export default function AdminAuditLogsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadLogs();
  }, [user, eventTypeFilter, page]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminAuditLogs({
        eventType: eventTypeFilter,
        page,
        limit: 20,
      });
      setLogs(res.logs || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  const eventTypes = [
    { label: 'All Events', value: '' },
    { label: 'Auth Logins', value: 'AUTH_LOGIN' },
    { label: 'Registrations', value: 'AUTH_REGISTER' },
    { label: 'Payments Initiated', value: 'PAYMENT_INITIATED' },
    { label: 'Payments Completed', value: 'PAYMENT_COMPLETED' },
    { label: 'Payments Failed', value: 'PAYMENT_FAILED' },
    { label: 'Reversals', value: 'PAYMENT_REVERSED' },
    { label: 'Bank Switch Status', value: 'BANK_HEALTH_TOGGLED' },
  ];

  const getEventBadge = (type: string) => {
    if (type.includes('FAILED')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (type.includes('REVERSED') || type.includes('RECONCILIATION')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (type.includes('AUTH')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (type.includes('BANK')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <span>Immutable System Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500">
            Cryptographically recorded telemetry of authentication, transactional mutations, and gateway switch events
          </p>
        </div>

        <button
          onClick={() => loadLogs()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter and Overview Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1">
            Filter Event:
          </span>
          {eventTypes.map((et) => (
            <button
              key={et.value}
              onClick={() => {
                setEventTypeFilter(et.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                eventTypeFilter === et.value
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading audit trail entries...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No audit log records match this query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Event Classification</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Target Resource</th>
                  <th className="py-3.5 px-4">Action Summary</th>
                  <th className="py-3.5 px-4">Details Summary</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  return (
                    <tr key={log.log_id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border ${getEventBadge(
                            log.event_type
                          )}`}
                        >
                          {log.event_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 text-[11px]">
                        <span>{log.actor_name}</span>{' '}
                        <span className="text-[10px] font-mono text-slate-400">({log.actor_role})</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                        {log.target_resource}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium text-[11px]">
                        {log.action}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate font-mono text-[10px]">
                        {log.details ? JSON.stringify(log.details) : 'None'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Payload</span>
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
              Page {page} of {totalPages} (Total records: {totalCount})
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Detail Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Audit Record
                </span>
                <h3 className="font-bold text-slate-900 text-sm font-mono">{selectedLog.log_id}</h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border ${getEventBadge(
                  selectedLog.event_type
                )}`}
              >
                {selectedLog.event_type}
              </span>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-800">{new Date(selectedLog.created_at).toISOString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Initiating Actor:</span>
                <span className="font-mono text-slate-800">
                  {selectedLog.actor_name} ({selectedLog.actor_role}, ID: {selectedLog.actor_id})
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Target Resource:</span>
                <span className="font-mono text-slate-800">{selectedLog.target_resource}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Action:</span>
                <span className="font-mono text-slate-800">{selectedLog.action}</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-600 mb-1.5">Payload Data (JSON):</p>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
