import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/config/database.js';

describe('Digital Payment Gateway Simulation Test Suite', () => {
  beforeEach(() => {
    // Reset memory database to seed state before each test
    db.seed();
  });

  // ============================================================================
  // 1. AUTHENTICATION & ACCESS CONTROL
  // ============================================================================
  describe('Authentication Module', () => {
    it('should successfully register a new customer and assign a funded wallet', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Karan Mehra',
          email: 'karan@example.com',
          mobile: '+919988776655',
          password: 'Password123!',
          pin: '4321',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('karan@example.com');
      expect(res.body.data.user.role).toBe('customer');
      expect(res.body.data.wallet.balance).toBe(10000);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Alex',
          email: 'alex@example.com', // Already seeded
          mobile: '+919111222333',
          password: 'Password123!',
          pin: '1234',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('should successfully login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('alex@example.com');
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should block unauthorized access to protected endpoints without token', async () => {
      const res = await request(app).get('/api/wallet');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // 2. WALLET MANAGEMENT
  // ============================================================================
  describe('Wallet Management Module', () => {
    let customerToken: string;

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alex@example.com', password: 'Password123!' });
      customerToken = loginRes.body.data.token;
    });

    it('should view wallet balance and active status', async () => {
      const res = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.balance).toBe(25000);
      expect(res.body.data.currency).toBe('INR');
      expect(res.body.data.status).toBe('active');
    });

    it('should reject top-up with zero or negative amount', async () => {
      const res = await request(app)
        .post('/api/wallet/topup')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ amount: -500 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should successfully top-up wallet balance', async () => {
      const res = await request(app)
        .post('/api/wallet/topup')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ amount: 1500 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.wallet.balance).toBe(26500);
    });
  });

  // ============================================================================
  // 3. PAYMENT PROCESSING ENGINE & BANK SIMULATOR
  // ============================================================================
  describe('Payment Processing Module', () => {
    let senderToken: string;

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alex@example.com', password: 'Password123!' });
      senderToken = loginRes.body.data.token;
    });

    it('should process a successful P2P wallet payment (Alex -> Priya)', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 2000,
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUCCESS');
      expect(res.body.data.referenceId).toMatch(/^TXN-/);
      expect(res.body.data.simulatorResponse.outcome).toBe('APPROVED');

      // Verify wallet balances updated atomically
      const senderWallet = db.getWalletByUserId('00000000-0000-0000-0000-000000000002');
      const receiverWallet = db.getWalletByUserId('00000000-0000-0000-0000-000000000003');
      expect(senderWallet?.balance).toBe(23000); // 25000 - 2000
      expect(receiverWallet?.balance).toBe(20500); // 18500 + 2000
    });

    it('should process a successful simulated UPI payment', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 500,
          paymentMode: 'UPI',
          pin: '1234',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUCCESS');
      expect(res.body.data.paymentMode).toBe('UPI');
    });

    it('should reject payment with invalid simulated PIN without debit', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 1000,
          paymentMode: 'WALLET',
          pin: '9999', // Incorrect PIN
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid payment PIN/i);

      // Verify balance was NOT debited
      const senderWallet = db.getWalletByUserId('00000000-0000-0000-0000-000000000002');
      expect(senderWallet?.balance).toBe(25000);
    });

    it('should reject payment to non-existent receiver', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverIdentifier: 'ghost_user@example.com',
          amount: 1000,
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should reject payment when wallet has insufficient balance', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 24500, // Alex has 25000, but let's test exceeding limit or exceed after
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(res.status).toBe(200); // 24500 succeeds

      // Now balance is 500, try sending 1000
      const secondRes = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 1000,
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(secondRes.status).toBe(400);
      expect(secondRes.body.message).toMatch(/Insufficient wallet balance/i);
    });

    it('should reject payment exceeding single transaction limit (> 25000)', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 30000,
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Validation failed|limit/i);
    });

    it('should handle simulator DECLINED outcome properly and record failure reason', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 1000,
          paymentMode: 'WALLET',
          pin: '1234',
          simulatedOutcome: 'DECLINED', // Explicit test override
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.data.status).toBe('FAILED');
      expect(res.body.data.failureReason).toBeDefined();

      // Ensure balance was NOT debited
      const senderWallet = db.getWalletByUserId('00000000-0000-0000-0000-000000000002');
      expect(senderWallet?.balance).toBe(25000);
    });

    it('should handle simulator TIMEOUT outcome safely without debiting', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 1000,
          paymentMode: 'WALLET',
          pin: '1234',
          simulatedOutcome: 'TIMEOUT',
        });

      expect(res.status).toBe(400);
      expect(res.body.data.status).toBe('FAILED');
      expect(res.body.data.failureReason).toMatch(/timed out/i);

      // Verify no debit
      const senderWallet = db.getWalletByUserId('00000000-0000-0000-0000-000000000002');
      expect(senderWallet?.balance).toBe(25000);
    });

    it('should prevent duplicate payments using Idempotency-Key', async () => {
      const idempotencyKey = 'unique-key-12345';

      const firstCall = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 1500,
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(firstCall.status).toBe(200);
      const firstPaymentId = firstCall.body.data.paymentId;

      // Duplicate call with same key
      const secondCall = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 1500,
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(secondCall.status).toBe(200);
      expect(secondCall.body.data.paymentId).toBe(firstPaymentId);

      // Balance only debited ONCE (25000 - 1500 = 23500)
      const senderWallet = db.getWalletByUserId('00000000-0000-0000-0000-000000000002');
      expect(senderWallet?.balance).toBe(23500);
    });

    it('should process merchant payment successfully', async () => {
      const res = await request(app)
        .post('/api/payments/merchant')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          merchantId: '20000000-0000-0000-0000-000000000001', // Amazon India
          amount: 1200,
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUCCESS');
      expect(res.body.data.merchant.name).toBe('Amazon India');
    });
  });

  // ============================================================================
  // 4. REFUND MANAGEMENT
  // ============================================================================
  describe('Refund Management Module', () => {
    let senderToken: string;
    let paymentId: string;

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alex@example.com', password: 'Password123!' });
      senderToken = loginRes.body.data.token;

      // Make a successful payment to refund
      const payRes = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 3000,
          paymentMode: 'WALLET',
          pin: '1234',
        });

      paymentId = payRes.body.data.paymentId;
    });

    it('should process a valid full refund and restore wallet balance', async () => {
      const res = await request(app)
        .post('/api/refunds')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          paymentId,
          reason: 'Defective item received',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.refund.status).toBe('SUCCESS');
      expect(res.body.data.refund.amount).toBe(3000);

      // Verify wallet restored: was 25000, paid 3000 -> 22000, refunded 3000 -> 25000
      const wallet = db.getWalletByUserId('00000000-0000-0000-0000-000000000002');
      expect(wallet?.balance).toBe(25000);
    });

    it('should reject refund exceeding the original transaction amount', async () => {
      const res = await request(app)
        .post('/api/refunds')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          paymentId,
          amount: 5000, // Original was 3000
          reason: 'Excess refund test',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/exceeds eligible refundable balance/i);
    });

    it('should reject duplicate refund when already fully refunded', async () => {
      // First refund: 3000
      await request(app)
        .post('/api/refunds')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ paymentId, reason: 'First refund' });

      // Second refund attempt
      const res = await request(app)
        .post('/api/refunds')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ paymentId, reason: 'Duplicate refund' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already been fully refunded/i);
    });
  });

  // ============================================================================
  // 5. AUTHORIZATION & TENANT PRIVACY
  // ============================================================================
  describe('Authorization and Tenant Isolation', () => {
    let customerToken: string;
    let adminToken: string;

    beforeEach(async () => {
      const custLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alex@example.com', password: 'Password123!' });
      customerToken = custLogin.body.data.token;

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@paymentgateway.com', password: 'AdminPass123!' });
      adminToken = adminLogin.body.data.token;
    });

    it('should prevent standard customer from accessing admin dashboard APIs', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Administrator privileges required/i);
    });

    it('should allow administrator to access admin dashboard APIs', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalUsers).toBeGreaterThanOrEqual(4);
    });
  });
});
