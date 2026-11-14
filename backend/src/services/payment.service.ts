import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { config } from '../config/env.js';
import { Payment, Transaction, PaymentMode, SimulatorOutcome } from '../types/models.js';
import { bankSimulator, SimulatorResponse } from '../simulators/bankSimulator.js';
import { comparePin } from '../utils/password.js';
import { generateReferenceId } from '../utils/idGenerator.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';

export interface SendMoneyParams {
  senderId: string;
  receiverIdentifier: string;
  amount: number;
  paymentMode: PaymentMode;
  pin: string;
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
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  sender: {
    userId: string;
    name: string;
    email: string;
  };
  receiver?: {
    userId: string;
    name: string;
    email: string;
  } | null;
  merchant?: {
    merchantId: string;
    name: string;
    upiId: string;
  } | null;
  simulatorResponse: SimulatorResponse;
  failureReason?: string | null;
  createdAt: string;
}

export class PaymentService {
  /**
   * P2P: Send money to another registered user
   */
  public async sendMoney(params: SendMoneyParams): Promise<PaymentReceipt> {
    // 1. Check idempotency
    if (params.idempotencyKey) {
      const existing = db.findPaymentByIdempotencyKey(params.idempotencyKey);
      if (existing) {
        logger.info(`[PaymentService] Idempotency match found for key: ${params.idempotencyKey}`);
        return this.buildReceiptFromPayment(existing);
      }
    }

    // 2. Validate sender
    const sender = db.findUserById(params.senderId);
    if (!sender || sender.status !== 'active') {
      throw { statusCode: 403, message: 'Sender account is invalid or inactive' };
    }

    // 3. Verify PIN securely
    const isPinValid = await comparePin(params.pin, sender.pin_hash);
    if (!isPinValid) {
      throw { statusCode: 401, message: 'Invalid payment PIN entered' };
    }

    // 4. Validate receiver
    const receiver = db.findUserByEmailOrMobile(params.receiverIdentifier);
    if (!receiver) {
      throw { statusCode: 404, message: 'Receiver not found with provided email or mobile number' };
    }

    if (receiver.user_id === sender.user_id) {
      throw { statusCode: 400, message: 'Self-transfers via Send Money are not permitted' };
    }

    if (receiver.status !== 'active') {
      throw { statusCode: 400, message: 'Receiver account is inactive or suspended' };
    }

    // 5. Validate limits
    this.validateLimits(params.senderId, params.amount);

    // 6. Validate wallet balance if paying via WALLET
    if (params.paymentMode === 'WALLET') {
      const senderWallet = db.getWalletByUserId(params.senderId);
      if (!senderWallet || senderWallet.status !== 'active') {
        throw { statusCode: 400, message: 'Sender wallet is not active' };
      }
      if (senderWallet.balance < params.amount) {
        throw { statusCode: 400, message: `Insufficient wallet balance. Available: ₹${senderWallet.balance.toFixed(2)}` };
      }
    }

    // 7. Invoke Bank / UPI Simulator
    const cardLast4 = params.cardDetails?.cardNumber?.slice(-4);
    const simulatorResult = await bankSimulator.authorizePayment({
      paymentMode: params.paymentMode,
      amount: params.amount,
      receiverIdentifier: params.receiverIdentifier,
      cardLast4,
      forceOutcome: params.simulatedOutcome,
    });

    const referenceId = generateReferenceId('TXN');
    const paymentId = uuidv4();
    const now = new Date().toISOString();

    // 8. Process Outcome
    if (simulatorResult.outcome === 'APPROVED') {
      // Atomic balance updates
      if (params.paymentMode === 'WALLET') {
        db.updateWalletBalance(sender.user_id, -params.amount);
        db.updateWalletBalance(receiver.user_id, params.amount);
      }

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
        created_at: now,
      });

      // Sender debit transaction ledger
      db.createTransaction({
        transaction_id: uuidv4(),
        payment_id: paymentId,
        user_id: sender.user_id,
        type: 'DEBIT',
        amount: params.amount,
        status: 'SUCCESS',
        reference_id: referenceId,
        created_at: now,
      });

      // Receiver credit transaction ledger
      db.createTransaction({
        transaction_id: uuidv4(),
        payment_id: paymentId,
        user_id: receiver.user_id,
        type: 'CREDIT',
        amount: params.amount,
        status: 'SUCCESS',
        reference_id: referenceId,
        created_at: now,
      });

      // Sender notification
      await notificationService.sendNotification({
        userId: sender.user_id,
        title: 'Payment Successful',
        message: `₹${params.amount.toFixed(2)} sent to ${receiver.name} via ${params.paymentMode}. Ref: ${referenceId}`,
        type: 'PAYMENT_SUCCESS',
        metadata: { paymentId, referenceId, amount: params.amount },
      });

