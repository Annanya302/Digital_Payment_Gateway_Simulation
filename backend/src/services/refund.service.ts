import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { Refund, Transaction } from '../types/models.js';
import { generateReferenceId } from '../utils/idGenerator.js';
import { notificationService } from './notification.service.js';

export class RefundService {
  public async requestRefund(params: {
    paymentId: string;
    userId: string;
    reason: string;
    amount?: number;
  }): Promise<{ refund: Refund; transaction?: Transaction; updatedBalance?: number }> {
    // 1. Fetch original payment
    const payment = db.findPaymentById(params.paymentId);
    if (!payment) {
      throw { statusCode: 404, message: 'Original payment record not found' };
    }

    // 2. Authorization check: only sender can request refund
    if (payment.sender_id !== params.userId) {
      throw { statusCode: 403, message: 'You are not authorized to request a refund for this payment' };
    }

    // 3. Status validation: Reject if not SUCCESS
    if (payment.status !== 'SUCCESS') {
      throw {
        statusCode: 400,
        message: `Refund cannot be processed for payment with status ${payment.status}. Only successful transactions are eligible.`,
      };
    }

    // 4. Calculate existing refunds
    const existingRefunds = db.getRefundsByOriginalPaymentId(params.paymentId);
    const successfulRefunds = existingRefunds.filter((r) => r.status === 'SUCCESS');
    const totalRefunded = successfulRefunds.reduce((sum, r) => sum + r.amount, 0);

    const refundAmount = params.amount !== undefined ? params.amount : payment.amount;

    if (refundAmount <= 0) {
      throw { statusCode: 400, message: 'Refund amount must be greater than zero' };
    }

    const remainingRefundable = Math.round((payment.amount - totalRefunded) * 100) / 100;
    if (remainingRefundable <= 0) {
      throw { statusCode: 400, message: 'This transaction has already been fully refunded' };
    }

    if (refundAmount > remainingRefundable) {
      throw {
        statusCode: 400,
        message: `Requested refund amount of ₹${refundAmount.toFixed(2)} exceeds eligible refundable balance of ₹${remainingRefundable.toFixed(2)}`,
      };
    }

    // 5. Process simulated refund
    const refundReferenceId = generateReferenceId('REF');
    const refundId = uuidv4();
    const now = new Date().toISOString();

    // Credit sender wallet (refund back to payer)
    let updatedWallet;
    if (payment.payment_mode === 'WALLET') {
      updatedWallet = db.updateWalletBalance(params.userId, refundAmount);
    } else {
      // For UPI or Card, simulate instant wallet credit / reversal
      updatedWallet = db.updateWalletBalance(params.userId, refundAmount);
    }

    const refund: Refund = {
      refund_id: refundId,
      original_payment_id: params.paymentId,
      user_id: params.userId,
      amount: refundAmount,
      status: 'SUCCESS',
      reason: params.reason,
      reference_id: refundReferenceId,
      created_at: now,
    };
    db.createRefund(refund);

    // Ledger transaction
    const txn: Transaction = {
      transaction_id: uuidv4(),
      payment_id: params.paymentId,
      user_id: params.userId,
      type: 'REFUND',
      amount: refundAmount,
      status: 'SUCCESS',
      reference_id: refundReferenceId,
      created_at: now,
    };
    db.createTransaction(txn);

    // Notification
    await notificationService.sendNotification({
      userId: params.userId,
      title: 'Refund Processed Successfully',
      message: `Simulated refund of ₹${refundAmount.toFixed(2)} for ${payment.reference_id} has been credited to your wallet. Ref: ${refundReferenceId}`,
      type: 'REFUND_SUCCESS',
      metadata: { refundId, referenceId: refundReferenceId, originalPaymentId: params.paymentId },
    });

    return {
      refund,
      transaction: txn,
      updatedBalance: updatedWallet?.balance,
    };
  }

  public async getRefunds(userId?: string) {
    if (userId) {
      return db.getRefundsByUserId(userId);
    }
    return db.getAllRefunds();
  }

  public async getRefundById(refundId: string, requestingUserId: string, isAdmin = false) {
    const refund = db.findRefundById(refundId);
    if (!refund) {
      throw { statusCode: 404, message: 'Refund record not found' };
    }

    if (!isAdmin && refund.user_id !== requestingUserId) {
      throw { statusCode: 403, message: 'Unauthorized: You cannot access this refund record' };
    }

    const originalPayment = db.findPaymentById(refund.original_payment_id);
    return {
      refund,
      originalPayment,
    };
  }
}

export const refundService = new RefundService();
