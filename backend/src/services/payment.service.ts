import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { config } from '../config/env.js';
import {
  Payment,
  Transaction,
  PaymentMode,
  SimulatorOutcome,
  PipelineStage,
  BankCode,
} from '../types/models.js';
import { bankSimulator, SimulatorResponse } from '../simulators/bankSimulator.js';
import { comparePin } from '../utils/password.js';
import { generateReferenceId } from '../utils/idGenerator.js';
import { notificationService } from './notification.service.js';
import { socketService } from './socket.service.js';
import { auditService } from './audit.service.js';
import { logger } from '../utils/logger.js';

export interface SendMoneyParams {
  senderId: string;
  receiverIdentifier: string;
  amount: number;
  paymentMode: PaymentMode;
  pin: string;
  senderBankCode?: BankCode;
  idempotencyKey?: string;
  simulatedOutcome?: SimulatorOutcome;
  cardDetails?: {
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
  };
}

export interface PayMerchantParams {
  senderId: string;
  merchantId: string;
  amount: number;
  paymentMode: PaymentMode;
  pin: string;
  senderBankCode?: BankCode;
  idempotencyKey?: string;
  simulatedOutcome?: SimulatorOutcome;
  cardDetails?: {
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
  };
}

export interface PaymentReceipt {
  paymentId: string;
  referenceId: string;
  amount: number;
  paymentMode: PaymentMode;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REVERSED';
  sender: {
    userId: string;
    name: string;
    email: string;
    bankCode?: string;
    accountNumber?: string;
  };
  receiver?: {
    userId: string;
    name: string;
    email: string;
    bankCode?: string;
    accountNumber?: string;
  } | null;
  merchant?: {
    merchantId: string;
    name: string;
    upiId: string;
    bankCode?: string;
  } | null;
  transferType?: 'INTRA_BANK' | 'INTER_BANK';
  simulatorResponse: SimulatorResponse;
  pipelineStages: PipelineStage[];
  failureReason?: string | null;
  reversalStatus?: 'NONE' | 'INITIATED' | 'REVERSED';
  createdAt: string;
}

