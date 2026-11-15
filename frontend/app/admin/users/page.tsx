'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, ArrowLeft, Shield, User, Wallet, Building2, Search } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    api
      .getAdminUsers()
      .then((data) => setUsersList(data || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [user]);

  if (!user || user.role !== 'admin') return null;

  const filteredUsers = usersList.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.mobile.toLowerCase().includes(q) ||
      (u.bankAccounts &&
        u.bankAccounts.some((b: any) =>
          b.bank_code.toLowerCase().includes(q) || b.account_number.includes(q)
        ))
    );
  });

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registered User Directory</h1>
          <p className="text-xs text-slate-500">
            System-wide registry of active customer accounts, wallets, and linked simulated bank accounts
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, email, mobile, or bank account number..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading user directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No users match your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">User Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Simulated Bank Accounts</th>
                  <th className="py-3.5 px-4">Wallet Balance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const primaryBank = u.bankAccounts?.[0];

                  return (
                    <tr key={u.user_id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{u.mobile}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="text-[11px] text-slate-400 italic">None (Admin Isolation)</span>
                        ) : primaryBank ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 font-bold text-slate-800 text-[11px]">
                              <Building2 className="w-3 h-3 text-indigo-600" />
                              <span>{primaryBank.bank_code}</span>
                              <span className="font-mono text-slate-500 font-normal">
                                (...{primaryBank.account_number.slice(-4)})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Bal: ₹{primaryBank.balance.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">No account linked</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {isAdmin ? (
                          <span className="text-[11px] text-slate-400 font-normal italic">
                            N/A (Monitoring Only)
                          </span>
                        ) : (
                          `₹${(u.walletBalance ?? 0).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}`
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
