# System Architecture Documentation
## Digital Payment Gateway Simulation

**Document Version:** 1.0.0  
**Authors:** Ankur, Atul, Anamay, Annanya  
**Date:** November 2026  

---

## 1. Architectural Overview

The **Digital Payment Gateway Simulation** is architected as a modern, decoupled **Layered Client-Server Architecture** designed to emulate modern fintech payment infrastructure (such as Razorpay, Stripe, and NPCI Unified Payments Interface) in an educational, sandboxed environment.

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Client Layer (Next.js 14)"]
        UI_Land["Landing Page (/)"]
        UI_Auth["Auth Pages (/login, /register)"]
        UI_Dash["Customer Dashboard (/dashboard)"]
        UI_Pay["Payment Engine (/send, /merchant)"]
        UI_Wallet["Wallet Ledger (/wallet)"]
        UI_Admin["Admin Analytics (/admin/*)"]
    end

    subgraph AppLayer ["2. Application Layer (Express.js / REST API)"]
        MW_Cors["CORS & Helmet"]
        MW_Auth["JWT Authenticate Middleware"]
        MW_Role["RBAC (requireAdmin)"]
        MW_Val["Zod Schema Validation"]
        Router["Express REST Routers"]
    end

    subgraph ServiceLayer ["3. Service Layer (Business Logic)"]
        S_Auth["AuthService"]
        S_Wallet["WalletService"]
        S_Pay["PaymentService"]
        S_Ledger["TransactionService"]
        S_Refund["RefundService"]
        S_Notif["NotificationService"]
        S_Admin["AdminService"]
        S_Sim["Bank/UPI Simulator"]
    end

    subgraph DataLayer ["4. Data Layer (PostgreSQL / Supabase)"]
        DB_Users[("users")]
        DB_Wallets[("wallets")]
        DB_Merchants[("merchants")]
        DB_Payments[("payments")]
        DB_Txns[("transactions")]
        DB_Refunds[("refunds")]
        DB_Notifs[("notifications")]
    end

    ClientLayer -->|HTTPS / JSON API| AppLayer
    AppLayer --> ServiceLayer
    ServiceLayer --> S_Sim
    ServiceLayer --> DataLayer
```

---

## 2. Layer Definitions

### A. Client Layer (Next.js & React)
- **Role:** Presents an accessible, responsive fintech user interface.
- **Key Concepts:**
  - Client-side navigation with Next.js App Router.
  - Component-driven architecture using reusable design primitives (Card, Badge, Button, Input, Modal).
  - Dynamic simulation controls allowing interactive testing of `APPROVED`, `DECLINED`, and `TIMEOUT` scenarios.
  - State management via React Context (`AuthContext`) handling session tokens, user profiles, and active wallet balance syncing.

### B. Application Layer (Express REST APIs)
- **Role:** Handles HTTP transport, request sanitization, authentication, and role authorization.
- **Key Middleware:**
  - `authenticate`: Extracts and cryptographically verifies Bearer JWT tokens, validating user account status.
  - `requireAdmin`: Enforces administrative RBAC permissions on protected routes.
  - `validateBody(schema)`: Validates incoming request payloads against strict Zod type definitions before passing to controllers.
  - `errorHandler`: Traps all operational and runtime errors, logging stack traces and formatting standard JSON error responses.

### C. Service Layer
- **Role:** Encapsulates core business rules, transactional logic, and bank simulation interactions.
- **Key Services:**
  - `PaymentService`: Orchestrates payment validation, PIN comparison, balance verification, simulator invocation, atomic ledger recording, and multi-party notifications.
  - `BankSimulator`: Decoupled mock switch simulating NPCI UPI and Card authorization switches with realistic latency and deterministic outcome rules.
  - `WalletService`: Manages authoritative ledger balances, safe balance mutations (`balance >= 0`), and top-ups.
  - `RefundService`: Validates refund eligibility, verifies remaining balance, and atomically returns funds.

### D. Data Layer (Database & Storage)
- **Role:** Enforces data integrity, relationships, and persistence.
- **Schema Design:**
  - Foreign key constraints ensure relational integrity (`users -> wallets`, `payments -> transactions`).
  - Check constraints ensure `balance >= 0.00` and `amount > 0.00`.
  - Indexes on `email`, `mobile`, `reference_id`, and `status` optimize query performance.
  - Compatible with Supabase PostgreSQL and includes an in-memory transactional fallback for zero-dependency local runs.

---

## 3. Core Workflow Sequence

### 3.1 End-to-End Payment Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant UI as Next.js Client
    participant API as Express API Layer
    participant Svc as PaymentService
    participant Sim as Bank/UPI Simulator
    participant DB as Data Layer (DB)
    participant Notif as NotificationService

    User->>UI: Selects Mode, Enters Amount, Enters PIN
    UI->>API: POST /api/payments/send
    API->>API: Validate Schema & Authenticate JWT
    API->>Svc: sendMoney(params)
    Svc->>DB: Verify Sender PIN & Available Balance
    Svc->>Sim: authorizePayment({ mode, amount, outcomeOverride })
    Sim-->>Svc: Returns Outcome (APPROVED / DECLINED / TIMEOUT)

    alt Outcome is APPROVED
        Svc->>DB: Atomically Debit Sender Wallet & Credit Receiver
        Svc->>DB: Insert Payment & Ledger Transactions (SUCCESS)
        Svc->>Notif: Dispatch Notifications to Sender & Receiver
        Svc-->>API: Returns PaymentReceipt (Status: SUCCESS)
        API-->>UI: 200 OK + Receipt Data
        UI-->>User: Displays Success Receipt Modal
    else Outcome is DECLINED or TIMEOUT
        Svc->>DB: Insert Payment & Ledger Record (FAILED)
        Svc->>Notif: Dispatch Failure Notification to Sender
        Svc-->>API: Returns PaymentReceipt (Status: FAILED + Reason)
        API-->>UI: 400 Bad Request + Failure Reason
        UI-->>User: Displays Failure Notice & Suggests Retry
    end
```

---

## 4. Security & Safety Model

1. **Simulated Sandbox Boundary:** No real card credentials or bank network tokens are accepted. All account data is virtual.
2. **Credential Protection:** Passwords and PINs are hashed using bcrypt with salt rounds = 10. PINs are never included in API responses or serialized objects.
3. **JWT Stateless Tokens:** Digitally signed JWT tokens carry standard expiry (24 hours).
4. **No Client Trust:** authoritative calculations (balances, eligibility, permissions) are strictly performed server-side.
