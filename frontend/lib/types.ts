export type UserRole = 'customer' | 'admin';

export interface User {
  user_id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export interface Wallet {
  wallet_id: string;
  user_id: string;
  balance: number;
  currency: string;
  daily_limit: number;
  status: 'active' | 'suspended' | 'frozen';
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  merchant_id: string;
  name: string;
  upi_id: string;
  category: string;
  status: 'active' | 'inactive';
}

export type PaymentMode = 'WALLET' | 'UPI' | 'CARD';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type SimulatorOutcome = 'APPROVED' | 'DECLINED' | 'TIMEOUT';

export interface PaymentReceipt {
  paymentId: string;
  referenceId: string;
  amount: number;
  paymentMode: PaymentMode;
  status: PaymentStatus;
  sender: {
    userId: string;
    name: string;
    email: string;
  };
  receiver?: {
    userId: string;
    name: string;
    email: string;
  } | null;
  merchant?: {
    merchantId: string;
    name: string;
    upiId: string;
  } | null;
  simulatorResponse: {
    outcome: SimulatorOutcome;
    authCode: string;
    responseCode: string;
    responseMessage: string;
    networkTimestamp: string;
    simulatedGateway: string;
    latencyMs: number;
  };
  failureReason?: string | null;
  createdAt: string;
}

export interface TransactionItem {
  transaction_id: string;
  payment_id: string;
  user_id: string;
  type: 'DEBIT' | 'CREDIT' | 'REFUND';
  amount: number;
  status: PaymentStatus;
  reference_id: string;
  failure_reason?: string | null;
  counterparty?: string;
  paymentMode?: PaymentMode;
  created_at: string;
}

export interface RefundItem {
  refund_id: string;
  original_payment_id: string;
  user_id: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REJECTED';
  reason: string;
  reference_id: string;
  failure_reason?: string | null;
  created_at: string;
}

export interface NotificationItem {
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  channel: 'IN_APP';
  type: string;
  read_status: boolean;
  sent_at: string;
}
