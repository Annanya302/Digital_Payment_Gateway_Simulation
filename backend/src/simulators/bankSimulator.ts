import { PaymentMode, SimulatorOutcome, BankCode } from '../types/models.js';
import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface SimulatorRequest {
  paymentMode: PaymentMode;
  amount: number;
  receiverIdentifier?: string; // UPI ID or email/mobile or merchant upi
  cardLast4?: string;
  senderBankCode?: BankCode | string;
  receiverBankCode?: BankCode | string;
  forceOutcome?: SimulatorOutcome;
  simulateDelayMs?: number;
}

export interface SimulatorResponse {
  outcome: SimulatorOutcome;
  authCode: string;
  responseCode: string;
  responseMessage: string;
  networkTimestamp: string;
  simulatedGateway: string;
  transferType: 'INTRA_BANK' | 'INTER_BANK';
  latencyMs: number;
}

export class BankSimulator {
  private static instance: BankSimulator;

  private constructor() {}

  public static getInstance(): BankSimulator {
    if (!BankSimulator.instance) {
      BankSimulator.instance = new BankSimulator();
    }
    return BankSimulator.instance;
  }

  /**
   * Process payment through simulated multi-bank rails
   */
  public async authorizePayment(req: SimulatorRequest): Promise<SimulatorResponse> {
    const startTime = Date.now();
    logger.info(
      `[BankSimulator] Authorizing payment mode: ${req.paymentMode}, amount: ₹${req.amount}, senderBank: ${req.senderBankCode || 'DEFAULT'}, receiverBank: ${req.receiverBankCode || 'DEFAULT'}`
    );

    const isSameBank =
      Boolean(req.senderBankCode && req.receiverBankCode && req.senderBankCode === req.receiverBankCode);
    const transferType: 'INTRA_BANK' | 'INTER_BANK' = isSameBank ? 'INTRA_BANK' : 'INTER_BANK';

    // 1. Check if the issuing or acquiring bank server is currently simulated as DOWN
    if (req.senderBankCode) {
      const senderBank = db.findBankByCode(req.senderBankCode);
      if (senderBank && senderBank.health_status === 'DOWN') {
        return {
          outcome: 'BANK_UNAVAILABLE',
          authCode: 'NONE',
          responseCode: '96',
          responseMessage: `Bank Server Unavailable: ${senderBank.name} core banking switch is offline`,
          networkTimestamp: new Date().toISOString(),
          simulatedGateway: `${senderBank.code}-CBS-SIMULATOR`,
          transferType,
          latencyMs: 120,
        };
      }
    }

    if (req.receiverBankCode) {
      const receiverBank = db.findBankByCode(req.receiverBankCode);
      if (receiverBank && receiverBank.health_status === 'DOWN') {
        return {
          outcome: 'BANK_UNAVAILABLE',
          authCode: 'NONE',
          responseCode: '96',
          responseMessage: `Bank Server Unavailable: Recipient bank switch (${receiverBank.name}) is offline`,
          networkTimestamp: new Date().toISOString(),
          simulatedGateway: `${receiverBank.code}-CBS-SIMULATOR`,
          transferType,
          latencyMs: 140,
        };
      }
    }

    // Check if either bank switch is DEGRADED (high load / elevated network latency)
    let isDegraded = false;
    let degradedBankName = '';
    if (req.senderBankCode) {
      const senderBank = db.findBankByCode(req.senderBankCode);
      if (senderBank && senderBank.health_status === 'DEGRADED') {
        isDegraded = true;
        degradedBankName = senderBank.name;
      }
    }
    if (req.receiverBankCode) {
      const receiverBank = db.findBankByCode(req.receiverBankCode);
      if (receiverBank && receiverBank.health_status === 'DEGRADED') {
        isDegraded = true;
        degradedBankName = receiverBank.name;
      }
    }

    // 2. Determine target outcome
    const outcome = this.determineOutcome(req);

    // 3. Simulated network latency (elevated if switch is DEGRADED)
    const baseDelay =
      outcome === 'TIMEOUT'
        ? 1200
        : outcome === 'BANK_UNAVAILABLE'
        ? 350
        : 250;

    const delay =
      req.simulateDelayMs !== undefined
        ? req.simulateDelayMs
        : isDegraded
        ? baseDelay + 1500
        : baseDelay;

    await new Promise((resolve) => setTimeout(resolve, delay));

    const latencyMs = Date.now() - startTime;
    const networkTimestamp = new Date().toISOString();

    const gatewayName = isSameBank
      ? `${req.senderBankCode || 'CORE'}-INTRA-SWITCH`
      : req.paymentMode === 'UPI'
      ? 'NPCI-UPI-INTERBANK-SWITCH'
      : req.paymentMode === 'CARD'
      ? 'VISA-RUPAY-INTERCHANGE-SWITCH'
      : 'NEFT-RTGS-INTERBANK-CLEARING';

    if (outcome === 'APPROVED') {
      const authCode = `AUTH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      logger.info(`[BankSimulator] Authorization APPROVED: ${authCode}`);
      return {
        outcome: 'APPROVED',
        authCode,
        responseCode: '00',
        responseMessage: isSameBank
          ? `Intra-Bank Transfer Authorized Instantly${isDegraded ? ` (Degraded Switch: ${degradedBankName} under high load)` : ''}`
          : `Inter-Bank Authorization Cleared via Clearing House${isDegraded ? ` (Degraded Switch: ${degradedBankName} under high load)` : ''}`,
        networkTimestamp,
        simulatedGateway: gatewayName,
        transferType,
        latencyMs,
      };
    }

    if (outcome === 'DECLINED') {
      logger.warn(`[BankSimulator] Authorization DECLINED by issuing bank switch`);
      return {
        outcome: 'DECLINED',
        authCode: 'NONE',
        responseCode: '51',
        responseMessage: 'Payment declined by issuing bank (Risk Assessment / Policy Rejection)',
        networkTimestamp,
        simulatedGateway: gatewayName,
        transferType,
        latencyMs,
      };
    }

    if (outcome === 'BANK_UNAVAILABLE') {
      logger.warn(`[BankSimulator] Bank server unavailable`);
      return {
        outcome: 'BANK_UNAVAILABLE',
        authCode: 'NONE',
        responseCode: '96',
        responseMessage: 'Bank server unavailable. Switch encountered 503 Service Unavailable.',
        networkTimestamp,
        simulatedGateway: gatewayName,
        transferType,
        latencyMs,
      };
    }

    // TIMEOUT scenario
    logger.error(`[BankSimulator] Simulated Gateway TIMEOUT reached`);
    return {
      outcome: 'TIMEOUT',
      authCode: 'TIMEOUT',
      responseCode: '91',
      responseMessage: 'Gateway authorization timeout. No response received from simulated bank switch within SLA.',
      networkTimestamp,
      simulatedGateway: gatewayName,
      transferType,
      latencyMs,
    };
  }

  /**
   * Rules to determine simulator outcome deterministically
   */
  private determineOutcome(req: SimulatorRequest): SimulatorOutcome {
    // 1. Explicit override (from UI testing controls or test cases)
    if (req.forceOutcome) {
      return req.forceOutcome;
    }

    // 2. UPI identifier triggers
    if (req.receiverIdentifier) {
      const id = req.receiverIdentifier.toLowerCase();
      if (id.includes('decline') || id.includes('fail')) return 'DECLINED';
      if (id.includes('timeout')) return 'TIMEOUT';
      if (id.includes('unavailable') || id.includes('down')) return 'BANK_UNAVAILABLE';
    }

    // 3. Card triggers
    if (req.cardLast4) {
      if (req.cardLast4 === '0002' || req.cardLast4 === '9992') return 'DECLINED';
      if (req.cardLast4 === '0003' || req.cardLast4 === '9993') return 'TIMEOUT';
      if (req.cardLast4 === '0004' || req.cardLast4 === '9994') return 'BANK_UNAVAILABLE';
    }

    // 4. Amount fraction triggers for deterministic testing:
    // Any amount ending in .02 (e.g., 100.02) triggers DECLINED
    // Any amount ending in .03 (e.g., 100.03) triggers TIMEOUT
    // Any amount ending in .04 (e.g., 100.04) triggers BANK_UNAVAILABLE
    const cents = Math.round((req.amount - Math.floor(req.amount)) * 100);
    if (cents === 2) return 'DECLINED';
    if (cents === 3) return 'TIMEOUT';
    if (cents === 4) return 'BANK_UNAVAILABLE';

    // Default to APPROVED
    return 'APPROVED';
  }
}

export const bankSimulator = BankSimulator.getInstance();