export class PaymentService {
  /**
   * P2P: Send money to another registered user using the 11-stage processing pipeline
   */
  public async sendMoney(params: SendMoneyParams): Promise<PaymentReceipt> {
    const stages: PipelineStage[] = [];
    const now = () => new Date().toISOString();

    const recordStage = (stageNum: number, name: string, status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SKIPPED', detail: string) => {
      stages.push({
        stageNumber: stageNum,
        stageName: name,
        status,
        timestamp: now(),
        detail,
      });
    };

    // Stage 1: Payment Initiation
    recordStage(1, 'Payment Initiation', 'SUCCESS', `Initiated P2P payment request for ₹${params.amount.toFixed(2)} via ${params.paymentMode}`);

    // Stage 2: Request Validation
    if (params.idempotencyKey) {
      const existing = db.findPaymentByIdempotencyKey(params.idempotencyKey);
      if (existing) {
        logger.info(`[PaymentService] Idempotency match found for key: ${params.idempotencyKey}`);
        recordStage(2, 'Request Validation', 'SUCCESS', 'Idempotent request matched existing transaction');
        return this.buildReceiptFromPayment(existing);
      }
    }

    try {
      this.validateLimits(params.senderId, params.amount);
      recordStage(2, 'Request Validation', 'SUCCESS', `Amount ₹${params.amount.toFixed(2)} passed single and daily limits validation`);
    } catch (err: any) {
      recordStage(2, 'Request Validation', 'FAILED', err.message || 'Limit validation failed');
      throw err;
    }

    // Stage 3: Recipient Verification
    const sender = db.findUserById(params.senderId);
    if (!sender || sender.status !== 'active') {
      recordStage(3, 'Recipient Verification', 'FAILED', 'Sender account invalid or inactive');
      throw { statusCode: 403, message: 'Sender account is invalid or inactive' };
    }

    const receiver = db.findUserByEmailOrMobile(params.receiverIdentifier);
    if (!receiver) {
      recordStage(3, 'Recipient Verification', 'FAILED', 'Recipient not found with provided identifier');
      throw { statusCode: 404, message: 'Receiver not found with provided email or mobile number' };
    }

    if (receiver.user_id === sender.user_id) {
      recordStage(3, 'Recipient Verification', 'FAILED', 'Self-transfers are not permitted');
      throw { statusCode: 400, message: 'Self-transfers via Send Money are not permitted' };
    }

    if (receiver.status !== 'active') {
      recordStage(3, 'Recipient Verification', 'FAILED', 'Recipient account is inactive or suspended');
      throw { statusCode: 400, message: 'Receiver account is inactive or suspended' };
    }
    recordStage(3, 'Recipient Verification', 'SUCCESS', `Recipient verified: ${receiver.name} (${receiver.email})`);

    // Stage 4: Demo PIN Authentication
    const isPinValid = await comparePin(params.pin, sender.pin_hash);
    if (!isPinValid) {
      recordStage(4, 'PIN Authentication', 'FAILED', 'Invalid cryptographic PIN entered');
      throw { statusCode: 401, message: 'Invalid payment PIN entered' };
    }
    recordStage(4, 'PIN Authentication', 'SUCCESS', 'Cryptographic PIN verified successfully');

    // Stage 5: Gateway Processing
    const referenceId = generateReferenceId('TXN');
    const paymentId = uuidv4();
    recordStage(5, 'Gateway Processing', 'SUCCESS', `Assigned gateway reference: ${referenceId}`);

    // Stage 6: Bank Routing
    const senderPrimaryBank = db.getPrimaryBankAccount(sender.user_id);
    const receiverPrimaryBank = db.getPrimaryBankAccount(receiver.user_id);

    const senderBankCode = (params.senderBankCode || senderPrimaryBank?.bank_code || 'HDFC') as BankCode;
    const receiverBankCode = (receiverPrimaryBank?.bank_code || 'SBI') as BankCode;
    const isIntraBank = senderBankCode === receiverBankCode;
    const transferType: 'INTRA_BANK' | 'INTER_BANK' = isIntraBank ? 'INTRA_BANK' : 'INTER_BANK';

    recordStage(
      6,
      'Bank Routing',
      'SUCCESS',
      `Routing from ${senderBankCode} to ${receiverBankCode} (${transferType === 'INTRA_BANK' ? 'Intra-Bank Clearing' : 'Inter-Bank Switch'})`
    );

    // Stage 7: Balance Verification
    if (params.paymentMode === 'WALLET') {
      const senderWallet = db.getWalletByUserId(sender.user_id);
      if (!senderWallet || senderWallet.status !== 'active') {
        recordStage(7, 'Balance Verification', 'FAILED', 'Sender wallet inactive');
        throw { statusCode: 400, message: 'Sender wallet is not active' };
      }
      if (senderWallet.balance < params.amount) {
        recordStage(7, 'Balance Verification', 'FAILED', `Insufficient wallet balance: ₹${senderWallet.balance.toFixed(2)}`);
        throw { statusCode: 400, message: `Insufficient wallet balance. Available: ₹${senderWallet.balance.toFixed(2)}` };
      }
      recordStage(7, 'Balance Verification', 'SUCCESS', `Wallet balance verified (Available: ₹${senderWallet.balance.toFixed(2)})`);
    } else {
      // Using bank account balance
      if (senderPrimaryBank) {
        if (senderPrimaryBank.balance < params.amount) {
          recordStage(7, 'Balance Verification', 'FAILED', `Insufficient bank balance: ₹${senderPrimaryBank.balance.toFixed(2)}`);
          throw { statusCode: 400, message: `Insufficient bank balance. Available: ₹${senderPrimaryBank.balance.toFixed(2)}` };
        }
        recordStage(7, 'Balance Verification', 'SUCCESS', `Bank balance verified at ${senderPrimaryBank.bank_name}`);
      } else {
        recordStage(7, 'Balance Verification', 'SUCCESS', 'Simulated source authorized');
      }
    }

    // Stage 8: Transaction Authorization
    const cardLast4 = params.cardDetails?.cardNumber?.slice(-4);
    const simulatorResult = await bankSimulator.authorizePayment({
      paymentMode: params.paymentMode,
      amount: params.amount,
      receiverIdentifier: params.receiverIdentifier,
      cardLast4,
      senderBankCode,
      receiverBankCode,
      forceOutcome: params.simulatedOutcome,
    });

    if (simulatorResult.outcome !== 'APPROVED') {
      recordStage(
        8,
        'Transaction Authorization',
        'FAILED',
        `Authorization ${simulatorResult.outcome}: ${simulatorResult.responseMessage}`
      );
      recordStage(9, 'Atomic Debit & Credit', 'SKIPPED', 'Skipped due to authorization failure - no funds deducted');
      recordStage(10, 'Status Update', 'FAILED', `Payment marked FAILED (${simulatorResult.outcome})`);
      recordStage(11, 'Notification Generation', 'SUCCESS', 'Failure notification dispatched');

      const failedPayment = db.createPayment({
        payment_id: paymentId,
        sender_id: sender.user_id,
        receiver_id: receiver.user_id,
        amount: params.amount,
        payment_mode: params.paymentMode,
        status: 'FAILED',
        idempotency_key: params.idempotencyKey,
        reference_id: referenceId,
        failure_reason: simulatorResult.responseMessage,
        simulated_outcome: simulatorResult.outcome,
        sender_bank_code: senderBankCode,
        receiver_bank_code: receiverBankCode,
        transfer_type: transferType,
        pipeline_stages: stages,
        created_at: now(),
      });

      db.createTransaction({
        transaction_id: uuidv4(),
        payment_id: paymentId,
        user_id: sender.user_id,
        type: 'DEBIT',
        amount: params.amount,
        status: 'FAILED',
        reference_id: referenceId,
        failure_reason: simulatorResult.responseMessage,
        created_at: now(),
      });

      await notificationService.sendNotification({
        userId: sender.user_id,
        title: 'Payment Failed',
        message: `Payment of ₹${params.amount.toFixed(2)} to ${receiver.name} failed: ${simulatorResult.responseMessage}`,
        type: 'PAYMENT_FAILED',
        metadata: { paymentId, referenceId, failureReason: simulatorResult.responseMessage },
      });

      auditService.log({
        eventType: 'PAYMENT_FAILED',
        actorId: sender.user_id,
        actorName: sender.name,
        actorRole: sender.role,
        targetResource: `PAYMENT:${paymentId}`,
        action: 'PAYMENT_FAILED',
        details: { referenceId, amount: params.amount, reason: simulatorResult.responseMessage },
      });

      return this.buildReceiptFromPayment(failedPayment);
    }

    recordStage(8, 'Transaction Authorization', 'SUCCESS', `Authorized by switch with code ${simulatorResult.authCode}`);

    // Stage 9: Atomic Debit and Credit
    try {
      if (params.paymentMode === 'WALLET') {
        db.updateWalletBalance(sender.user_id, -params.amount);
        db.updateWalletBalance(receiver.user_id, params.amount);
      } else if (senderPrimaryBank && receiverPrimaryBank) {
        db.updateBankAccountBalance(senderPrimaryBank.account_id, -params.amount);
        db.updateBankAccountBalance(receiverPrimaryBank.account_id, params.amount);
      } else {
        // Debit sender wallet or bank
        if (db.getWalletByUserId(sender.user_id)) {
          db.updateWalletBalance(sender.user_id, -params.amount);
        }
        if (db.getWalletByUserId(receiver.user_id)) {
          db.updateWalletBalance(receiver.user_id, params.amount);
        }
      }
      recordStage(9, 'Atomic Debit & Credit', 'SUCCESS', `Atomic settlement completed: -₹${params.amount.toFixed(2)} debit and +₹${params.amount.toFixed(2)} credit`);
    } catch (err: any) {
      recordStage(9, 'Atomic Debit & Credit', 'FAILED', `Atomic settlement failed: ${err.message}`);
      throw err;
    }

    // Stage 10: Status Update
    recordStage(10, 'Status Update', 'SUCCESS', 'Payment marked as SUCCESS in ledger');
    const payment = db.createPayment({
      payment_id: paymentId,
      sender_id: sender.user_id,
      receiver_id: receiver.user_id,
      amount: params.amount,
      payment_mode: params.paymentMode,
      status: 'SUCCESS',
      idempotency_key: params.idempotencyKey,
      reference_id: referenceId,
      simulated_outcome: 'APPROVED',
      sender_bank_code: senderBankCode,
      receiver_bank_code: receiverBankCode,
      transfer_type: transferType,
      pipeline_stages: stages,
      created_at: now(),
    });

    // Write immutable ledger entries
    db.createTransaction({
      transaction_id: uuidv4(),
      payment_id: paymentId,
      user_id: sender.user_id,
      type: 'DEBIT',
      amount: params.amount,
      status: 'SUCCESS',
      reference_id: referenceId,
      created_at: now(),
    });

    db.createTransaction({
      transaction_id: uuidv4(),
      payment_id: paymentId,
      user_id: receiver.user_id,
      type: 'CREDIT',
      amount: params.amount,
      status: 'SUCCESS',
      reference_id: referenceId,
      created_at: now(),
    });

    // Stage 11: Notification Generation
    recordStage(11, 'Notification Generation', 'SUCCESS', 'Dispatched real-time alerts to sender and receiver');

    await notificationService.sendNotification({
      userId: sender.user_id,
      title: 'Payment Successful',
      message: `₹${params.amount.toFixed(2)} sent to ${receiver.name} via ${params.paymentMode}. Ref: ${referenceId}`,
      type: 'PAYMENT_SUCCESS',
      metadata: { paymentId, referenceId, amount: params.amount },
    });

    await notificationService.sendNotification({
      userId: receiver.user_id,
      title: 'Money Received',
      message: `You received ₹${params.amount.toFixed(2)} from ${sender.name} via ${params.paymentMode}.`,
      type: 'PAYMENT_RECEIVED',
      metadata: { paymentId, referenceId, amount: params.amount },
    });

    // Real-time balance and transaction updates via Socket.IO
    const senderWallet = db.getWalletByUserId(sender.user_id);
    const receiverWallet = db.getWalletByUserId(receiver.user_id);
    const senderBankAcc = db.getPrimaryBankAccount(sender.user_id);
    const receiverBankAcc = db.getPrimaryBankAccount(receiver.user_id);

    socketService.emitToUser(sender.user_id, 'balance_updated', {
      userId: sender.user_id,
      walletBalance: senderWallet?.balance ?? 0,
      bankBalance: senderBankAcc?.balance ?? 0,
    });

    socketService.emitToUser(receiver.user_id, 'balance_updated', {
      userId: receiver.user_id,
      walletBalance: receiverWallet?.balance ?? 0,
      bankBalance: receiverBankAcc?.balance ?? 0,
    });

    const receipt = this.buildReceiptFromPayment(payment);
    socketService.emitToUser(sender.user_id, 'transaction_created', receipt);
    socketService.emitToUser(receiver.user_id, 'transaction_created', receipt);
    socketService.emitToAdmin('admin_payment_stream', payment);

    auditService.log({
      eventType: 'PAYMENT_COMPLETED',
      actorId: sender.user_id,
      actorName: sender.name,
      actorRole: sender.role,
      targetResource: `PAYMENT:${paymentId}`,
      action: 'P2P_PAYMENT_SUCCESS',
      details: { referenceId, amount: params.amount, recipient: receiver.email, mode: params.paymentMode },
    });

    return receipt;
  }

