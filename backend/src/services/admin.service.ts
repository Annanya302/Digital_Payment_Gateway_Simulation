import { db } from '../config/database.js';
import { auditService } from './audit.service.js';

export class AdminService {
  public async getDashboardStats() {
    const users = db.getAllUsers();
    const bankAccounts = db.getAllBankAccounts();
    const payments = db.getAllPayments();
    const transactions = db.getAllTransactions();
    const refunds = db.getAllRefunds();
    const banks = db.getAllBanks();

    const successPayments = payments.filter((p) => p.status === 'SUCCESS');
    const failedPayments = payments.filter((p) => p.status === 'FAILED');
    const pendingPayments = payments.filter((p) => p.status === 'PENDING');
    const reversedPayments = payments.filter((p) => p.status === 'REVERSED');

    const totalVolume = successPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalRefunded = refunds
      .filter((r) => r.status === 'SUCCESS')
      .reduce((sum, r) => sum + r.amount, 0);

    const successRate =
      payments.length > 0
        ? Math.round((successPayments.length / payments.length) * 100)
        : 100;

    // Breakdown by payment mode
    const modeBreakdown = {
      WALLET: payments.filter((p) => p.payment_mode === 'WALLET').length,
      UPI: payments.filter((p) => p.payment_mode === 'UPI').length,
      CARD: payments.filter((p) => p.payment_mode === 'CARD').length,
      NET_BANKING: payments.filter((p) => p.payment_mode === 'NET_BANKING').length,
    };

    // Bank-wise statistics
    const bankStats = banks.map((bank) => {
      const bankPayments = payments.filter(
        (p) => p.sender_bank_code === bank.code || p.receiver_bank_code === bank.code
      );
      const bankSuccess = bankPayments.filter((p) => p.status === 'SUCCESS');
      const bankVolume = bankSuccess.reduce((sum, p) => sum + p.amount, 0);
      const bankSuccessRate =
        bankPayments.length > 0
          ? Math.round((bankSuccess.length / bankPayments.length) * 100)
          : 100;

      const totalAccounts = bankAccounts.filter((a) => a.bank_code === bank.code).length;

      return {
        bankId: bank.bank_id,
        name: bank.name,
        code: bank.code,
        healthStatus: bank.health_status,
        latencyMs: bank.latency_ms,
        totalTransactions: bankPayments.length,
        successfulCount: bankSuccess.length,
        volume: bankVolume,
        successRate: bankSuccessRate,
        totalAccounts,
      };
    });

    // Failure reason analytics
    const failureReasonMap: Record<string, number> = {};
    failedPayments.forEach((p) => {
      const reason = p.failure_reason || 'Unknown Decline';
      failureReasonMap[reason] = (failureReasonMap[reason] || 0) + 1;
    });

    const failureReasons = Object.entries(failureReasonMap).map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / (failedPayments.length || 1)) * 100),
    }));

    // Hourly transaction activity (last 24 hours)
    const hourlyActivity: { hour: string; count: number; volume: number }[] = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = d.getHours().toString().padStart(2, '0') + ':00';
      const dayHourPrefix = d.toISOString().slice(0, 13); // YYYY-MM-DDTHH

      const hourPayments = payments.filter((p) => p.created_at.startsWith(dayHourPrefix));
      const hourSuccess = hourPayments.filter((p) => p.status === 'SUCCESS');
      const hourVolume = hourSuccess.reduce((sum, p) => sum + p.amount, 0);

      hourlyActivity.push({
        hour: hourStr,
        count: hourPayments.length,
        volume: hourVolume,
      });
    }

    // Daily transaction volume (last 7 days)
    const dailyVolume: { date: string; volume: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const dayPayments = payments.filter((p) => p.created_at.startsWith(dateStr));
      const daySuccess = dayPayments.filter((p) => p.status === 'SUCCESS');
      const dayVol = daySuccess.reduce((sum, p) => sum + p.amount, 0);

      dailyVolume.push({
        date: dateStr,
        volume: dayVol,
        count: dayPayments.length,
      });
    }

    // User registration trends (last 7 days)
    const userRegistrationTrends: { date: string; newUsers: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const count = users.filter((u) => u.created_at.startsWith(dateStr)).length;
      userRegistrationTrends.push({ date: dateStr, newUsers: count });
    }

    return {
      metrics: {
        totalUsers: users.length,
        totalBankAccounts: bankAccounts.length,
        totalPayments: payments.length,
        totalTransactions: transactions.length,
        successfulCount: successPayments.length,
        failedCount: failedPayments.length,
        pendingCount: pendingPayments.length,
        reversedCount: reversedPayments.length,
        totalVolume,
        totalRefunded,
        successRate,
      },
      modeBreakdown,
      bankStats,
      failureReasons,
      hourlyActivity,
      dailyVolume,
      userRegistrationTrends,
      recentPayments: payments.slice(0, 10).map((p) => {
        const sender = db.findUserById(p.sender_id);
        const receiver = p.receiver_id ? db.findUserById(p.receiver_id) : null;
        const merchant = p.merchant_id ? db.findMerchantById(p.merchant_id) : null;
        return {
          ...p,
          senderName: sender?.name || 'Unknown',
          counterpartyName: merchant?.name || receiver?.name || 'N/A',
        };
      }),
    };
  }

  public async getAllUsers() {
    const users = db.getAllUsers();
    return users.map((u) => {
      const wallet = u.role === 'customer' ? db.getWalletByUserId(u.user_id) : null;
      const bankAccounts = u.role === 'customer' ? db.getBankAccountsByUserId(u.user_id) : [];
      return {
        ...u,
        walletBalance: wallet?.balance ?? 0,
        walletStatus: wallet?.status ?? (u.role === 'admin' ? 'N/A (Admin)' : 'active'),
        bankAccounts,
      };
    });
  }

  public async getTransactionsMonitor(query: {
    status?: string;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    let payments = db.getAllPayments();

    if (query.status && query.status !== 'ALL') {
      payments = payments.filter((p) => p.status.toUpperCase() === query.status!.toUpperCase());
    }

    if (query.search) {
      const q = query.search.toLowerCase();
      payments = payments.filter((p) => {
        return (
          p.reference_id.toLowerCase().includes(q) ||
          p.payment_id.toLowerCase().includes(q) ||
          (p.failure_reason && p.failure_reason.toLowerCase().includes(q))
        );
      });
    }

    const total = payments.length;
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 20);
    const startIndex = (page - 1) * limit;

    const enriched = payments.slice(startIndex, startIndex + limit).map((p) => {
      const sender = db.findUserById(p.sender_id);
      const receiver = p.receiver_id ? db.findUserById(p.receiver_id) : null;
      const merchant = p.merchant_id ? db.findMerchantById(p.merchant_id) : null;

      return {
        ...p,
        sender: sender ? { id: sender.user_id, name: sender.name, email: sender.email } : null,
        receiver: receiver ? { id: receiver.user_id, name: receiver.name, email: receiver.email } : null,
        merchant: merchant ? { id: merchant.merchant_id, name: merchant.name, upi: merchant.upi_id } : null,
      };
    });

    return {
      payments: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async getAuditLogs(query: { eventType?: string; search?: string; page?: number; limit?: number }) {
    return auditService.getAuditLogs(query);
  }
}

export const adminService = new AdminService();
