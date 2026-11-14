import { db } from '../config/database.js';
import { Transaction } from '../types/models.js';
import { paymentService } from './payment.service.js';

export interface ListTransactionsFilter {
  userId?: string;
  status?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class TransactionService {
  public async getTransactions(filter: ListTransactionsFilter) {
    let txns = filter.userId ? db.getTransactionsByUserId(filter.userId) : db.getAllTransactions();

    if (filter.status && filter.status !== 'ALL') {
      txns = txns.filter((t) => t.status.toUpperCase() === filter.status!.toUpperCase());
    }

    if (filter.type && filter.type !== 'ALL') {
      txns = txns.filter((t) => t.type.toUpperCase() === filter.type!.toUpperCase());
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      txns = txns.filter((t) => {
        const refMatch = t.reference_id.toLowerCase().includes(q);
        const idMatch = t.transaction_id.toLowerCase().includes(q);
        return refMatch || idMatch;
      });
    }

    if (filter.startDate) {
      txns = txns.filter((t) => t.created_at >= filter.startDate!);
    }

    if (filter.endDate) {
      txns = txns.filter((t) => t.created_at <= filter.endDate!);
    }

    const total = txns.length;
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, filter.limit || 10);
    const startIndex = (page - 1) * limit;
    const paginated = txns.slice(startIndex, startIndex + limit);

    // Enrich transactions with counterparty & payment mode info
    const enriched = paginated.map((t) => {
      const payment = db.findPaymentById(t.payment_id);
      let counterparty = 'Unknown';
      let mode = payment?.payment_mode || 'WALLET';

      if (payment) {
        if (payment.merchant_id) {
          const m = db.findMerchantById(payment.merchant_id);
          counterparty = m?.name || 'Merchant';
        } else if (payment.sender_id === t.user_id) {
          const r = payment.receiver_id ? db.findUserById(payment.receiver_id) : null;
          counterparty = r ? r.name : 'Unknown Recipient';
        } else {
          const s = db.findUserById(payment.sender_id);
          counterparty = s ? s.name : 'Unknown Sender';
        }
      }

      return {
        ...t,
        counterparty,
        paymentMode: mode,
      };
    });

    return {
      transactions: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async getTransactionById(transactionId: string, requestingUserId: string, isAdmin = false) {
    const txn = db.findTransactionById(transactionId);
    if (!txn) {
      throw { statusCode: 404, message: 'Transaction record not found' };
    }

    if (!isAdmin && txn.user_id !== requestingUserId) {
      throw { statusCode: 403, message: 'Unauthorized: You cannot access another user’s transaction' };
    }

    const receipt = await paymentService.getPaymentDetails(txn.payment_id, requestingUserId, isAdmin);

    return {
      transaction: txn,
      receipt,
    };
  }
}

export const transactionService = new TransactionService();
