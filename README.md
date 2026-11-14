# Digital Payment Gateway Simulation

> **Academic & Educational Notice:**  
> This project is a digital payment simulation platform designed solely for educational, research, and technical evaluation purposes. **No real banking networks, real UPI handles, credit card networks, or real currency transfers are involved.** All transactions, balances, and authorization switches operate on fictional simulated rails.

---

## 1. Project Overview

The **Digital Payment Gateway Simulation** is a full-stack web application that demonstrates the mechanics of modern digital payment infrastructure. It models how digital payments are initiated by customers, validated against business and risk rules, routed to banking authorization switches (UPI & Card networks), settled atomically in ledger databases, audited by administrators, and refunded when requested.

### 1.1 Problem Statement
Modern fintech and payment engineering involve complex distributed workflows:
- Two-phase authorization and atomic settlements
- Idempotency to prevent duplicate payments during client retries
- Secure handling of payment credentials and authorization PINs
- Graceful handling of network timeouts, merchant declines, and partial refunds
- Role-based security isolating customers from administrative audit telemetry

Traditional educational projects often stop at static UI mockups or simple CRUD databases. This project bridges that gap by implementing a production-grade full-stack simulation with an independent Bank/UPI switch simulator, atomic balance management, and multi-tenant authorization.

### 1.2 Objectives
1. Simulate the complete lifecycle of digital payments (P2P and Merchant checkout).
2. Implement realistic Bank/UPI switches providing deterministic `APPROVED`, `DECLINED`, and `TIMEOUT` responses.
3. Guarantee atomic balance debits and credits with strict negative-balance protection.
4. Provide full idempotency support using idempotency keys.
5. Offer full-featured customer and administrator web portals built with modern UI/UX design.
6. Provide an automated test suite verifying security, business logic, and error boundaries.

---

## 2. Team Members & Contributions

| Team Member | Responsibility |
|---|---|
| **Ankur** | Coding and Testing |
| **Atul** | Coding and Testing |
| **Anamay** | Documentation |
| **Annanya** | Design |

---

## 3. Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router, Server & Client Components)
- **Library:** React 18, TypeScript
- **Styling:** Tailwind CSS (Fintech banking theme)
- **Icons:** Lucide React
- **State Management:** React Context (`AuthProvider`)

### Backend & API Layer
- **Runtime:** Node.js (v24 LTS)
- **Framework:** Express.js 4 (TypeScript)
- **Security:** Helmet, CORS, JWT (`jsonwebtoken`), Salted Hashing (`bcryptjs`)
- **Schema Validation:** Zod
- **API Architecture:** Layered Client-Server REST APIs

### Database & Storage
- **Primary Database Engine:** Supabase / PostgreSQL
- **Data Integrity:** ACID Transactions, Unique Constraints, Foreign Keys with Cascade/Restrict, Check constraints (`balance >= 0.00`, `amount > 0.00`)
- **Local Fallback Engine:** Built-in in-memory transactional datastore pre-seeded with default demo data, enabling 100% zero-configuration offline execution and lightning-fast automated testing.

### Testing & Quality Assurance
- **Test Runner:** Vitest
- **HTTP Assertion:** Supertest
- **Test Coverage:** 23 Comprehensive automated tests covering Authentication, Wallet, Payment Engine, Bank Simulator, Refunds, and RBAC isolation.

---

## 4. System Architecture

The application adopts a 4-tier Layered Architecture:

```
[ Client Layer (Next.js 14 / Tailwind CSS) ]
                   │
                   ▼ (HTTPS / JSON REST API)
[ Application Layer (Express / Middleware / Zod Validation / RBAC) ]
                   │
                   ▼
[ Service Layer (PaymentEngine, WalletService, BankSimulator, RefundService) ]
                   │
                   ▼
[ Data Layer (PostgreSQL / Supabase Schema / ACID Transactions) ]
```

1. **Client Layer:** Next.js web application offering customer dashboards, wallet top-up modals, P2P send forms, merchant payment checkouts, transaction history, receipts, in-app notifications, and admin monitoring.
2. **Application Layer:** Express router enforcing request schema validation, JWT verification, and role checks (`requireAdmin`).
3. **Service Layer:** Independent business logic services handling balance validation, cryptographic PIN verification, simulator routing, idempotency lookups, and notification dispatching.
4. **Data Layer:** Normalized relational schema ensuring referential integrity and atomic updates.

---

## 5. Bank & UPI Simulator

The payment engine delegates authorization to an independent **Bank Simulator** that emulates banking rails (NPCI UPI & Card Switches) without making external network calls:

