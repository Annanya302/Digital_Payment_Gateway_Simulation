import { PaymentMode, SimulatorOutcome } from '../types/models.js';
import { logger } from '../utils/logger.js';

export interface SimulatorRequest {
  paymentMode: PaymentMode;
  amount: number;
  receiverIdentifier?: string; // UPI ID or email/mobile or merchant upi
  cardLast4?: string;
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
   * Process payment through simulated banking / UPI rails
   */
  public async authorizePayment(req: SimulatorRequest): Promise<SimulatorResponse> {
    const startTime = Date.now();
    logger.info(`[BankSimulator] Initiating authorization for mode: ${req.paymentMode}, amount: ₹${req.amount}`);

    // Determine target outcome
    const outcome = this.determineOutcome(req);

    // Simulated network latency
    const delay = req.simulateDelayMs !== undefined 
      ? req.simulateDelayMs 
      : outcome === 'TIMEOUT' ? 1200 : 250;

    await new Promise((resolve) => setTimeout(resolve, delay));

    const latencyMs = Date.now() - startTime;
    const networkTimestamp = new Date().toISOString();
    const gatewayName = req.paymentMode === 'UPI' ? 'NPCI-UPI-SIMULATOR' : req.paymentMode === 'CARD' ? 'VISA-SIM-GATEWAY' : 'CORE-WALLET-ENGINE';

    if (outcome === 'APPROVED') {
      const authCode = `AUTH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      logger.info(`[BankSimulator] Authorization APPROVED: ${authCode}`);
      return {
        outcome: 'APPROVED',
        authCode,
        responseCode: '00',
        responseMessage: 'Simulated Payment Authorized Successfully',
        networkTimestamp,
        simulatedGateway: gatewayName,
        latencyMs,
      };
    }

    if (outcome === 'DECLINED') {
      logger.warn(`[BankSimulator] Authorization DECLINED by simulated issuing bank`);
      return {
        outcome: 'DECLINED',
        authCode: 'NONE',
        responseCode: '51',
        responseMessage: 'Payment declined by simulated issuing bank (Do Not Honor / Insufficient Funds)',
        networkTimestamp,
        simulatedGateway: gatewayName,
        latencyMs,
      };
    }

    // TIMEOUT scenario
    logger.error(`[BankSimulator] Simulated Gateway TIMEOUT reached`);
    return {
      outcome: 'TIMEOUT',
      authCode: 'TIMEOUT',
      responseCode: '91',
      responseMessage: 'Gateway authorization timeout. No response received from simulated bank switch.',
      networkTimestamp,
      simulatedGateway: gatewayName,
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
    }

    // 3. Card triggers
    if (req.cardLast4) {
      if (req.cardLast4 === '0002' || req.cardLast4 === '9992') return 'DECLINED';
      if (req.cardLast4 === '0003' || req.cardLast4 === '9993') return 'TIMEOUT';
    }

    // 4. Amount fraction triggers for easy testing:
    // Any amount ending in .02 (e.g., 100.02) triggers DECLINE
    // Any amount ending in .03 (e.g., 100.03) triggers TIMEOUT
    const cents = Math.round((req.amount - Math.floor(req.amount)) * 100);
    if (cents === 2) return 'DECLINED';
    if (cents === 3) return 'TIMEOUT';

    // Default to APPROVED
    return 'APPROVED';
  }
}

export const bankSimulator = BankSimulator.getInstance();
