# Software Requirements Specification (SRS)
## Digital Payment Gateway Simulation

**Document Version:** 1.0.0  
**Project Name:** Digital Payment Gateway Simulation  
**Authors:** Ankur (Coding & QA), Atul (Coding & QA), Anamay (Documentation), Annanya (UI/UX Design)  
**Date:** November 2026  
**Status:** Approved & Implemented  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) describes the complete functional, behavioural, and non-functional requirements for the **Digital Payment Gateway Simulation** web application. It serves as an authoritative contract for developers, testers, and stakeholders.

### 1.2 Educational Simulation Scope & Boundary
> **CRITICAL BOUNDARY NOTICE:**  
> This system is an educational simulation. It strictly simulates digital payment workflows, banking networks, card processing switches, and the Unified Payments Interface (UPI). **No real banking rails, real cards, or real currency transfers are utilized.** Fictional test accounts, virtual simulated balances, and deterministic mock switches generate approved, declined, and timeout outcomes for demonstration and training purposes.

---

## 2. Overall Description

### 2.1 Product Perspective
The system operates as a modular, client-server application comprised of:
1. **Next.js Client Layer:** Responsive React frontend providing dedicated Customer and Admin portals.
2. **Express.js Application Layer:** RESTful API gateway enforcing schema validations, authentication, and security middleware.
3. **Service Layer:** Independent payment processing engine, wallet engine, ledger service, refund workflow, notification dispatcher, and Bank/UPI simulator.
4. **Data Layer:** Normalized relational database (PostgreSQL / Supabase) enforcing foreign key integrity, atomic balance checks, and row-level security.

```
+-------------------------------------------------------------+
|                      Client Layer                           |
|       Next.js 14 / React / Tailwind CSS / Lucide Icons      |
+------------------------------+------------------------------+
                               | HTTPS / JSON
                               v
+-------------------------------------------------------------+
|                    Application Layer                        |
|       Express.js / JWT Auth / Zod Schemas / RBAC            |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                      Service Layer                          |
|  [Payment Engine]  [Wallet Engine]  [Bank/UPI Simulator]    |
|  [Refund Service]  [Ledger Engine]  [Notification Service]  |
+------------------------------+------------------------------+
                               | SQL / Transactions
                               v
+-------------------------------------------------------------+
|                       Data Layer                            |
|       PostgreSQL / Supabase Schema (ACID Transactions)      |
+-------------------------------------------------------------+
```

### 2.2 User Roles & Personas
- **Customer:** End-user capable of self-registration, credential login, wallet balance inspection, peer-to-peer (P2P) transfers, merchant checkout payments, simulated PIN authentication, transaction receipt generation, in-app notifications, and initiating refund requests.
- **Administrator:** Privileged operator with access to system-wide dashboards, registered user registries, global transaction monitoring, failure reason inspectors, and simulator outcome analytics.

---

## 3. Specific Functional Requirements

### 3.1 Module 1: Authentication & Identity Management
- **FR-1.1 User Registration:** The system shall permit new customers to register with Full Name, Email, Mobile Number, Password, and a 4-digit numeric Transaction PIN.
- **FR-1.2 Unique Constraints:** Emails and mobile numbers must be globally unique across the user registry.
- **FR-1.3 Password & PIN Protection:** Passwords and PINs must be securely hashed using salted bcrypt (cost factor 10). Plaintext credentials must never be persisted or logged.
- **FR-1.4 JWT Authentication:** Successful login returns a digitally signed JSON Web Token (JWT) encapsulating `userId`, `email`, and `role`.
- **FR-1.5 Role-Based Access Control (RBAC):** Customer accounts attempting to call admin-restricted endpoints must receive an immediate `403 Forbidden` response.

### 3.2 Module 2: Wallet Management
- **FR-2.1 Auto-Provisioning:** Each newly registered user automatically receives an initialized digital wallet credited with ₹10,000.00 in simulated demo funds.
- **FR-2.2 Atomic Balance Operations:** Balance debits and credits must be processed using atomic database operations. Negative wallet balances (`balance < 0.00`) are strictly prevented at the database constraint level.
- **FR-2.3 Transaction Limits:** Enforce a maximum single transaction limit of ₹25,000.00 and a daily transaction limit of ₹50,000.00.
- **FR-2.4 Balance Top-Up:** Customers can simulate adding funds to their wallet for testing purposes.