### Simulator Outcomes
- **`APPROVED` (Code: 00):** Simulated switch authorizes payment, generates an authorization code (`AUTH-XXXXXX`), debits the sender wallet, credits the receiver/merchant, and updates status to `SUCCESS`.
- **`DECLINED` (Code: 51):** Simulated switch rejects authorization (e.g. card invalid, bank network rejection). Sender wallet is **NOT** debited. Payment recorded as `FAILED` with failure reason.
- **`TIMEOUT` (Code: 91):** Simulated gateway timeout (1200ms delay). Safe handling prevents phantom debits; status recorded as `FAILED` due to timeout.

### Interactive Simulator Controls
Developers and evaluators can deterministically trigger any outcome:
- **UI Control Panel:** Toggle between **Auto**, **Force Approved**, **Force Declined**, and **Force Timeout** on the Send Money and Pay Merchant pages.
- **Amount Triggers:**
  - Any amount ending in `.02` (e.g. `₹100.02`) triggers **DECLINED**.
  - Any amount ending in `.03` (e.g. `₹100.03`) triggers **TIMEOUT**.
- **UPI Identifier Triggers:** Handles containing `decline` or `timeout`.
- **Card Triggers:** Card numbers ending in `0002` (decline) or `0003` (timeout).

---

## 6. Pre-Seeded Test Accounts

| Persona | Email | Password | Default PIN | Initial Balance | Capabilities |
|---|---|---|---|---|---|
| **Customer (Alex)** | `alex@example.com` | `Password123!` | `1234` | ₹25,000.00 | Send money, pay merchants, refunds |
| **Customer (Priya)** | `priya@example.com` | `Password123!` | `1234` | ₹18,500.00 | Receive money, P2P transfers |
| **Customer (Rohit)** | `rohit@example.com` | `Password123!` | `1234` | ₹5,000.00 | Receive money, P2P transfers |
| **Admin** | `admin@paymentgateway.com` | `AdminPass123!` | `1234` | ₹100,000.00 | Global monitoring, audit, user directory |

*Demo 1-click autofill buttons are built into the Login screen for rapid testing.*

---

## 7. Project Directory Structure

```text
Digital_Payment_Gateway_Simulation/
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore configuration
├── README.md                        # Master documentation
│
├── backend/                         # Express.js REST API & Simulator
│   ├── .env                         # Local environment settings
│   ├── package.json                 # Backend dependencies & scripts
│   ├── tsconfig.json                # TypeScript compiler configuration
│   ├── vitest.config.ts             # Vitest test runner configuration
│   ├── src/
│   │   ├── app.ts                   # Express server setup & middleware
│   │   ├── index.ts                 # Server entry point (port 5000)
│   │   ├── config/                  # Database repository & env config
│   │   ├── controllers/             # Express API controllers
│   │   ├── middleware/              # Auth, RBAC, Validation, Error handlers
│   │   ├── routes/                  # Modular REST route definitions
│   │   ├── services/                # Payment, Wallet, Refund, Admin services
│   │   ├── simulators/              # Bank & UPI Switch Simulator
│   │   ├── types/                   # TypeScript entity models
│   │   ├── utils/                   # JWT, Bcrypt, ID generator, Logger
│   │   └── validators/              # Zod input validation schemas
│   └── tests/
│       └── gateway.test.ts          # 23 automated integration tests
│
├── frontend/                        # Next.js 14 Web Application
│   ├── package.json                 # Frontend dependencies & scripts
│   ├── tsconfig.json                # TypeScript compiler configuration
│   ├── tailwind.config.js           # Tailwind CSS theme configuration
│   ├── postcss.config.js            # PostCSS configuration
│   ├── next.config.js               # Next.js configuration
│   ├── app/                         # Next.js App Router pages
│   │   ├── layout.tsx               # Root layout with AuthProvider & Navbar
│   │   ├── page.tsx                 # Public Landing page
│   │   ├── login/page.tsx           # Login page with demo autofill
│   │   ├── register/page.tsx        # Registration with PIN setup
│   │   ├── dashboard/page.tsx       # Customer dashboard & quick actions
│   │   ├── wallet/page.tsx          # Wallet balance & top-up modal
│   │   ├── send/page.tsx            # P2P Send Money with PIN & Simulator
│   │   ├── merchant/page.tsx        # Merchant checkout with PIN & Simulator
│   │   ├── transactions/page.tsx    # Transaction history & search
│   │   ├── transactions/[id]/page.tsx # Printable transaction receipt
│   │   ├── refunds/page.tsx         # Refund management & request modal
│   │   ├── notifications/page.tsx   # Real-time in-app notification center
│   │   └── admin/                   # Administrator Center
│   │       ├── page.tsx             # Overview KPI metrics & switch telemetry
│   │       ├── users/page.tsx       # Registered user directory & balances
│   │       └── transactions/page.tsx# Transaction monitor & failure inspector
│   ├── components/                  # Reusable UI components
│   │   ├── Navbar.tsx               # Top navigation with live notifications
│   │   ├── Sidebar.tsx              # Desktop navigation drawer
│   │   ├── SimulationDisclaimer.tsx # Persistent academic notice banner
│   │   ├── SimulatorControls.tsx    # Interactive testing toolbar
│   │   ├── PinModal.tsx             # 4-digit PIN authentication dialog
│   │   └── ReceiptModal.tsx         # Printable digital invoice modal
│   └── lib/                         # API client & Auth context
│
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # PostgreSQL DDL schema & constraints
│   └── seed/
│       └── seed_data.sql            # Initial test users, wallets, merchants
│
└── docs/                            # Comprehensive Documentation
    ├── SRS/
    │   └── SRS.md                   # Software Requirements Specification
    ├── Architecture/
    │   └── Architecture.md          # 4-Tier Architecture Specification
    ├── API/
    │   └── API_Reference.md         # Complete REST API reference
    └── UML/
        ├── class_diagram.md         # UML Class Diagram (Mermaid)
        ├── payment_sequence.md      # Successful Payment Sequence Diagram
        ├── failed_payment_sequence.md # Failed Payment Sequence Diagram
        ├── refund_sequence.md       # Refund Sequence Diagram
        ├── payment_activity.md      # Payment Activity Flowchart
        ├── refund_activity.md       # Refund Activity Flowchart
        └── transaction_state_chart.md # Transaction State Machine
```

