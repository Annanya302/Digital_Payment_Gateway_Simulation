import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './env.js';
import {
  User,
  Wallet,
  Merchant,
  Payment,
  Transaction,
  Refund,
  Notification,
  SafeUser,
} from '../types/models.js';

// Precomputed bcrypt hashes from seed_data.sql:
// Password123! -> $2b$10$/yfPfVO3JbWBVbw8lj.p0.o/VMvM4Mb9emBAkjme3qw1vrBi/P2xC
// AdminPass123! -> $2b$10$.aEPML.jIGKXrLDMadNu7egRcdUNVeXrjSwkZPwTPit4OhOz/.Bve
// 1234 -> $2b$10$pgYwrwN1uaKa7UP1dmnnEuuzUaUMf1ZxAm57QhrHpOhC2nWGl.el.

const INITIAL_USERS: User[] = [
  {
    user_id: '00000000-0000-0000-0000-000000000001',
    name: 'System Administrator',
    email: 'admin@paymentgateway.com',
    mobile: '+919876543210',
    password_hash: '$2b$10$.aEPML.jIGKXrLDMadNu7egRcdUNVeXrjSwkZPwTPit4OhOz/.Bve',
    pin_hash: '$2b$10$pgYwrwN1uaKa7UP1dmnnEuuzUaUMf1ZxAm57QhrHpOhC2nWGl.el.',
    role: 'admin',
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    user_id: '00000000-0000-0000-0000-000000000002',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    mobile: '+919876543211',
    password_hash: '$2b$10$/yfPfVO3JbWBVbw8lj.p0.o/VMvM4Mb9emBAkjme3qw1vrBi/P2xC',
    pin_hash: '$2b$10$pgYwrwN1uaKa7UP1dmnnEuuzUaUMf1ZxAm57QhrHpOhC2nWGl.el.',
    role: 'customer',
    status: 'active',
    created_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
  },
  {
    user_id: '00000000-0000-0000-0000-000000000003',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    mobile: '+919876543212',
    password_hash: '$2b$10$/yfPfVO3JbWBVbw8lj.p0.o/VMvM4Mb9emBAkjme3qw1vrBi/P2xC',
    pin_hash: '$2b$10$pgYwrwN1uaKa7UP1dmnnEuuzUaUMf1ZxAm57QhrHpOhC2nWGl.el.',
    role: 'customer',
    status: 'active',
    created_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
  },
  {
    user_id: '00000000-0000-0000-0000-000000000004',
    name: 'Rohit Verma',
    email: 'rohit@example.com',
    mobile: '+919876543213',
    password_hash: '$2b$10$/yfPfVO3JbWBVbw8lj.p0.o/VMvM4Mb9emBAkjme3qw1vrBi/P2xC',
    pin_hash: '$2b$10$pgYwrwN1uaKa7UP1dmnnEuuzUaUMf1ZxAm57QhrHpOhC2nWGl.el.',
    role: 'customer',
    status: 'active',
    created_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
  },
];

const INITIAL_WALLETS: Wallet[] = [
  {
    wallet_id: '10000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000001',
    balance: 100000.0,
    currency: 'INR',
    daily_limit: 100000.0,
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    wallet_id: '10000000-0000-0000-0000-000000000002',
    user_id: '00000000-0000-0000-0000-000000000002',
    balance: 25000.0,
    currency: 'INR',
    daily_limit: 50000.0,
    status: 'active',
    created_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
  },
  {
    wallet_id: '10000000-0000-0000-0000-000000000003',
    user_id: '00000000-0000-0000-0000-000000000003',
    balance: 18500.0,
    currency: 'INR',
    daily_limit: 50000.0,
    status: 'active',
    created_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
  },
  {
    wallet_id: '10000000-0000-0000-0000-000000000004',
    user_id: '00000000-0000-0000-0000-000000000004',
    balance: 5000.0,
    currency: 'INR',
    daily_limit: 50000.0,
    status: 'active',
    created_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
  },
];

