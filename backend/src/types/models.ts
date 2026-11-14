export type UserRole = 'customer' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  user_id: string;
  name: string;
  email: string;
  mobile: string;
  password_hash: string;
  pin_hash: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export type SafeUser = Omit<User, 'password_hash' | 'pin_hash'>;

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
  created_at: string;
}

export type PaymentMode = 'WALLET' | 'UPI' | 'CARD';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type SimulatorOutcome = 'APPROVED' | 'DECLINED' | 'TIMEOUT';

export interface Payment {
  payment_id: string;
  sender_id: string;
  receiver_id?: string | null;
  merchant_id?: string | null;
  amount: number;
  payment_mode: PaymentMode;
  status: PaymentStatus;
  idempotency_key?: string | null;
  reference_id: string;
  failure_reason?: string | null;
  simulated_outcome?: SimulatorOutcome | string;
  created_at: string;
}

export type TransactionType = 'DEBIT' | 'CREDIT' | 'REFUND';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface Transaction {
  transaction_id: string;
  payment_id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference_id: string;
  failure_reason?: string | null;
  created_at: string;
}

export type RefundStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REJECTED';

export interface Refund {
  refund_id: string;
  original_payment_id: string;
  user_id: string;
  amount: number;
  status: RefundStatus;
  reason: string;
  reference_id: string;
  failure_reason?: string | null;
  created_at: string;
}

export type NotificationType =
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_RECEIVED'
  | 'REFUND_REQUESTED'
  | 'REFUND_SUCCESS'
  | 'REFUND_REJECTED'
  | 'SYSTEM';

export interface Notification {
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  channel: 'IN_APP';
  type: NotificationType;
  read_status: boolean;
  metadata?: Record<string, any>;
  sent_at: string;
}
