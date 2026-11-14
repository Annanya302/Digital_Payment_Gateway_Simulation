-- ==============================================================================
-- DIGITAL PAYMENT GATEWAY SIMULATION
-- PostgreSQL / Supabase Seed Data
-- File: seed_data.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED USERS
-- Password for Customer: Password123! -> $2b$10$/yfPfVO3JbWBVbw8lj.p0.o/VMvM4Mb9emBAkjme3qw1vrBi/P2xC
-- Password for Admin: AdminPass123!    -> $2b$10$.aEPML.jIGKXrLDMadNu7egRcdUNVeXrjSwkZPwTPit4OhOz/.Bve
-- PIN for all users: 1234             -> $2b$10$pgYwrwN1uaKa7UP1dmnnEuuzUaUMf1ZxAm57QhrHpOhC2nWGl.el.
-- ------------------------------------------------------------------------------

-- Admin User
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
-- 2. SEED WALLETS
-- ------------------------------------------------------------------------------
INSERT INTO wallets (wallet_id, user_id, balance, currency, daily_limit, status)
VALUES 
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 100000.00, 'INR', 100000.00, 'active'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 25000.00,  'INR', 50000.00,  'active'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 18500.00,  'INR', 50000.00,  'active'),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 5000.00,   'INR', 50000.00,  'active')
ON CONFLICT (user_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. SEED MERCHANTS
-- ------------------------------------------------------------------------------
INSERT INTO merchants (merchant_id, name, upi_id, category, status)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'Amazon India', 'amazonpay@upi', 'E-Commerce', 'active'),
    ('20000000-0000-0000-0000-000000000002', 'Swiggy Foods', 'swiggy@upi', 'Food & Dining', 'active'),
    ('20000000-0000-0000-0000-000000000003', 'Flipkart Shopping', 'flipkart@upi', 'E-Commerce', 'active'),
    ('20000000-0000-0000-0000-000000000004', 'Netflix Entertainment', 'netflix@upi', 'Entertainment', 'active'),
    ('20000000-0000-0000-0000-000000000005', 'Uber India Mobility', 'uber@upi', 'Travel & Transit', 'active')
ON CONFLICT (upi_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. SEED SAMPLE NOTIFICATIONS
-- ------------------------------------------------------------------------------
INSERT INTO notifications (notification_id, user_id, title, message, channel, type, read_status)
VALUES
    ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Welcome to Digital Payment Simulation', 'Your wallet has been credited with ₹25,000.00 simulated demo funds.', 'IN_APP', 'SYSTEM', true),
    ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Welcome to Digital Payment Simulation', 'Your wallet has been credited with ₹18,500.00 simulated demo funds.', 'IN_APP', 'SYSTEM', true)
ON CONFLICT DO NOTHING;
