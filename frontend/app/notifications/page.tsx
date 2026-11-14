'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  XCircle,
  Check,
  AlertCircle,
  RotateCcw,
  Info,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { NotificationItem } from '../../lib/types';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, read_status: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_RECEIVED':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'PAYMENT_FAILED':
        return <XCircle className="w-5 h-5 text-rose-600" />;
      case 'REFUND_SUCCESS':
        return <RotateCcw className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>In-App Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time simulated alerts for payments, debits, credits, and refunds
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>You have no notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.notification_id}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                !n.read_status ? 'bg-indigo-50/30' : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                {getNotificationIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-xs font-bold text-slate-900">{n.title}</h3>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(n.sent_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>

              {!n.read_status && (
                <button
                  onClick={() => handleMarkRead(n.notification_id)}
                  className="shrink-0 p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