      // Receiver notification
      await notificationService.sendNotification({
        userId: receiver.user_id,
        title: 'Money Received',
        message: `You received ₹${params.amount.toFixed(2)} from ${sender.name} via ${params.paymentMode}.`,
        type: 'PAYMENT_RECEIVED',
        metadata: { paymentId, referenceId, amount: params.amount },
      });

      return {
        paymentId,
        referenceId,
        amount: params.amount,
        paymentMode: params.paymentMode,
        status: 'SUCCESS',
        sender: { userId: sender.user_id, name: sender.name, email: sender.email },
        receiver: { userId: receiver.user_id, name: receiver.name, email: receiver.email },
        merchant: null,
        simulatorResponse: simulatorResult,
        createdAt: now,
      };
    }

    // FAILED or TIMEOUT
    const failureReason =
      simulatorResult.outcome === 'TIMEOUT'
        ? 'Bank gateway timed out during authorization switch'
        : simulatorResult.responseMessage || 'Transaction declined by simulated banking rails';

    const failedPayment = db.createPayment({
      payment_id: paymentId,
      sender_id: sender.user_id,
      receiver_id: receiver.user_id,
      amount: params.amount,
      payment_mode: params.paymentMode,
      status: 'FAILED',
      idempotency_key: params.idempotencyKey,
      reference_id: referenceId,
      failure_reason: failureReason,
      simulated_outcome: simulatorResult.outcome,
      created_at: now,
    });

    db.createTransaction({
      transaction_id: uuidv4(),
      payment_id: paymentId,
      user_id: sender.user_id,
      type: 'DEBIT',
      amount: params.amount,
      status: 'FAILED',
      reference_id: referenceId,
      failure_reason: failureReason,
      created_at: now,
    });

    await notificationService.sendNotification({
      userId: sender.user_id,
      title: 'Payment Failed',
      message: `Payment of ₹${params.amount.toFixed(2)} to ${receiver.name} failed: ${failureReason}`,
      type: 'PAYMENT_FAILED',
      metadata: { paymentId, referenceId, failureReason },
    });

    return {
      paymentId,
      referenceId,
      amount: params.amount,
      paymentMode: params.paymentMode,
      status: 'FAILED',
      sender: { userId: sender.user_id, name: sender.name, email: sender.email },
      receiver: { userId: receiver.user_id, name: receiver.name, email: receiver.email },
      merchant: null,
      simulatorResponse: simulatorResult,
      failureReason,
      createdAt: now,
    };
  }

  /**
   * Pay a registered merchant
   */
  public async payMerchant(params: PayMerchantParams): Promise<PaymentReceipt> {
    if (params.idempotencyKey) {
      const existing = db.findPaymentByIdempotencyKey(params.idempotencyKey);
      if (existing) {
        return this.buildReceiptFromPayment(existing);
      }
    }

    const sender = db.findUserById(params.senderId);
    if (!sender || sender.status !== 'active') {
      throw { statusCode: 403, message: 'Sender account is invalid or inactive' };
    }

    const isPinValid = await comparePin(params.pin, sender.pin_hash);
    if (!isPinValid) {
      throw { statusCode: 401, message: 'Invalid payment PIN entered' };
    }

    const merchant = db.findMerchantById(params.merchantId);
    if (!merchant || merchant.status !== 'active') {
      throw { statusCode: 404, message: 'Merchant not found or inactive' };
    }

    this.validateLimits(params.senderId, params.amount);

    if (params.paymentMode === 'WALLET') {
      const senderWallet = db.getWalletByUserId(params.senderId);
      if (!senderWallet || senderWallet.status !== 'active') {
        throw { statusCode: 400, message: 'Sender wallet is not active' };
      }
      if (senderWallet.balance < params.amount) {
        throw { statusCode: 400, message: `Insufficient wallet balance. Available: ₹${senderWallet.balance.toFixed(2)}` };
      }
    }

    const cardLast4 = params.cardDetails?.cardNumber?.slice(-4);
    const simulatorResult = await bankSimulator.authorizePayment({
      paymentMode: params.paymentMode,
      amount: params.amount,
      receiverIdentifier: merchant.upi_id,
      cardLast4,
      forceOutcome: params.simulatedOutcome,
    });

    const referenceId = generateReferenceId('TXN');
    const paymentId = uuidv4();
    const now = new Date().toISOString();

    if (simulatorResult.outcome === 'APPROVED') {
      if (params.paymentMode === 'WALLET') {
        db.updateWalletBalance(sender.user_id, -params.amount);
      }

      db.createPayment({
        payment_id: paymentId,
        sender_id: sender.user_id,
        merchant_id: merchant.merchant_id,
        amount: params.amount,
        payment_mode: params.paymentMode,
        status: 'SUCCESS',
        idempotency_key: params.idempotencyKey,
        reference_id: referenceId,
        simulated_outcome: 'APPROVED',
        created_at: now,
      });

      db.createTransaction({
        transaction_id: uuidv4(),
        payment_id: paymentId,
        user_id: sender.user_id,
        type: 'DEBIT',
        amount: params.amount,
        status: 'SUCCESS',
        reference_id: referenceId,
        created_at: now,
      });

      await notificationService.sendNotification({
        userId: sender.user_id,
        title: 'Merchant Payment Successful',
        message: `₹${params.amount.toFixed(2)} paid to ${merchant.name} via ${params.paymentMode}. Ref: ${referenceId}`,
        type: 'PAYMENT_SUCCESS',
        metadata: { paymentId, referenceId, merchantName: merchant.name },
      });

      return {
        paymentId,
        referenceId,
        amount: params.amount,
        paymentMode: params.paymentMode,
        status: 'SUCCESS',
        sender: { userId: sender.user_id, name: sender.name, email: sender.email },
        merchant: { merchantId: merchant.merchant_id, name: merchant.name, upiId: merchant.upi_id },
        receiver: null,
        simulatorResponse: simulatorResult,
        createdAt: now,
      };
    }

    // FAILED or TIMEOUT
    const failureReason =
      simulatorResult.outcome === 'TIMEOUT'
        ? 'Bank gateway timed out during authorization switch'
        : simulatorResult.responseMessage || 'Merchant payment declined by simulated banking network';

    db.createPayment({
      payment_id: paymentId,
      sender_id: sender.user_id,
      merchant_id: merchant.merchant_id,
      amount: params.amount,
      payment_mode: params.paymentMode,
      status: 'FAILED',
      idempotency_key: params.idempotencyKey,
      reference_id: referenceId,
      failure_reason: failureReason,
      simulated_outcome: simulatorResult.outcome,
      created_at: now,
    });

    db.createTransaction({
      transaction_id: uuidv4(),
      payment_id: paymentId,
      user_id: sender.user_id,
      type: 'DEBIT',
      amount: params.amount,
      status: 'FAILED',
      reference_id: referenceId,
      failure_reason: failureReason,
      created_at: now,
    });

    await notificationService.sendNotification({
      userId: sender.user_id,
      title: 'Merchant Payment Failed',
      message: `Payment of ₹${params.amount.toFixed(2)} to ${merchant.name} failed: ${failureReason}`,
      type: 'PAYMENT_FAILED',
      metadata: { paymentId, referenceId, failureReason },
    });

    return {
      paymentId,
      referenceId,
      amount: params.amount,
      paymentMode: params.paymentMode,
      status: 'FAILED',
      sender: { userId: sender.user_id, name: sender.name, email: sender.email },
      merchant: { merchantId: merchant.merchant_id, name: merchant.name, upiId: merchant.upi_id },
      receiver: null,
      simulatorResponse: simulatorResult,
      failureReason,
      createdAt: now,
    };
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

    // Daily limit calculation
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

  private buildReceiptFromPayment(payment: Payment): PaymentReceipt {
    const sender = db.findUserById(payment.sender_id)!;
    const receiver = payment.receiver_id ? db.findUserById(payment.receiver_id) : null;
    const merchant = payment.merchant_id ? db.findMerchantById(payment.merchant_id) : null;

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
      },
      receiver: receiver
        ? {
            userId: receiver.user_id,
            name: receiver.name,
            email: receiver.email,
          }
        : null,
      merchant: merchant
        ? {
            merchantId: merchant.merchant_id,
            name: merchant.name,
            upiId: merchant.upi_id,
          }
        : null,
      simulatorResponse: {
        outcome: (payment.simulated_outcome as SimulatorOutcome) || (payment.status === 'SUCCESS' ? 'APPROVED' : 'DECLINED'),
        authCode: payment.status === 'SUCCESS' ? `AUTH-${payment.reference_id.slice(-6)}` : 'NONE',
        responseCode: payment.status === 'SUCCESS' ? '00' : '51',
        responseMessage: payment.failure_reason || 'Simulated response recorded',
        networkTimestamp: payment.created_at,
        simulatedGateway: payment.payment_mode === 'UPI' ? 'NPCI-UPI-SIMULATOR' : 'VISA-SIM-GATEWAY',
        latencyMs: 150,
      },
      failureReason: payment.failure_reason,
      createdAt: payment.created_at,
    };
  }
}

export const paymentService = new PaymentService();