---

## 8. Installation & Setup Instructions

### Prerequisites
- **Node.js:** v18.0.0 or higher (v24 recommended)
- **npm:** v9.0.0 or higher
- **Git**

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/Digital_Payment_Gateway_Simulation.git
cd Digital_Payment_Gateway_Simulation
```

### Step 2: Backend Setup
```bash
cd backend
npm install
npm run build
```

To configure custom ports or Supabase credentials, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(By default, the backend runs in zero-dependency local memory mode out-of-the-box if no Supabase URL is supplied.)*

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
npm run build
```

---

## 9. Running the Application

### Option A: Run Backend Server
In the `backend` directory:
```bash
npm run dev
# or for production:
npm start
```
*Backend runs on:* `http://localhost:5000`  
*Health Check:* `http://localhost:5000/api/health`

### Option B: Run Frontend Application
In a separate terminal, inside the `frontend` directory:
```bash
npm run dev
```
*Frontend runs on:* `http://localhost:3000`

---

## 10. Automated Testing & Verification

The test suite runs using Vitest and Supertest against the Express API, testing 23 distinct scenarios:

```bash
cd backend
npm test
```

### Test Results Summary:
```text
 ✓ tests/gateway.test.ts (23 tests)
   ✓ Digital Payment Gateway Simulation Test Suite (23)
     ✓ Authentication Module (5)
       ✓ should successfully register a new customer and assign a funded wallet
       ✓ should reject registration with duplicate email
       ✓ should successfully login with valid credentials
       ✓ should reject login with invalid password
       ✓ should block unauthorized access to protected endpoints without token
     ✓ Wallet Management Module (3)
       ✓ should view wallet balance and active status
       ✓ should reject top-up with zero or negative amount
       ✓ should successfully top-up wallet balance
     ✓ Payment Processing Module (10)
       ✓ should process a successful P2P wallet payment (Alex -> Priya)
       ✓ should process a successful simulated UPI payment
       ✓ should reject payment with invalid simulated PIN without debit
       ✓ should reject payment to non-existent receiver
       ✓ should reject payment when wallet has insufficient balance
       ✓ should reject payment exceeding single transaction limit (> 25000)
       ✓ should handle simulator DECLINED outcome properly and record failure reason
       ✓ should handle simulator TIMEOUT outcome safely without debiting
       ✓ should prevent duplicate payments using Idempotency-Key
       ✓ should process merchant payment successfully
     ✓ Refund Management Module (3)
       ✓ should process a valid full refund and restore wallet balance
       ✓ should reject refund exceeding the original transaction amount
       ✓ should reject duplicate refund when already fully refunded
     ✓ Authorization and Tenant Isolation (2)
       ✓ should prevent standard customer from accessing admin dashboard APIs
       ✓ should allow administrator to access admin dashboard APIs

Test Files  1 passed (1)
     Tests  23 passed (23)
```

---

## 11. Database Setup (Supabase / PostgreSQL)

If you wish to run against a live Supabase PostgreSQL instance:
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the schema script: `database/migrations/001_initial_schema.sql`.
4. Run the seed data script: `database/seed/seed_data.sql`.
5. Copy your Project URL and `service_role` key into `backend/.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

---

## 12. Known Limitations & Simulation Boundaries

1. **Academic Simulation:** No physical card swipe, real SMS OTP, or bank settlement clearance occurs.
2. **Deterministic Banking Delay:** Network switches simulate 250ms–1200ms latency to demonstrate real-world asynchronous states.
3. **In-Memory Local Persistence Mode:** In default local mode, data resets upon server restart to ensure consistent test reproducibility. Permanent persistence is activated when connected to Supabase PostgreSQL.
