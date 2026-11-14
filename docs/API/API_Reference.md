# REST API Reference
## Digital Payment Gateway Simulation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints

### 1.1 Register New User
- **Method:** `POST`
- **Route:** `/auth/register`
- **Auth:** None
- **Body:**
  ```json
  {
    "name": "Alex Rivera",
    "email": "alex@example.com",
    "mobile": "+919876543211",
    "password": "Password123!",
    "pin": "1234"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "data": {
      "user": {
        "user_id": "00000000-0000-0000-0000-000000000002",
        "name": "Alex Rivera",
        "email": "alex@example.com",
        "mobile": "+919876543211",
        "role": "customer",
        "status": "active"
      },
      "wallet": {
        "wallet_id": "10000000-0000-0000-0000-000000000002",
        "balance": 10000.0,
        "currency": "INR",
        "status": "active"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### 1.2 User Login
- **Method:** `POST`
- **Route:** `/auth/login`
- **Auth:** None
- **Body:**
  ```json
  {
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "user_id": "...", "name": "Alex Rivera", "email": "...", "role": "customer" },
      "wallet": { "balance": 25000.0, "currency": "INR" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### 1.3 Get Current User Profile
- **Method:** `GET`
- **Route:** `/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):** User details + associated wallet.

---

## 2. Wallet Endpoints

### 2.1 View Wallet Balance
- **Method:** `GET`
- **Route:** `/wallet`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "wallet_id": "10000000-0000-0000-0000-000000000002",
      "user_id": "00000000-0000-0000-0000-000000000002",
      "balance": 25000.0,
      "currency": "INR",
      "daily_limit": 50000.0,
      "status": "active"
    }
  }
  ```

### 2.2 Top-Up Wallet Funds
- **Method:** `POST`
- **Route:** `/wallet/topup`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "amount": 2000.0 }`

---

## 3. Payment Endpoints

### 3.1 Send Money (P2P)
- **Method:** `POST`
- **Route:** `/payments/send`
- **Headers:** `Authorization: Bearer <token>`, `Idempotency-Key: <optional-key>`
- **Body:**
  ```json
  {
    "receiverIdentifier": "priya@example.com",
    "amount": 1500.0,
    "paymentMode": "WALLET",
    "pin": "1234",
    "simulatedOutcome": "APPROVED"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Payment processed successfully",
    "data": {
      "paymentId": "...",
      "referenceId": "TXN-M7X9K2-A9F1",
      "amount": 1500.0,
      "paymentMode": "WALLET",
      "status": "SUCCESS",
      "sender": { "name": "Alex Rivera", "email": "alex@example.com" },
      "receiver": { "name": "Priya Sharma", "email": "priya@example.com" },
      "simulatorResponse": {
        "outcome": "APPROVED",
        "authCode": "AUTH-7F892B",
        "responseCode": "00",
        "simulatedGateway": "CORE-WALLET-ENGINE"
      }
    }
  }
  ```

### 3.2 Pay Merchant
- **Method:** `POST`
- **Route:** `/payments/merchant`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "merchantId": "20000000-0000-0000-0000-000000000001",
    "amount": 999.0,
    "paymentMode": "UPI",
    "pin": "1234"
  }
  ```

---

## 4. Transaction Endpoints

### 4.1 List User Transactions
- **Method:** `GET`
- **Route:** `/transactions?status=ALL&page=1&limit=10&search=TXN`
- **Headers:** `Authorization: Bearer <token>`

### 4.2 Get Transaction Details & Receipt
- **Method:** `GET`
- **Route:** `/transactions/:id`
- **Headers:** `Authorization: Bearer <token>`

---

## 5. Refund Endpoints

### 5.1 Request Refund
- **Method:** `POST`
- **Route:** `/refunds`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "paymentId": "c3e120f2-...",
    "reason": "Double charged or cancelled order",
    "amount": 1500.0
  }
  ```

### 5.2 List Refunds
- **Method:** `GET`
- **Route:** `/refunds`
- **Headers:** `Authorization: Bearer <token>`

---

## 6. Notifications Endpoints

### 6.1 List Notifications
- **Method:** `GET`
- **Route:** `/notifications`

### 6.2 Mark Notification as Read
- **Method:** `PATCH`
- **Route:** `/notifications/:id/read`

### 6.3 Mark All Read
- **Method:** `POST`
- **Route:** `/notifications/read-all`

---

## 7. Admin Endpoints

### 7.1 Admin Dashboard Metrics
- **Method:** `GET`
- **Route:** `/admin/dashboard`
- **Headers:** `Authorization: Bearer <admin-token>`

### 7.2 Admin User Management
- **Method:** `GET`
- **Route:** `/admin/users`
- **Headers:** `Authorization: Bearer <admin-token>`

### 7.3 Admin Transaction Monitor
- **Method:** `GET`
- **Route:** `/admin/transactions?status=ALL&search=`
- **Headers:** `Authorization: Bearer <admin-token>`
