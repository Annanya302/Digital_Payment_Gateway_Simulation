import { db } from '../config/database.js';

export class AdminService {
  public async getDashboardStats() {
    const users = db.getAllUsers();
    const payments = db.getAllPayments();
    const transactions = db.getAllTransactions();
    const refunds = db.getAllRefunds();

    const successPayments = payments.filter((p) => p.status === 'SUCCESS');
    const failedPayments = payments.filter((p) => p.status === 'FAILED');
    const pendingPayments = payments.filter((p) => p.status === 'PENDING');

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
    };

    // Simulator breakdown
    const simulatorOutcomes = {
      APPROVED: payments.filter((p) => p.simulated_outcome === 'APPROVED').length,
      DECLINED: payments.filter((p) => p.simulated_outcome === 'DECLINED').length,
      TIMEOUT: payments.filter((p) => p.simulated_outcome === 'TIMEOUT').length,
    };

    return {
      metrics: {
        totalUsers: users.length,
        totalPayments: payments.length,
        totalTransactions: transactions.length,
        successfulCount: successPayments.length,
        failedCount: failedPayments.length,
        pendingCount: pendingPayments.length,
        totalVolume,
        totalRefunded,
        successRate,
      },
      modeBreakdown,
      simulatorOutcomes,
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
      const wallet = db.getWalletByUserId(u.user_id);
      return {
        ...u,
        walletBalance: wallet?.balance ?? 0,
        walletStatus: wallet?.status ?? 'active',
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
}

export const adminService = new AdminService();
