'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, Wallet, BankAccount } from './types';
import { api } from './api';

export interface SimpleSocket {
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  disconnect: () => void;
}

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  bankAccount: BankAccount | null;
  bankAccounts: BankAccount[];
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  socket: SimpleSocket | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<SimpleSocket | null>(null);
  const socketRef = useRef<SimpleSocket | null>(null);
  const router = useRouter();

  // Socket initialization (self-contained fallback)
  useEffect(() => {
    const s: SimpleSocket = {
      emit: () => {},
      on: () => {},
      off: () => {},
      disconnect: () => {},
    };
    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // When user changes, join socket channel
  useEffect(() => {
    if (socketRef.current && user) {
      socketRef.current.emit('join_user', user.user_id);
      if (user.role === 'admin') {
        socketRef.current.emit('join_admin');
      }

      // Real-time balance update listener
      const handleBalanceUpdate = (data: any) => {
        if (data.walletBalance !== undefined) {
          setWallet((prev) => (prev ? { ...prev, balance: data.walletBalance } : prev));
        }
        if (data.bankBalance !== undefined) {
          setBankAccount((prev) => (prev ? { ...prev, balance: data.bankBalance } : prev));
          setBankAccounts((prev) =>
            prev.map((acc) =>
              acc.is_primary ? { ...acc, balance: data.bankBalance } : acc
            )
          );
        }
      };

      socketRef.current.on('balance_updated', handleBalanceUpdate);

      return () => {
        socketRef.current?.off('balance_updated', handleBalanceUpdate);
      };
    }
  }, [user]);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      api
        .getMe()
        .then((data) => {
          setUser(data.user);
          if (data.wallet) setWallet(data.wallet);
          if (data.bankAccount) setBankAccount(data.bankAccount);
          if (data.bankAccounts) setBankAccounts(data.bankAccounts);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
          setWallet(null);
          setBankAccount(null);
          setBankAccounts([]);
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await api.login({ email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    if (data.wallet) setWallet(data.wallet);
    if (data.bankAccount) setBankAccount(data.bankAccount);
    return data.user;
  };

  const register = async (payload: any): Promise<User> => {
    const data = await api.register(payload);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    if (data.wallet) setWallet(data.wallet);
    if (data.bankAccount) setBankAccount(data.bankAccount);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setWallet(null);
    setBankAccount(null);
    setBankAccounts([]);
    setToken(null);
    router.push('/login');
  };

  const refreshProfile = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      if (data.wallet) setWallet(data.wallet);
      if (data.bankAccount) setBankAccount(data.bankAccount);
      if (data.bankAccounts) setBankAccounts(data.bankAccounts);
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        bankAccount,
        bankAccounts,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        socket,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