### 3.3 Module 3: Payment Processing & Authorization Engine
- **FR-3.1 Peer-to-Peer (P2P) Payments:** Customers can transfer funds to other registered users identified by email or mobile number.
- **FR-3.2 Merchant Payments:** Customers can select pre-seeded merchants (e.g., Amazon India, Swiggy Foods, Flipkart) and execute checkout transactions.
- **FR-3.3 Payment Modes:** Support three distinct simulated payment modes: `WALLET`, `UPI`, and `CARD`.
- **FR-3.4 Simulated PIN Verification:** Every payment request requires a 4-digit PIN. If incorrect, the transaction is rejected immediately with `401 Unauthorized` without deducting funds.
- **FR-3.5 Idempotency Protection:** Clients can submit an `Idempotency-Key` header. Duplicate submissions with the same key return the original transaction receipt without double-debiting.
- **FR-3.6 Receipt Generation:** Each payment generates an immutable receipt with a unique reference number (`TXN-XXXXXXXX-XXXX`), timestamp, simulator response code, and counterparty metadata.

### 3.4 Module 4: Bank & UPI Simulator
- **FR-4.1 Simulator Outcomes:** The simulator module supports three deterministic outcomes: `APPROVED`, `DECLINED`, and `TIMEOUT`.
- **FR-4.2 Simulation Triggers:**
  - Explicit UI/API override flag (`simulatedOutcome`).
  - UPI ID trigger: containing `decline` or `timeout`.
  - Card trigger: last 4 digits `0002` (decline), `0003` (timeout).
  - Amount trigger: amounts ending in `.02` (decline) or `.03` (timeout).
- **FR-4.3 Gateway Latency:** Simulates realistic banking switch latency (250ms–1500ms).

### 3.5 Module 5: Transaction Ledger & Receipts
- **FR-5.1 Immutable Ledger:** Every balance movement creates an immutable `Transaction` record (`DEBIT`, `CREDIT`, or `REFUND`).
- **FR-5.2 Customer History:** Customers can browse, search, and filter their transactions by status (`SUCCESS`, `FAILED`, `PENDING`), mode, and date range.
- **FR-5.3 Receipt Printing:** Provide a formatted printable digital invoice/receipt view.

### 3.6 Module 6: Refund Management
- **FR-6.1 Refund Eligibility:** Customers may request refunds only on completed `SUCCESS` payments that they originally sent.
- **FR-6.2 Amount Validation:** Partial and full refunds are supported; the requested amount must not exceed the remaining un-refunded amount.
- **FR-6.3 Atomic Restoration:** Successful refunds automatically credit the customer's wallet and generate a `REFUND` ledger entry and notification.

### 3.7 Module 7: In-App Notifications
- **FR-7.1 Real-Time In-App Alerts:** The system dispatches alerts for `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `PAYMENT_RECEIVED`, `REFUND_SUCCESS`, and system notifications.
- **FR-7.2 Read State Management:** Users can mark individual notifications or all notifications as read.

### 3.8 Module 8: Administrator Monitoring
- **FR-8.1 Global Analytics:** Displays total transaction volume, total users, success rate %, failed counts, and payment method distributions.
- **FR-8.2 User Management:** Inspect all registered customer profiles, account statuses, and current wallet balances.
- **FR-8.3 Transaction Inspection:** Search, filter, and inspect detailed failure logs and simulator switch telemetry.

---

## 4. Non-Functional Requirements

- **NFR-1 Security:** Passwords and PINs hashed with bcrypt (salt 10). Cryptographic JWT tokens with 24-hour expiration. Strict input validation with Zod.
- **NFR-2 Performance:** API response latency under 300ms for internal processing (excluding configured simulated bank latency).
- **NFR-3 Reliability & Atomicity:** ACID compliance on all wallet balance mutations; zero tolerance for phantom debits or negative balances.
- **NFR-4 Usability:** Professional fintech design adhering to banking-grade UX principles, responsive on mobile, tablet, and desktop viewports.
