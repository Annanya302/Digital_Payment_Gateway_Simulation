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

export type BankCode = 'SBI' | 'HDFC' | 'ICICI' | 'AXIS' | 'PNB';
export type BankHealthStatus = 'ONLINE' | 'DEGRADED' | 'DOWN';

export interface Bank {
  bank_id: string;
  name: string;
  code: BankCode;
  ifsc_prefix: string;
  status: 'active' | 'inactive';
  health_status: BankHealthStatus;
  latency_ms: number;
  logo_color: string;
  success_rate?: number;
}

export interface BankAccount {
  account_id: string;
  user_id: string;
  bank_id: string;
  bank_name: string;
  bank_code: BankCode;
  account_number: string;
  ifsc_code: string;
  account_type: 'SAVINGS' | 'CURRENT';
  balance: number;
  is_primary: boolean;
  verification_status: 'VERIFIED' | 'PENDING';
  created_at: string;
  updated_at: string;
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
  bank_code?: BankCode;
  status: 'active' | 'inactive';
  created_at: string;
}

export type PaymentMode = 'WALLET' | 'UPI' | 'CARD' | 'NET_BANKING';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
export type SimulatorOutcome = 'APPROVED' | 'DECLINED' | 'TIMEOUT' | 'BANK_UNAVAILABLE';

export interface PipelineStage {
  stageNumber: number;
  stageName: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SKIPPED';
  timestamp: string;
  detail: string;
}

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
  sender_bank_code?: BankCode | string;
  receiver_bank_code?: BankCode | string;
  transfer_type?: 'INTRA_BANK' | 'INTER_BANK';
  pipeline_stages?: PipelineStage[];
  reversal_status?: 'NONE' | 'INITIATED' | 'REVERSED';
  reversal_reason?: string | null;
  created_at: string;
  updated_at?: string;
}

export type TransactionType = 'DEBIT' | 'CREDIT' | 'REFUND' | 'REVERSAL';
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
  | 'REVERSAL_PROCESSED'
  | 'BANK_LINKED'
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

export type AuditEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_REGISTER'
  | 'PIN_CHANGED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REVERSED'
  | 'RECONCILIATION_RUN'
  | 'BANK_HEALTH_TOGGLED'
  | 'BANK_ACCOUNT_CREATED'
  | 'ADMIN_INSPECTION';

export interface AuditLog {
  log_id: string;
  event_type: AuditEventType;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  target_resource: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}