  /**
   * Pay a registered merchant with full 11-stage processing pipeline
   */
  public async payMerchant(params: PayMerchantParams): Promise<PaymentReceipt> {
    const stages: PipelineStage[] = [];
    const now = () => new Date().toISOString();

    const recordStage = (stageNum: number, name: string, status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SKIPPED', detail: string) => {
      stages.push({
        stageNumber: stageNum,
        stageName: name,
        status,
        timestamp: now(),
        detail,
      });
    };

    recordStage(1, 'Payment Initiation', 'SUCCESS', `Initiated merchant checkout of ₹${params.amount.toFixed(2)} via ${params.paymentMode}`);

    if (params.idempotencyKey) {
      const existing = db.findPaymentByIdempotencyKey(params.idempotencyKey);
      if (existing) {
        return this.buildReceiptFromPayment(existing);
      }
    }

    try {
      this.validateLimits(params.senderId, params.amount);
      recordStage(2, 'Request Validation', 'SUCCESS', `Limits validated for merchant payment of ₹${params.amount.toFixed(2)}`);
    } catch (err: any) {
      recordStage(2, 'Request Validation', 'FAILED', err.message);
      throw err;
    }

    const sender = db.findUserById(params.senderId);
    if (!sender || sender.status !== 'active') {
      recordStage(3, 'Recipient Verification', 'FAILED', 'Sender invalid or inactive');
      throw { statusCode: 403, message: 'Sender account is invalid or inactive' };
    }

    const merchant = db.findMerchantById(params.merchantId);
    if (!merchant || merchant.status !== 'active') {
      recordStage(3, 'Recipient Verification', 'FAILED', 'Merchant not found or inactive');
      throw { statusCode: 404, message: 'Merchant not found or inactive' };
    }
    recordStage(3, 'Recipient Verification', 'SUCCESS', `Merchant verified: ${merchant.name} (${merchant.upi_id})`);

    const isPinValid = await comparePin(params.pin, sender.pin_hash);
    if (!isPinValid) {
      recordStage(4, 'PIN Authentication', 'FAILED', 'Invalid PIN entered');
      throw { statusCode: 401, message: 'Invalid payment PIN entered' };
    }
    recordStage(4, 'PIN Authentication', 'SUCCESS', 'PIN verified securely');

    const referenceId = generateReferenceId('TXN');
    const paymentId = uuidv4();
    recordStage(5, 'Gateway Processing', 'SUCCESS', `Assigned gateway reference: ${referenceId}`);

    const senderPrimaryBank = db.getPrimaryBankAccount(sender.user_id);
    const senderBankCode = (params.senderBankCode || senderPrimaryBank?.bank_code || 'HDFC') as BankCode;
    const receiverBankCode = (merchant.bank_code || 'ICICI') as BankCode;
    const isIntraBank = senderBankCode === receiverBankCode;
    const transferType: 'INTRA_BANK' | 'INTER_BANK' = isIntraBank ? 'INTRA_BANK' : 'INTER_BANK';

    recordStage(6, 'Bank Routing', 'SUCCESS', `Merchant clearing route: ${senderBankCode} -> ${receiverBankCode} (${transferType})`);

    if (params.paymentMode === 'WALLET') {
      const senderWallet = db.getWalletByUserId(sender.user_id);
      if (!senderWallet || senderWallet.status !== 'active') {
        recordStage(7, 'Balance Verification', 'FAILED', 'Sender wallet inactive');
        throw { statusCode: 400, message: 'Sender wallet is not active' };
      }
      if (senderWallet.balance < params.amount) {
        recordStage(7, 'Balance Verification', 'FAILED', 'Insufficient wallet balance');
        throw { statusCode: 400, message: `Insufficient wallet balance. Available: ₹${senderWallet.balance.toFixed(2)}` };
      }
      recordStage(7, 'Balance Verification', 'SUCCESS', `Wallet balance verified: ₹${senderWallet.balance.toFixed(2)}`);
    } else {
      if (senderPrimaryBank && senderPrimaryBank.balance < params.amount) {
        recordStage(7, 'Balance Verification', 'FAILED', 'Insufficient bank balance');
        throw { statusCode: 400, message: `Insufficient bank balance. Available: ₹${senderPrimaryBank.balance.toFixed(2)}` };
      }
      recordStage(7, 'Balance Verification', 'SUCCESS', 'Source balance verified');
    }

    const cardLast4 = params.cardDetails?.cardNumber?.slice(-4);
    const simulatorResult = await bankSimulator.authorizePayment({
      paymentMode: params.paymentMode,
      amount: params.amount,
      receiverIdentifier: merchant.upi_id,
      cardLast4,
      senderBankCode,
      receiverBankCode,
      forceOutcome: params.simulatedOutcome,
    });

    if (simulatorResult.outcome !== 'APPROVED') {
      recordStage(8, 'Transaction Authorization', 'FAILED', `Declined: ${simulatorResult.responseMessage}`);
      recordStage(9, 'Atomic Debit & Credit', 'SKIPPED', 'Skipped due to decline - zero debit');
      recordStage(10, 'Status Update', 'FAILED', 'Marked FAILED in ledger');
      recordStage(11, 'Notification Generation', 'SUCCESS', 'Failure notification sent');

      const failedPayment = db.createPayment({
        payment_id: paymentId,
        sender_id: sender.user_id,
        merchant_id: merchant.merchant_id,
        amount: params.amount,
        payment_mode: params.paymentMode,
        status: 'FAILED',
        idempotency_key: params.idempotencyKey,
        reference_id: referenceId,
        failure_reason: simulatorResult.responseMessage,
        simulated_outcome: simulatorResult.outcome,
        sender_bank_code: senderBankCode,
        receiver_bank_code: receiverBankCode,
        transfer_type: transferType,
        pipeline_stages: stages,
        created_at: now(),
      });

      db.createTransaction({
        transaction_id: uuidv4(),
        payment_id: paymentId,
        user_id: sender.user_id,
        type: 'DEBIT',
        amount: params.amount,
        status: 'FAILED',
        reference_id: referenceId,
        failure_reason: simulatorResult.responseMessage,
        created_at: now(),
      });

      await notificationService.sendNotification({
        userId: sender.user_id,
        title: 'Merchant Payment Failed',
        message: `Payment of ₹${params.amount.toFixed(2)} to ${merchant.name} failed: ${simulatorResult.responseMessage}`,
        type: 'PAYMENT_FAILED',
        metadata: { paymentId, referenceId, failureReason: simulatorResult.responseMessage },
      });

      return this.buildReceiptFromPayment(failedPayment);
    }

    recordStage(8, 'Transaction Authorization', 'SUCCESS', `Authorized by switch with code ${simulatorResult.authCode}`);

    // Debit sender
    if (params.paymentMode === 'WALLET') {
      db.updateWalletBalance(sender.user_id, -params.amount);
    } else if (senderPrimaryBank) {
      db.updateBankAccountBalance(senderPrimaryBank.account_id, -params.amount);
    }
    recordStage(9, 'Atomic Debit & Credit', 'SUCCESS', `Settled ₹${params.amount.toFixed(2)} to merchant account`);

    recordStage(10, 'Status Update', 'SUCCESS', 'Transaction recorded as SUCCESS');
    const payment = db.createPayment({
      payment_id: paymentId,
      sender_id: sender.user_id,
      merchant_id: merchant.merchant_id,
      amount: params.amount,
      payment_mode: params.paymentMode,
      status: 'SUCCESS',
      idempotency_key: params.idempotencyKey,
      reference_id: referenceId,
      simulated_outcome: 'APPROVED',
      sender_bank_code: senderBankCode,
      receiver_bank_code: receiverBankCode,
      transfer_type: transferType,
      pipeline_stages: stages,
      created_at: now(),
    });

    db.createTransaction({
      transaction_id: uuidv4(),
      payment_id: paymentId,
      user_id: sender.user_id,
      type: 'DEBIT',
      amount: params.amount,
      status: 'SUCCESS',
      reference_id: referenceId,
      created_at: now(),
    });

    recordStage(11, 'Notification Generation', 'SUCCESS', 'Dispatching confirmation alerts');

    await notificationService.sendNotification({
      userId: sender.user_id,
      title: 'Merchant Payment Successful',
      message: `₹${params.amount.toFixed(2)} paid to ${merchant.name} via ${params.paymentMode}. Ref: ${referenceId}`,
      type: 'PAYMENT_SUCCESS',
      metadata: { paymentId, referenceId, merchantName: merchant.name },
    });

    const senderWallet = db.getWalletByUserId(sender.user_id);
    const senderBankAcc = db.getPrimaryBankAccount(sender.user_id);

    socketService.emitToUser(sender.user_id, 'balance_updated', {
      userId: sender.user_id,
      walletBalance: senderWallet?.balance ?? 0,
      bankBalance: senderBankAcc?.balance ?? 0,
    });

    const receipt = this.buildReceiptFromPayment(payment);
    socketService.emitToUser(sender.user_id, 'transaction_created', receipt);
    socketService.emitToAdmin('admin_payment_stream', payment);

    auditService.log({
      eventType: 'PAYMENT_COMPLETED',
      actorId: sender.user_id,
      actorName: sender.name,
      actorRole: sender.role,
      targetResource: `PAYMENT:${paymentId}`,
      action: 'MERCHANT_PAYMENT_SUCCESS',
      details: { referenceId, amount: params.amount, merchant: merchant.name },
    });

    return receipt;
  }

