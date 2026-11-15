import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { Bank, BankAccount, BankCode, BankHealthStatus, Transaction } from '../types/models.js';
import { generateReferenceId } from '../utils/idGenerator.js';
import { comparePin } from '../utils/password.js';
import { notificationService } from './notification.service.js';
import { socketService } from './socket.service.js';
import { auditService } from './audit.service.js';

export class BankService {
  public getAllBanks(): Bank[] {
    return db.getAllBanks();
  }

  public getBankByCode(code: string): Bank {
    const bank = db.findBankByCode(code);
    if (!bank) {
      throw { statusCode: 404, message: `Bank with code ${code} not found` };
    }
    return bank;
  }

  public getUserBankAccounts(userId: string): BankAccount[] {
    return db.getBankAccountsByUserId(userId);
  }

  public getPrimaryAccount(userId: string): BankAccount | undefined {
    return db.getPrimaryBankAccount(userId);
  }

  public async linkBankAccount(params: {
    userId: string;
    bankCode: BankCode;
    accountType?: 'SAVINGS' | 'CURRENT';
    initialBalance?: number;
  }): Promise<BankAccount> {
    const user = db.findUserById(params.userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const bank = db.findBankByCode(params.bankCode);
    if (!bank) {
      throw { statusCode: 404, message: `Invalid bank code ${params.bankCode}` };
    }

    const existingAccounts = db.getBankAccountsByUserId(params.userId);
    const isFirstAccount = existingAccounts.length === 0;

    // Generate unique account number: e.g. HDFC8392019482
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
    const accountNumber = `${bank.code}${randomDigits}`;
    const ifscCode = `${bank.ifsc_prefix}${Math.floor(1000 + Math.random() * 9000)}`;

    const newAccount: BankAccount = {
      account_id: uuidv4(),
      user_id: user.user_id,
      bank_id: bank.bank_id,
      bank_name: bank.name,
      bank_code: bank.code,
      account_number: accountNumber,
      ifsc_code: ifscCode,
      account_type: params.accountType || 'SAVINGS',
      balance: params.initialBalance !== undefined ? params.initialBalance : 0.0,
      is_primary: isFirstAccount,
      verification_status: 'VERIFIED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.createBankAccount(newAccount);

    await notificationService.sendNotification({
      userId: user.user_id,
      title: 'Simulated Bank Account Linked',
      message: `Your ${bank.name} account (${accountNumber}) has been verified and linked successfully.`,
      type: 'BANK_LINKED',
      metadata: { accountId: newAccount.account_id, accountNumber, ifscCode },
    });

    auditService.log({
      eventType: 'BANK_ACCOUNT_CREATED',
      actorId: user.user_id,
      actorName: user.name,
      actorRole: user.role,
      targetResource: `BANK_ACCOUNT:${newAccount.account_id}`,
      action: 'LINK_BANK_ACCOUNT',
      details: { bankCode: bank.code, accountNumber, verified: true },
    });

    // Real-time notification
    socketService.emitToUser(user.user_id, 'bank_account_linked', newAccount);

    return newAccount;
  }

  public async setPrimaryAccount(userId: string, accountId: string): Promise<BankAccount> {
    const accounts = db.getBankAccountsByUserId(userId);
    const target = accounts.find((a) => a.account_id === accountId);
    if (!target) {
      throw { statusCode: 404, message: 'Bank account not found' };
    }

    accounts.forEach((a) => {
      a.is_primary = a.account_id === accountId;
      a.updated_at = new Date().toISOString();
    });

    return target;
  }

  public async topUpBankAccount(params: {
    userId: string;
    accountId: string;
    amount: number;
  }): Promise<{ account: BankAccount; transaction: Transaction }> {
    if (params.amount <= 0) {
      throw { statusCode: 400, message: 'Top-up amount must be greater than zero' };
    }

    if (params.amount > 50000) {
      throw { statusCode: 400, message: 'Maximum demo top-up is ₹50,000 per transaction' };
    }

    const account = db.bankAccounts.get(params.accountId);
    if (!account || account.user_id !== params.userId) {
      throw { statusCode: 404, message: 'Bank account not found' };
    }

    const updatedAccount = db.updateBankAccountBalance(account.account_id, params.amount);
    const referenceId = generateReferenceId('TXN');

    const payment = db.createPayment({
      payment_id: uuidv4(),
      sender_id: params.userId,
      receiver_id: params.userId,
      amount: params.amount,
      payment_mode: 'NET_BANKING',
      status: 'SUCCESS',
      reference_id: referenceId,
      sender_bank_code: account.bank_code,
      receiver_bank_code: account.bank_code,
      created_at: new Date().toISOString(),
    });

    const txn: Transaction = {
      transaction_id: uuidv4(),
      payment_id: payment.payment_id,
      user_id: params.userId,
      type: 'CREDIT',
      amount: params.amount,
      status: 'SUCCESS',
      reference_id: referenceId,
      created_at: new Date().toISOString(),
    };

    db.createTransaction(txn);

    await notificationService.sendNotification({
      userId: params.userId,
      title: 'Bank Account Credited',
      message: `₹${params.amount.toFixed(2)} deposited into ${account.bank_name} (${account.account_number}). New Balance: ₹${updatedAccount.balance.toFixed(2)}`,
      type: 'PAYMENT_RECEIVED',
      metadata: { accountId: account.account_id, referenceId },
    });

    socketService.emitToUser(params.userId, 'balance_updated', {
      userId: params.userId,
      accountId: account.account_id,
      bankBalance: updatedAccount.balance,
      timestamp: new Date().toISOString(),
    });

    return { account: updatedAccount, transaction: txn };
  }

  public updateBankHealth(code: string, status: BankHealthStatus, adminUser: { id: string; name: string }): Bank {
    const bank = db.updateBankHealth(code, status);

    auditService.log({
      eventType: 'BANK_HEALTH_TOGGLED',
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorRole: 'admin',
      targetResource: `BANK:${code}`,
      action: 'UPDATE_HEALTH_STATUS',
      details: { bankCode: code, newStatus: status },
    });

    socketService.broadcast('bank_health_updated', {
      bankCode: bank.code,
      healthStatus: bank.health_status,
      timestamp: new Date().toISOString(),
    });

    return bank;
  }

  public async checkBalance(params: {
    userId: string;
    accountId: string;
    pin: string;
  }): Promise<{ balance: number; verified: boolean; bankName: string; accountNumber: string }> {
    const user = db.findUserById(params.userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const isPinValid = await comparePin(params.pin, user.pin_hash);
    if (!isPinValid) {
      auditService.log({
        eventType: 'AUTH_LOGIN',
        actorId: user.user_id,
        actorName: user.name,
        actorRole: user.role,
        targetResource: `BANK_ACCOUNT:${params.accountId}`,
        action: 'CHECK_BALANCE_FAILED_PIN',
        details: { reason: 'Incorrect 4-digit PIN' },
      });
      throw { statusCode: 401, message: 'Incorrect PIN entered. Please try again.' };
    }

    const accounts = db.getBankAccountsByUserId(params.userId);
    const account = accounts.find((a) => a.account_id === params.accountId);
    if (!account) {
      throw { statusCode: 404, message: 'Bank account not found' };
    }

    auditService.log({
      eventType: 'AUTH_LOGIN',
      actorId: user.user_id,
      actorName: user.name,
      actorRole: user.role,
      targetResource: `BANK_ACCOUNT:${params.accountId}`,
      action: 'CHECK_BALANCE_VERIFIED',
      details: { bankCode: account.bank_code, accountNumber: account.account_number },
    });

    return {
      balance: account.balance,
      verified: true,
      bankName: account.bank_name,
      accountNumber: account.account_number,
    };
  }
}

export const bankService = new BankService();
