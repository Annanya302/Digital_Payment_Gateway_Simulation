-- ==============================================================================
-- PAYSIM – MULTI-BANK PAYMENT GATEWAY AND TRANSACTION PROCESSING SIMULATOR
-- PostgreSQL / Supabase Seed Data
-- File: seed_data.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED USERS
-- Password for Customer: Password123! -> $2b$10$/yfPfVO3JbWBVbw8lj.p0.o/VMvM4Mb9emBAkjme3qw1vrBi/P2xC
-- Password for Admin: AdminPass123!    -> $2b$10$.aEPML.jIGKXrLDMadNu7egRcdUNVeXrjSwkZPwTPit4OhOz/.Bve
-- PIN for all users: 1234             -> $2b$10$pgYwrwN1uaKa7UP1dmnnEuuzUaUMf1ZxAm57QhrHpOhC2nWGl.el.
-- ------------------------------------------------------------------------------

-- Admin User (Strictly Monitoring-Only: No Wallet, No Bank Account)
INSERT INTO users (user_id, name, email, mobile, password_hash, pin_hash, role, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'System Administrator',
    'admin@paymentgateway.com',
    '+919876543210',
    '$2b$10$.aEPML.jIGKXrLDMadNu7egRcdUNVeXrjSwkZPwTPit4OhOz/.Bve',
    '$2b$10$pgYwrwN1uaKa7UP1dmnnEuuzUaUMf1ZxAm57QhrHpOhC2nWGl.el.',
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Customer 1: Alex Rivera
INSERT INTO users (user_id, name, email, mobile, password_hash, pin_hash, role, status)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Alex Rivera',
    'alex@example.com',
    '+919876543211',
    '$2b$10$/yfPfVO3JbWBVbw8lj.p0.o/VMvM4Mb9emBAkjme3qw1vrBi/P2xC',
    '$2b$10$pgYwrwN1uaKa7UP1dmnnEuuzUaUMf1ZxAm57QhrHpOhC2nWGl.el.',
    'customer',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Customer 2: Priya Sharma
INSERT INTO users (user_id, name, email, mobile, password_hash, pin_hash, role, status)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'Priya Sharma',
    'priya@example.com',
    '+919876543212',
    '$2b$10$/yfPfVO3JbWBVbw8lj.p0.o/VMvM4Mb9emBAkjme3qw1vrBi/P2xC',
    '$2b$10$pgYwrwN1uaKa7UP1dmnnEuuzUaUMf1ZxAm57QhrHpOhC2nWGl.el.',
    'customer',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Customer 3: Rohit Verma
INSERT INTO users (user_id, name, email, mobile, password_hash, pin_hash, role, status)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    'Rohit Verma',
    'rohit@example.com',
    '+919876543213',
    '$2b$10$/yfPfVO3JbWBVbw8lj.p0.o/VMvM4Mb9emBAkjme3qw1vrBi/P2xC',
    '$2b$10$pgYwrwN1uaKa7UP1dmnnEuuzUaUMf1ZxAm57QhrHpOhC2nWGl.el.',
    'customer',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. SEED CORE SIMULATED BANKS
-- ------------------------------------------------------------------------------
INSERT INTO banks (bank_id, name, code, ifsc_prefix, status, health_status, latency_ms, logo_color)
VALUES
    ('bank-sbi-001',   'State Bank of India',  'SBI',   'SBIN000', 'active', 'ONLINE', 220, '#1d4ed8'),
    ('bank-hdfc-002',  'HDFC Bank',             'HDFC',  'HDFC000', 'active', 'ONLINE', 180, '#0284c7'),
    ('bank-icici-003', 'ICICI Bank',            'ICICI', 'ICIC000', 'active', 'ONLINE', 190, '#ea580c'),
    ('bank-axis-004',  'Axis Bank',             'AXIS',  'UTIB000', 'active', 'ONLINE', 210, '#be185d'),
    ('bank-pnb-005',   'Punjab National Bank',  'PNB',   'PUNB000', 'active', 'ONLINE', 250, '#ca8a04')
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. SEED BANK ACCOUNTS FOR CUSTOMERS
-- ------------------------------------------------------------------------------
INSERT INTO bank_accounts (account_id, user_id, bank_id, bank_name, bank_code, account_number, ifsc_code, account_type, balance, is_primary, verification_status)
VALUES
    ('acc-alex-001',  '00000000-0000-0000-0000-000000000002', 'bank-hdfc-002', 'HDFC Bank',            'HDFC',  'HDFC10098765432', 'HDFC0004567', 'SAVINGS', 50000.00, true, 'VERIFIED'),
    ('acc-priya-002', '00000000-0000-0000-0000-000000000003', 'bank-sbi-001',  'State Bank of India', 'SBI',   'SBIN10045678901', 'SBIN0001234', 'SAVINGS', 40000.00, true, 'VERIFIED'),
    ('acc-rohit-003', '00000000-0000-0000-0000-000000000004', 'bank-icici-003', 'ICICI Bank',          'ICICI', 'ICIC10023456789', 'ICIC0007890', 'SAVINGS', 15000.00, true, 'VERIFIED')
ON CONFLICT (account_number) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. SEED CUSTOMER WALLETS (Admin has NO wallet)
-- ------------------------------------------------------------------------------
INSERT INTO wallets (wallet_id, user_id, balance, currency, daily_limit, status)
VALUES 
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 25000.00,  'INR', 50000.00,  'active'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 18500.00,  'INR', 50000.00,  'active'),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 5000.00,   'INR', 50000.00,  'active')
ON CONFLICT (user_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. SEED MERCHANTS
-- ------------------------------------------------------------------------------
INSERT INTO merchants (merchant_id, name, upi_id, category, bank_code, status)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'Amazon India', 'amazonpay@upi', 'E-Commerce', 'HDFC', 'active'),
    ('20000000-0000-0000-0000-000000000002', 'Swiggy Foods', 'swiggy@upi', 'Food & Dining', 'ICICI', 'active'),
    ('20000000-0000-0000-0000-000000000003', 'Flipkart Shopping', 'flipkart@upi', 'E-Commerce', 'AXIS', 'active'),
    ('20000000-0000-0000-0000-000000000004', 'Netflix Entertainment', 'netflix@upi', 'Entertainment', 'SBI', 'active'),
    ('20000000-0000-0000-0000-000000000005', 'Uber India Mobility', 'uber@upi', 'Travel & Transit', 'PNB', 'active')
ON CONFLICT (upi_id) DO NOTHING;