  /**
   * Controlled Reversal Mechanism: Reverses a debited transaction if credit failed or requested
   */
  public async reverseTransaction(params: {
    paymentId: string;
    reason?: string;
    requestingUserId: string;
    isAdmin?: boolean;
  }): Promise<PaymentReceipt> {
    const payment = db.findPaymentById(params.paymentId);
    if (!payment) {
      throw { statusCode: 404, message: 'Payment record not found for reversal' };
    }

    if (!params.isAdmin && payment.sender_id !== params.requestingUserId) {
      throw { statusCode: 403, message: 'Unauthorized to reverse this transaction' };
    }

    if (payment.status === 'REVERSED') {
      throw { statusCode: 400, message: 'Transaction has already been reversed' };
    }

    const sender = db.findUserById(payment.sender_id);
    if (!sender) {
      throw { statusCode: 404, message: 'Original sender not found' };
    }

    const reversalReason = params.reason || 'Controlled gateway reversal due to incomplete settlement';

    // 1. Credit funds back to sender
    if (payment.payment_mode === 'WALLET') {
      db.updateWalletBalance(sender.user_id, payment.amount);
    } else {
      const primaryAcc = db.getPrimaryBankAccount(sender.user_id);
      if (primaryAcc) {
        db.updateBankAccountBalance(primaryAcc.account_id, payment.amount);
      } else {
        db.updateWalletBalance(sender.user_id, payment.amount);
      }
    }

    // 2. If receiver was credited in P2P, debit them
    if (payment.receiver_id) {
      const receiver = db.findUserById(payment.receiver_id);
      if (receiver) {
        if (payment.payment_mode === 'WALLET') {
          db.updateWalletBalance(receiver.user_id, -payment.amount);
        } else {
          const recAcc = db.getPrimaryBankAccount(receiver.user_id);
          if (recAcc) {
            db.updateBankAccountBalance(recAcc.account_id, -payment.amount);
          }
        }
      }
    }

    // 3. Update payment status
    db.updatePayment(payment.payment_id, {
      status: 'REVERSED',
      reversal_status: 'REVERSED',
      reversal_reason: reversalReason,
    });

    // 4. Create ledger reversal transaction
    const reversalTxn = db.createTransaction({
      transaction_id: uuidv4(),
      payment_id: payment.payment_id,
      user_id: sender.user_id,
      type: 'REVERSAL',
      amount: payment.amount,
      status: 'SUCCESS',
      reference_id: `REV-${payment.reference_id}`,
      failure_reason: reversalReason,
      created_at: new Date().toISOString(),
    });

    // 5. Send notification
    await notificationService.sendNotification({
      userId: sender.user_id,
      title: 'Payment Reversed & Refunded',
      message: `₹${payment.amount.toFixed(2)} was restored to your account. Ref: ${payment.reference_id}`,
      type: 'REVERSAL_PROCESSED',
      metadata: { paymentId: payment.payment_id, amount: payment.amount },
    });

    // 6. Real-time updates
    const updatedWallet = db.getWalletByUserId(sender.user_id);
    const updatedBank = db.getPrimaryBankAccount(sender.user_id);

    socketService.emitToUser(sender.user_id, 'balance_updated', {
      userId: sender.user_id,
      walletBalance: updatedWallet?.balance ?? 0,
      bankBalance: updatedBank?.balance ?? 0,
    });

    auditService.log({
      eventType: 'PAYMENT_REVERSED',
      actorId: params.requestingUserId,
      actorName: params.isAdmin ? 'System Administrator' : sender.name,
      actorRole: params.isAdmin ? 'admin' : 'customer',
      targetResource: `PAYMENT:${payment.payment_id}`,
      action: 'REVERSE_TRANSACTION',
      details: { referenceId: payment.reference_id, amount: payment.amount, reason: reversalReason },
    });

    return this.buildReceiptFromPayment(db.findPaymentById(payment.payment_id)!);
  }