const INITIAL_MERCHANTS: Merchant[] = [
  {
    merchant_id: '20000000-0000-0000-0000-000000000001',
    name: 'Amazon India',
    upi_id: 'amazonpay@upi',
    category: 'E-Commerce',
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    merchant_id: '20000000-0000-0000-0000-000000000002',
    name: 'Swiggy Foods',
    upi_id: 'swiggy@upi',
    category: 'Food & Dining',
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    merchant_id: '20000000-0000-0000-0000-000000000003',
    name: 'Flipkart Shopping',
    upi_id: 'flipkart@upi',
    category: 'E-Commerce',
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    merchant_id: '20000000-0000-0000-0000-000000000004',
    name: 'Netflix Entertainment',
    upi_id: 'netflix@upi',
    category: 'Entertainment',
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    merchant_id: '20000000-0000-0000-0000-000000000005',
    name: 'Uber India Mobility',
    upi_id: 'uber@upi',
    category: 'Travel & Transit',
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
];

class MemoryDatabase {
  users: Map<string, User> = new Map();
  wallets: Map<string, Wallet> = new Map(); // user_id -> Wallet
  merchants: Map<string, Merchant> = new Map();
  payments: Map<string, Payment> = new Map();
  transactions: Map<string, Transaction> = new Map();
  refunds: Map<string, Refund> = new Map();
  notifications: Map<string, Notification> = new Map();

  constructor() {
    this.seed();
  }

  seed() {
    this.users.clear();
    this.wallets.clear();
    this.merchants.clear();
    this.payments.clear();
    this.transactions.clear();
    this.refunds.clear();
    this.notifications.clear();

    INITIAL_USERS.forEach((u) => this.users.set(u.user_id, { ...u }));
    INITIAL_WALLETS.forEach((w) => this.wallets.set(w.user_id, { ...w }));
    INITIAL_MERCHANTS.forEach((m) => this.merchants.set(m.merchant_id, { ...m }));

    // Initial welcome notification for Alex
    this.notifications.set('30000000-0000-0000-0000-000000000001', {
      notification_id: '30000000-0000-0000-0000-000000000001',
      user_id: '00000000-0000-0000-0000-000000000002',
      title: 'Welcome to Payment Gateway Simulation',
      message: 'Your wallet has been credited with ₹25,000.00 simulated demo funds.',
      channel: 'IN_APP',
      type: 'SYSTEM',
      read_status: true,
      sent_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    });
  }

  // --- Users ---
  findUserById(userId: string): User | undefined {
    return this.users.get(userId);
  }

  findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  findUserByMobile(mobile: string): User | undefined {
    return Array.from(this.users.values()).find(
      (u) => u.mobile.replace(/[\s-]/g, '') === mobile.replace(/[\s-]/g, '')
    );
  }

  findUserByEmailOrMobile(identifier: string): User | undefined {
    return this.findUserByEmail(identifier) || this.findUserByMobile(identifier);
  }

  createUser(user: User): User {
    this.users.set(user.user_id, user);
    return user;
  }

  getAllUsers(): SafeUser[] {
    return Array.from(this.users.values()).map(
      ({ password_hash, pin_hash, ...rest }) => rest
    );
  }

  // --- Wallets ---
  getWalletByUserId(userId: string): Wallet | undefined {
    return this.wallets.get(userId);
  }

  createWallet(wallet: Wallet): Wallet {
    this.wallets.set(wallet.user_id, wallet);
    return wallet;
  }

  updateWalletBalance(userId: string, delta: number): Wallet {
    const wallet = this.wallets.get(userId);
    if (!wallet) throw new Error('Wallet not found for user');
    const newBalance = Math.round((wallet.balance + delta) * 100) / 100;
    if (newBalance < 0) {
      throw new Error('Insufficient wallet balance');
    }
    wallet.balance = newBalance;
    wallet.updated_at = new Date().toISOString();
    return wallet;
  }

  // --- Merchants ---
  getAllMerchants(): Merchant[] {
    return Array.from(this.merchants.values()).filter((m) => m.status === 'active');
  }

  findMerchantById(merchantId: string): Merchant | undefined {
    return this.merchants.get(merchantId);
  }

  findMerchantByUpiId(upiId: string): Merchant | undefined {
    return Array.from(this.merchants.values()).find(
      (m) => m.upi_id.toLowerCase() === upiId.toLowerCase()
    );
  }

  // --- Payments ---
  findPaymentById(paymentId: string): Payment | undefined {
    return this.payments.get(paymentId);
  }

  findPaymentByIdempotencyKey(key: string): Payment | undefined {
    return Array.from(this.payments.values()).find((p) => p.idempotency_key === key);
  }

  findPaymentByReference(referenceId: string): Payment | undefined {
    return Array.from(this.payments.values()).find((p) => p.reference_id === referenceId);
  }

  createPayment(payment: Payment): Payment {
    this.payments.set(payment.payment_id, payment);
    return payment;
  }

  updatePayment(paymentId: string, updates: Partial<Payment>): Payment {
    const existing = this.payments.get(paymentId);
    if (!existing) throw new Error('Payment not found');
    const updated = { ...existing, ...updates };
    this.payments.set(paymentId, updated);
    return updated;
  }

  getAllPayments(): Payment[] {
    return Array.from(this.payments.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // --- Transactions ---
  createTransaction(txn: Transaction): Transaction {
    this.transactions.set(txn.transaction_id, txn);
    return txn;
  }

  findTransactionById(txnId: string): Transaction | undefined {
    return this.transactions.get(txnId);
  }

  getTransactionsByUserId(userId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter((t) => t.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // --- Refunds ---
  createRefund(refund: Refund): Refund {
    this.refunds.set(refund.refund_id, refund);
    return refund;
  }

  findRefundById(refundId: string): Refund | undefined {
    return this.refunds.get(refundId);
  }

  getRefundsByOriginalPaymentId(paymentId: string): Refund[] {
    return Array.from(this.refunds.values()).filter(
      (r) => r.original_payment_id === paymentId
    );
  }

  getRefundsByUserId(userId: string): Refund[] {
    return Array.from(this.refunds.values())
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getAllRefunds(): Refund[] {
    return Array.from(this.refunds.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // --- Notifications ---
  createNotification(notif: Notification): Notification {
    this.notifications.set(notif.notification_id, notif);
    return notif;
  }

  getNotificationsByUserId(userId: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
  }

  markNotificationAsRead(notificationId: string, userId: string): boolean {
    const notif = this.notifications.get(notificationId);
    if (notif && notif.user_id === userId) {
      notif.read_status = true;
      return true;
    }
    return false;
  }

  markAllNotificationsAsRead(userId: string): number {
    let count = 0;
    this.notifications.forEach((n) => {
      if (n.user_id === userId && !n.read_status) {
        n.read_status = true;
        count++;
      }
    });
    return count;
  }
}

// Global Singleton Instance
export const db = new MemoryDatabase();

// Optional Supabase client if configured
let supabaseInstance: SupabaseClient | null = null;
if (config.supabaseUrl && config.supabaseKey) {
  try {
    supabaseInstance = createClient(config.supabaseUrl, config.supabaseKey);
    console.log('[Database] Supabase client initialized with remote endpoint');
  } catch (err) {
    console.warn('[Database] Failed to initialize Supabase client, using local store', err);
  }
}

export const supabase = supabaseInstance;
