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
  Bank,
  BankAccount,
  AuditLog,
  BankCode,
  BankHealthStatus,
} from '../types/models.js';

// Precomputed bcrypt hashes from seed_data.sql:
// Password123! -> $2b$10$/yfPfVO3JbWBVbw8lj.p0.o/VMvM4Mb9emBAkjme3qw1vrBi/P2xC
// AdminPass123! -> $2b$10$.aEPML.jIGKXrLDMadNu7egRcdUNVeXrjSwkZPwTPit4OhOz/.Bve
// 1234 -> $2b$10$pgYwrwN1uaKa7UP1dmnnEuuzUaUMf1ZxAm57QhrHpOhC2nWGl.el.

export const INITIAL_USERS: User[] = [
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

// NOTE: Admin has NO WALLET per specification (Monitoring-only)
export const INITIAL_WALLETS: Wallet[] = [
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

export const INITIAL_BANKS: Bank[] = [
  {
    bank_id: 'bank-sbi-001',
    name: 'State Bank of India',
    code: 'SBI',
    ifsc_prefix: 'SBIN000',
    status: 'active',
    health_status: 'ONLINE',
    latency_ms: 220,
    logo_color: '#1d4ed8',
  },
  {
    bank_id: 'bank-hdfc-002',
    name: 'HDFC Bank',
    code: 'HDFC',
    ifsc_prefix: 'HDFC000',
    status: 'active',
    health_status: 'ONLINE',
    latency_ms: 180,
    logo_color: '#0284c7',
  },
  {
    bank_id: 'bank-icici-003',
    name: 'ICICI Bank',
    code: 'ICICI',
    ifsc_prefix: 'ICIC000',
    status: 'active',
    health_status: 'ONLINE',
    latency_ms: 190,
    logo_color: '#ea580c',
  },
  {
    bank_id: 'bank-axis-004',
    name: 'Axis Bank',
    code: 'AXIS',
    ifsc_prefix: 'UTIB000',
    status: 'active',
    health_status: 'ONLINE',
    latency_ms: 210,
    logo_color: '#be185d',
  },
  {
    bank_id: 'bank-pnb-005',
    name: 'Punjab National Bank',
    code: 'PNB',
    ifsc_prefix: 'PUNB000',
    status: 'active',
    health_status: 'ONLINE',
    latency_ms: 250,
    logo_color: '#ca8a04',
  },
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    account_id: 'acc-alex-001',
    user_id: '00000000-0000-0000-0000-000000000002',
    bank_id: 'bank-hdfc-002',
    bank_name: 'HDFC Bank',
    bank_code: 'HDFC',
    account_number: 'HDFC10098765432',
    ifsc_code: 'HDFC0004567',
    account_type: 'SAVINGS',
    balance: 50000.0,
    is_primary: true,
    verification_status: 'VERIFIED',
    created_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
  },
  {
    account_id: 'acc-priya-002',
    user_id: '00000000-0000-0000-0000-000000000003',
    bank_id: 'bank-sbi-001',
    bank_name: 'State Bank of India',
    bank_code: 'SBI',
    account_number: 'SBIN10045678901',
    ifsc_code: 'SBIN0001234',
    account_type: 'SAVINGS',
    balance: 40000.0,
    is_primary: true,
    verification_status: 'VERIFIED',
    created_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
  },
  {
    account_id: 'acc-rohit-003',
    user_id: '00000000-0000-0000-0000-000000000004',
    bank_id: 'bank-icici-003',
    bank_name: 'ICICI Bank',
    bank_code: 'ICICI',
    account_number: 'ICIC10023456789',
    ifsc_code: 'ICIC0007890',
    account_type: 'SAVINGS',
    balance: 15000.0,
    is_primary: true,
    verification_status: 'VERIFIED',
    created_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
  },
];

export const INITIAL_MERCHANTS: Merchant[] = [
  {
    merchant_id: '20000000-0000-0000-0000-000000000001',
    name: 'Amazon India',
    upi_id: 'amazonpay@upi',
    category: 'E-Commerce',
    bank_code: 'HDFC',
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    merchant_id: '20000000-0000-0000-0000-000000000002',
    name: 'Swiggy Foods',
    upi_id: 'swiggy@upi',
    category: 'Food & Dining',
    bank_code: 'ICICI',
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    merchant_id: '20000000-0000-0000-0000-000000000003',
    name: 'Flipkart Shopping',
    upi_id: 'flipkart@upi',
    category: 'E-Commerce',
    bank_code: 'AXIS',
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    merchant_id: '20000000-0000-0000-0000-000000000004',
    name: 'Netflix Entertainment',
    upi_id: 'netflix@upi',
    category: 'Entertainment',
    bank_code: 'SBI',
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    merchant_id: '20000000-0000-0000-0000-000000000005',
    name: 'Uber India Mobility',
    upi_id: 'uber@upi',
    category: 'Travel & Transit',
    bank_code: 'PNB',
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
];

class MemoryDatabase {
  users: Map<string, User> = new Map();
  wallets: Map<string, Wallet> = new Map(); // user_id -> Wallet
  banks: Map<string, Bank> = new Map(); // bank_id -> Bank
  bankAccounts: Map<string, BankAccount> = new Map(); // account_id -> BankAccount
  merchants: Map<string, Merchant> = new Map();
  payments: Map<string, Payment> = new Map();
  transactions: Map<string, Transaction> = new Map();
  refunds: Map<string, Refund> = new Map();
  notifications: Map<string, Notification> = new Map();
  auditLogs: Map<string, AuditLog> = new Map();

  constructor() {
    this.seed();
  }

  seed() {
    this.users.clear();
    this.wallets.clear();
    this.banks.clear();
    this.bankAccounts.clear();
    this.merchants.clear();
    this.payments.clear();
    this.transactions.clear();
    this.refunds.clear();
    this.notifications.clear();
    this.auditLogs.clear();

    INITIAL_USERS.forEach((u) => this.users.set(u.user_id, { ...u }));
    INITIAL_WALLETS.forEach((w) => this.wallets.set(w.user_id, { ...w }));
    INITIAL_BANKS.forEach((b) => this.banks.set(b.bank_id, { ...b }));
    INITIAL_BANK_ACCOUNTS.forEach((a) => this.bankAccounts.set(a.account_id, { ...a }));
    INITIAL_MERCHANTS.forEach((m) => this.merchants.set(m.merchant_id, { ...m }));

    // Welcome notification for Alex
    this.notifications.set('30000000-0000-0000-0000-000000000001', {
      notification_id: '30000000-0000-0000-0000-000000000001',
      user_id: '00000000-0000-0000-0000-000000000002',
      title: 'Welcome to PaySim Payment Gateway',
      message: 'Your simulated account has been registered. Bank details linked to HDFC Bank.',
      channel: 'IN_APP',
      type: 'SYSTEM',
      read_status: true,
      sent_at: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    });

    // Seed initial audit log
    this.auditLogs.set('audit-seed-001', {
      log_id: 'audit-seed-001',
      event_type: 'BANK_ACCOUNT_CREATED',
      actor_id: '00000000-0000-0000-0000-000000000001',
      actor_name: 'System Administrator',
      actor_role: 'admin',
      target_resource: 'SYSTEM',
      action: 'SYSTEM_BOOTSTRAP',
      details: { initializedBanks: 5, accountsProvisioned: 3 },
      created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
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

  // --- Banks ---
  getAllBanks(): Bank[] {
    return Array.from(this.banks.values());
  }

  findBankById(bankId: string): Bank | undefined {
    return this.banks.get(bankId);
  }

  findBankByCode(code: string): Bank | undefined {
    return Array.from(this.banks.values()).find(
      (b) => b.code.toUpperCase() === code.toUpperCase()
    );
  }

  updateBankHealth(code: string, status: BankHealthStatus): Bank {
    const bank = this.findBankByCode(code);
    if (!bank) throw new Error(`Bank with code ${code} not found`);
    bank.health_status = status;
    if (status === 'ONLINE') {
      bank.latency_ms = 180;
      bank.success_rate = 99.4;
    } else if (status === 'DEGRADED') {
      bank.latency_ms = 1850;
      bank.success_rate = 74.5;
    } else if (status === 'DOWN') {
      bank.latency_ms = 9999;
      bank.success_rate = 0.0;
    }
    return bank;
  }

  // --- Bank Accounts ---
  getAllBankAccounts(): BankAccount[] {
    return Array.from(this.bankAccounts.values());
  }

  getBankAccountsByUserId(userId: string): BankAccount[] {
    return Array.from(this.bankAccounts.values()).filter((a) => a.user_id === userId);
  }

  getPrimaryBankAccount(userId: string): BankAccount | undefined {
    return Array.from(this.bankAccounts.values()).find(
      (a) => a.user_id === userId && a.is_primary
    );
  }

  findBankAccountByNumber(accountNumber: string): BankAccount | undefined {
    return Array.from(this.bankAccounts.values()).find(
      (a) => a.account_number === accountNumber
    );
  }

  createBankAccount(account: BankAccount): BankAccount {
    this.bankAccounts.set(account.account_id, account);
    return account;
  }

  updateBankAccountBalance(accountId: string, delta: number): BankAccount {
    const acc = this.bankAccounts.get(accountId);
    if (!acc) throw new Error('Bank account not found');
    const newBalance = Math.round((acc.balance + delta) * 100) / 100;
    if (newBalance < 0) {
      throw new Error('Insufficient bank account balance');
    }
    acc.balance = newBalance;
    acc.updated_at = new Date().toISOString();
    return acc;
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
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
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

  // --- Audit Logs ---
  createAuditLog(log: AuditLog): AuditLog {
    this.auditLogs.set(log.log_id, log);
    return log;
  }

  getAllAuditLogs(): AuditLog[] {
    return Array.from(this.auditLogs.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
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