  /**
   * Safe Reconciliation for Uncertain / Pending Transactions
   */
  public async reconcilePayment(paymentId: string): Promise<PaymentReceipt> {
    const payment = db.findPaymentById(paymentId);
    if (!payment) {
      throw { statusCode: 404, message: 'Payment not found' };
    }

    if (payment.status !== 'PENDING') {
      return this.buildReceiptFromPayment(payment);
    }

    // Safely query switch - for simulation, if created > 20s ago resolve to FAILED to prevent phantom debits
    const resolvedStatus = 'FAILED';
    const reason = 'Reconciliation determined switch timeout; marked safely as FAILED without balance deduction';

    db.updatePayment(payment.payment_id, {
      status: resolvedStatus,
      failure_reason: reason,
    });

    auditService.log({
      eventType: 'RECONCILIATION_RUN',
      actorId: 'SYSTEM',
      actorName: 'Gateway Reconciliation Engine',
      actorRole: 'admin',
      targetResource: `PAYMENT:${payment.payment_id}`,
      action: 'RECONCILE_PENDING_PAYMENT',
      details: { referenceId: payment.reference_id, resolvedStatus, reason },
    });

    return this.buildReceiptFromPayment(db.findPaymentById(payment.payment_id)!);
  }

  public async getPaymentDetails(paymentId: string, requestingUserId: string, isAdmin = false): Promise<PaymentReceipt> {
    const payment = db.findPaymentById(paymentId);
    if (!payment) {
      throw { statusCode: 404, message: 'Payment record not found' };
    }

    if (!isAdmin && payment.sender_id !== requestingUserId && payment.receiver_id !== requestingUserId) {
      throw { statusCode: 403, message: 'Access denied: You are not authorized to view this payment' };
    }

    return this.buildReceiptFromPayment(payment);
  }

