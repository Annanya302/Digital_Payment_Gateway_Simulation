-- ==============================================================================
-- PAYSIM – MULTI-BANK PAYMENT GATEWAY AND TRANSACTION PROCESSING SIMULATOR
-- PostgreSQL / Supabase Schema Migration: 001_initial_schema.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ------------------------------------------------------------------------------
-- 2. BANKS TABLE (SIMULATED CORE BANKING SYSTEMS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS banks (
    bank_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE CHECK (code IN ('SBI', 'HDFC', 'ICICI', 'AXIS', 'PNB')),
    ifsc_prefix VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    health_status VARCHAR(20) NOT NULL DEFAULT 'ONLINE' CHECK (health_status IN ('ONLINE', 'DEGRADED', 'DOWN')),
    latency_ms INTEGER NOT NULL DEFAULT 200,
    logo_color VARCHAR(20) NOT NULL DEFAULT '#1e293b'
);

CREATE INDEX IF NOT EXISTS idx_banks_code ON banks(code);

-- ------------------------------------------------------------------------------
-- 3. BANK ACCOUNTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    bank_id VARCHAR(50) NOT NULL REFERENCES banks(bank_id),
    bank_name VARCHAR(100) NOT NULL,
    bank_code VARCHAR(10) NOT NULL,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    ifsc_code VARCHAR(20) NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'SAVINGS' CHECK (account_type IN ('SAVINGS', 'CURRENT')),
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'PENDING')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_number ON bank_accounts(account_number);

-- ------------------------------------------------------------------------------
-- 4. WALLETS TABLE (New customer accounts start with ₹0.00)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
    wallet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    daily_limit NUMERIC(14, 2) NOT NULL DEFAULT 50000.00 CHECK (daily_limit >= 0.00),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'frozen')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON wallets(status);

-- ------------------------------------------------------------------------------
-- 5. MERCHANTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchants (
    merchant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    upi_id VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL DEFAULT 'E-Commerce',
    bank_code VARCHAR(10) DEFAULT 'HDFC',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchants_upi ON merchants(upi_id);

-- ------------------------------------------------------------------------------
-- 6. PAYMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(user_id),
    receiver_id UUID REFERENCES users(user_id),
    merchant_id UUID REFERENCES merchants(merchant_id),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('WALLET', 'UPI', 'CARD', 'NET_BANKING')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REVERSED')),
    idempotency_key VARCHAR(100) UNIQUE,
    reference_id VARCHAR(50) NOT NULL UNIQUE,
    failure_reason TEXT,
    simulated_outcome VARCHAR(30) DEFAULT 'APPROVED',
    sender_bank_code VARCHAR(10),
    receiver_bank_code VARCHAR(10),
    transfer_type VARCHAR(20) DEFAULT 'INTER_BANK',
    pipeline_stages JSONB DEFAULT '[]'::jsonb,
    reversal_status VARCHAR(20) DEFAULT 'NONE',
    reversal_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_sender ON payments(sender_id);
CREATE INDEX IF NOT EXISTS idx_payments_receiver ON payments(receiver_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. TRANSACTIONS TABLE (LEDGER)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('DEBIT', 'CREDIT', 'REFUND', 'REVERSAL')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    reference_id VARCHAR(50) NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ------------------------------------------------------------------------------
-- 8. REFUNDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refunds (
    refund_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_payment_id UUID NOT NULL REFERENCES payments(payment_id),
    user_id UUID NOT NULL REFERENCES users(user_id),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REJECTED')),
    reason TEXT NOT NULL,
    reference_id VARCHAR(50) NOT NULL UNIQUE,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
    type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    read_status BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    actor_id VARCHAR(50) NOT NULL,
    actor_name VARCHAR(100) NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    target_resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
