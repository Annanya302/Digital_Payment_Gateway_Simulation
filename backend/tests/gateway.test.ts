import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/config/database.js';

describe('PaySim Multi-Bank Payment Gateway Test Suite', () => {
  beforeEach(() => {
    // Reset in-memory database to clean seed state before each test
    db.seed();
  });

  // ============================================================================
  // 1. USER ACCOUNT SYSTEM & AUTHENTICATION
  // ============================================================================
  describe('User Account System & Authentication', () => {
    it('1. should register a new customer with zero initial balance and linked bank', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Karan Mehra',
          email: 'karan@example.com',
          mobile: '+919988776655',
          password: 'Password123!',
          pin: '4321',
          bankCode: 'HDFC',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('karan@example.com');
      expect(res.body.data.user.role).toBe('customer');
      // Case 2: New account starts with zero balance
      expect(res.body.data.wallet.balance).toBe(0);
      // Case 3: Successful bank selection and verification
      expect(res.body.data.bankAccount).toBeDefined();
      expect(res.body.data.bankAccount.bank_code).toBe('HDFC');
      expect(res.body.data.bankAccount.verification_status).toBe('VERIFIED');
      expect(res.body.data.bankAccount.balance).toBe(0);
      expect(res.body.data.bankAccount.account_number).toContain('HDFC');
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Alex',
          email: 'alex@example.com',
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
      expect(res.body.data.bankAccount).toBeDefined();
      expect(res.body.data.bankAccount.bank_code).toBe('HDFC');
    });

    it('7. should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('18. should block unauthorized access to protected endpoints without token', async () => {
      const res = await request(app).get('/api/wallet');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // 2. WALLET & BANK MANAGEMENT
  // ============================================================================
  describe('Wallet & Bank Account Management', () => {
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
      expect(res.body.data.balance).toBe(25000);
      expect(res.body.data.status).toBe('active');
    });

    it('4. should successfully add demo money to wallet and bank account', async () => {
      // Top up wallet
      const walletRes = await request(app)
        .post('/api/wallet/topup')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ amount: 5000 });

      expect(walletRes.status).toBe(200);
      expect(walletRes.body.data.wallet.balance).toBe(30000);

      // Top up bank account
      const accountsRes = await request(app)
        .get('/api/banks/accounts')
        .set('Authorization', `Bearer ${customerToken}`);

      const primaryAcc = accountsRes.body.data[0];
      const bankTopUpRes = await request(app)
        .post(`/api/banks/accounts/${primaryAcc.account_id}/topup`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ amount: 10000 });

      expect(bankTopUpRes.status).toBe(200);
      expect(bankTopUpRes.body.data.account.balance).toBe(primaryAcc.balance + 10000);
    });

    it('should check bank balance with secure PIN verification', async () => {
      const accountsRes = await request(app)
        .get('/api/banks/accounts')
        .set('Authorization', `Bearer ${customerToken}`);

      const primaryAcc = accountsRes.body.data[0];

      // Reject incorrect PIN
      const failRes = await request(app)
        .post(`/api/banks/accounts/${primaryAcc.account_id}/check-balance`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ pin: '9999' });

      expect(failRes.status).toBe(401);
      expect(failRes.body.message).toMatch(/incorrect pin/i);

      // Accept correct PIN (1234)
      const successRes = await request(app)
        .post(`/api/banks/accounts/${primaryAcc.account_id}/check-balance`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ pin: '1234' });

      expect(successRes.status).toBe(200);
      expect(successRes.body.data.verified).toBe(true);
      expect(typeof successRes.body.data.balance).toBe('number');
    });

    it('should reject top-up with zero or negative amount', async () => {
      const res = await request(app)
        .post('/api/wallet/topup')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ amount: -500 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // 3. PAYMENT PROCESSING ENGINE & PIPELINE
  // ============================================================================
  describe('Payment Processing Pipeline & Bank Rails', () => {
    let alexToken: string;
    let priyaToken: string;

    beforeEach(async () => {
      const alexLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alex@example.com', password: 'Password123!' });
      alexToken = alexLogin.body.data.token;

      const priyaLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'priya@example.com', password: 'Password123!' });
      priyaToken = priyaLogin.body.data.token;
    });

    it('5. should process a successful same-bank (Intra-Bank) transfer (Alex HDFC -> Merchant HDFC)', async () => {
      const res = await request(app)
        .post('/api/payments/merchant')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({
          merchantId: '20000000-0000-0000-0000-000000000001', // Amazon India (HDFC)
          amount: 1500,
          paymentMode: 'WALLET',
          pin: '1234',
          senderBankCode: 'HDFC',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUCCESS');
      expect(res.body.data.transferType).toBe('INTRA_BANK');
      expect(res.body.data.pipelineStages).toHaveLength(11);
      expect(res.body.data.pipelineStages[0].stageName).toBe('Payment Initiation');
      expect(res.body.data.pipelineStages[10].stageName).toBe('Notification Generation');
    });

    it('6. should process a successful inter-bank transfer (Alex HDFC -> Priya SBI)', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 2500,
          paymentMode: 'WALLET',
          pin: '1234',
          senderBankCode: 'HDFC',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUCCESS');
      expect(res.body.data.transferType).toBe('INTER_BANK');
      expect(res.body.data.simulatorResponse.outcome).toBe('APPROVED');
      expect(res.body.data.pipelineStages.length).toBeGreaterThan(0);

      // Verify balance deduction
      const alexWallet = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${alexToken}`);
      expect(alexWallet.body.data.balance).toBe(22500); // 25000 - 2500
    });

    it('7. should reject payment with incorrect PIN without deducting money', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 1000,
          paymentMode: 'WALLET',
          pin: '9999', // Incorrect PIN
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);

      // Verify balance remains unchanged
      const walletRes = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${alexToken}`);
      expect(walletRes.body.data.balance).toBe(25000);
    });

    it('8. should reject payment when wallet has insufficient balance', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 26000, // Exceeds 25000 limit and available balance
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('9. should reject payment to non-existent recipient', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({
          receiverIdentifier: 'ghost_user@unknown.com',
          amount: 500,
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('10. should safely handle gateway TIMEOUT outcome without debiting', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 500.03, // .03 triggers TIMEOUT
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.data.status).toBe('FAILED');
      expect(res.body.data.simulatorResponse.outcome).toBe('TIMEOUT');

      // Verify sender balance is completely untouched
      const walletRes = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${alexToken}`);
      expect(walletRes.body.data.balance).toBe(25000);
    });

    it('11. should handle bank server unavailable failure scenario', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 400.04, // .04 triggers BANK_UNAVAILABLE
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.data.status).toBe('FAILED');
      expect(res.body.data.failureReason).toMatch(/bank server unavailable/i);
    });

    it('12. should prevent duplicate payment processing using Idempotency-Key', async () => {
      const key = `idemp-test-${Date.now()}`;
      const payload = {
        receiverIdentifier: 'priya@example.com',
        amount: 800,
        paymentMode: 'WALLET',
        pin: '1234',
      };

      const res1 = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${alexToken}`)
        .set('Idempotency-Key', key)
        .send(payload);

      expect(res1.status).toBe(200);
      const paymentId1 = res1.body.data.paymentId;

      // Duplicate submission
      const res2 = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${alexToken}`)
        .set('Idempotency-Key', key)
        .send(payload);

      expect(res2.status).toBe(200);
      expect(res2.body.data.paymentId).toBe(paymentId1);

      // Verify wallet was only debited once (25000 - 800 = 24200)
      const walletRes = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${alexToken}`);
      expect(walletRes.body.data.balance).toBe(24200);
    });

    it('13. should maintain failed payment balance integrity', async () => {
      const res = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 100.02, // .02 triggers DECLINED
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(res.status).toBe(400);
      expect(res.body.data.status).toBe('FAILED');

      const walletRes = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${alexToken}`);
      expect(walletRes.body.data.balance).toBe(25000);
    });

    it('14. should successfully reverse a transaction and restore balance', async () => {
      // 1. Make payment
      const paymentRes = await request(app)
        .post('/api/payments/send')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({
          receiverIdentifier: 'priya@example.com',
          amount: 2000,
          paymentMode: 'WALLET',
          pin: '1234',
        });

      expect(paymentRes.status).toBe(200);
      const paymentId = paymentRes.body.data.paymentId;

      // 2. Perform reversal
      const reverseRes = await request(app)
        .post(`/api/payments/${paymentId}/reverse`)
        .set('Authorization', `Bearer ${alexToken}`)
        .send({ reason: 'Accidental payment' });

      expect(reverseRes.status).toBe(200);
      expect(reverseRes.body.data.status).toBe('REVERSED');
      expect(reverseRes.body.data.reversalStatus).toBe('REVERSED');

      // 3. Verify balance restored to original ₹25,000
      const walletRes = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${alexToken}`);
      expect(walletRes.body.data.balance).toBe(25000);
    });
  });

  // ============================================================================
  // 4. ADMIN ACCESS RESTRICTIONS & REAL-TIME ANALYTICS
  // ============================================================================
  describe('Admin Access Restrictions & Analytics', () => {
    let adminToken: string;
    let customerToken: string;

    beforeEach(async () => {
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@paymentgateway.com', password: 'AdminPass123!' });
      adminToken = adminLogin.body.data.token;

      const customerLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alex@example.com', password: 'Password123!' });
      customerToken = customerLogin.body.data.token;
    });

    it('17. should ensure Admin has NO personal wallet and cannot access wallet endpoints', async () => {
      const res = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${adminToken}`);

      // Admin has no wallet, returns 404
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/wallet not found/i);
    });

    it('18. should block standard customer from accessing admin dashboard APIs', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/administrator (privileges|role) required/i);
    });

    it('16. should calculate real bank-wise statistics, hourly activity and metrics for Admin', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { metrics, bankStats, hourlyActivity, dailyVolume, userRegistrationTrends } = res.body.data;
      expect(metrics.totalUsers).toBeGreaterThanOrEqual(4);
      expect(metrics.totalBankAccounts).toBeGreaterThanOrEqual(3);
      expect(bankStats).toHaveLength(5); // SBI, HDFC, ICICI, AXIS, PNB
      expect(bankStats[0]).toHaveProperty('code');
      expect(bankStats[0]).toHaveProperty('healthStatus');
      expect(hourlyActivity).toHaveLength(24);
      expect(dailyVolume).toHaveLength(7);
      expect(userRegistrationTrends).toHaveLength(7);
    });

    it('should view system audit logs via Admin API', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logs).toBeDefined();
    });
  });
});