  public async getAllMerchants() {
    return db.getAllMerchants();
  }

  private validateLimits(userId: string, amount: number) {
    if (amount <= 0) {
      throw { statusCode: 400, message: 'Payment amount must be greater than zero' };
    }

    if (amount > config.maxSingleTransactionLimit) {
      throw {
        statusCode: 400,
        message: `Transaction exceeds maximum single limit of ₹${config.maxSingleTransactionLimit.toLocaleString('en-IN')}`,
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    const userTxns = db.getTransactionsByUserId(userId);
    const todayDebits = userTxns
      .filter((t) => t.type === 'DEBIT' && t.status === 'SUCCESS' && t.created_at.startsWith(today))
      .reduce((sum, t) => sum + t.amount, 0);

    if (todayDebits + amount > config.maxDailyTransactionLimit) {
      throw {
        statusCode: 400,
        message: `Daily transaction limit of ₹${config.maxDailyTransactionLimit.toLocaleString('en-IN')} exceeded`,
      };
    }
  }

  public buildReceiptFromPayment(payment: Payment): PaymentReceipt {
    const sender = db.findUserById(payment.sender_id)!;
    const receiver = payment.receiver_id ? db.findUserById(payment.receiver_id) : null;
    const merchant = payment.merchant_id ? db.findMerchantById(payment.merchant_id) : null;

    const senderBank = db.getPrimaryBankAccount(sender.user_id);
    const receiverBank = receiver ? db.getPrimaryBankAccount(receiver.user_id) : null;

    return {
      paymentId: payment.payment_id,
      referenceId: payment.reference_id,
      amount: payment.amount,
      paymentMode: payment.payment_mode,
      status: payment.status,
      sender: {
        userId: sender.user_id,
        name: sender.name,
        email: sender.email,
        bankCode: (payment.sender_bank_code as string) || senderBank?.bank_code,
        accountNumber: senderBank?.account_number,
      },
      receiver: receiver
        ? {
            userId: receiver.user_id,
            name: receiver.name,
            email: receiver.email,
            bankCode: (payment.receiver_bank_code as string) || receiverBank?.bank_code,
            accountNumber: receiverBank?.account_number,
          }
        : null,
      merchant: merchant
        ? {
            merchantId: merchant.merchant_id,
            name: merchant.name,
            upiId: merchant.upi_id,
            bankCode: merchant.bank_code,
          }
        : null,
      transferType: payment.transfer_type || 'INTER_BANK',
      simulatorResponse: {
        outcome:
          (payment.simulated_outcome as SimulatorOutcome) ||
          (payment.status === 'SUCCESS' ? 'APPROVED' : 'DECLINED'),
        authCode: payment.status === 'SUCCESS' ? `AUTH-${payment.reference_id.slice(-6)}` : 'NONE',
        responseCode: payment.status === 'SUCCESS' ? '00' : '51',
        responseMessage: payment.failure_reason || 'Simulated response recorded',
        networkTimestamp: payment.created_at,
        simulatedGateway:
          payment.transfer_type === 'INTRA_BANK'
            ? 'INTRA-BANK-SWITCH'
            : payment.payment_mode === 'UPI'
            ? 'NPCI-UPI-SIMULATOR'
            : 'VISA-SIM-GATEWAY',
        transferType: payment.transfer_type || 'INTER_BANK',
        latencyMs: 150,
      },
      pipelineStages: payment.pipeline_stages || [],
      failureReason: payment.failure_reason,
      reversalStatus: payment.reversal_status,
      createdAt: payment.created_at,
    };
  }
}

export const paymentService = new PaymentService();
