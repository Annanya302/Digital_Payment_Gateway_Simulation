import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { Wallet, Transaction } from '../types/models.js';
import { generateReferenceId } from '../utils/idGenerator.js';
import { notificationService } from './notification.service.js';

export class WalletService {
  public async getWallet(userId: string): Promise<Wallet> {
    const wallet = db.getWalletByUserId(userId);
    if (!wallet) {
      throw { statusCode: 404, message: 'Wallet not found for this account' };
    }
    return wallet;
  }

  public async topUpWallet(userId: string, amount: number): Promise<{ wallet: Wallet; transaction: Transaction }> {
    if (amount <= 0) {
      throw { statusCode: 400, message: 'Top-up amount must be greater than zero' };
    }

    if (amount > 50000) {
      throw { statusCode: 400, message: 'Maximum top-up per transaction is ₹50,000' };
    }

    const wallet = db.updateWalletBalance(userId, amount);
    const referenceId = generateReferenceId('TXN');

    // Dummy payment entry for top-up
    const dummyPayment = db.createPayment({
      payment_id: uuidv4(),
      sender_id: userId,
      receiver_id: userId,
      amount,
      payment_mode: 'WALLET',
      status: 'SUCCESS',
      reference_id: referenceId,
      created_at: new Date().toISOString(),
    });

    const txn: Transaction = {
      transaction_id: uuidv4(),
      payment_id: dummyPayment.payment_id,
      user_id: userId,
      type: 'CREDIT',
      amount,
      status: 'SUCCESS',
      reference_id: referenceId,
      created_at: new Date().toISOString(),
    };

    db.createTransaction(txn);

    await notificationService.sendNotification({
      userId,
      title: 'Wallet Top-Up Successful',
      message: `Your wallet has been credited with ₹${amount.toFixed(2)}. New balance: ₹${wallet.balance.toFixed(2)}.`,
      type: 'PAYMENT_RECEIVED',
      metadata: { transactionId: txn.transaction_id, referenceId },
    });

    return { wallet, transaction: txn };
  }

  public async getWalletTransactions(userId: string): Promise<Transaction[]> {
    return db.getTransactionsByUserId(userId);
  }
}

export const walletService = new WalletService();
