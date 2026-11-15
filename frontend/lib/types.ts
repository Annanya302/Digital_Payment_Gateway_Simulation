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
    bankCode?: string;
    accountNumber?: string;
  };
  receiver?: {
    userId: string;
    name: string;
    email: string;
    bankCode?: string;
    accountNumber?: string;
  } | null;
  merchant?: {
    merchantId: string;
    name: string;
    upiId: string;
    bankCode?: string;
  } | null;
  transferType?: 'INTRA_BANK' | 'INTER_BANK';
  simulatorResponse: {
    outcome: SimulatorOutcome;
    authCode: string;
    responseCode: string;
    responseMessage: string;
    networkTimestamp: string;
    simulatedGateway: string;
    transferType?: 'INTRA_BANK' | 'INTER_BANK';
    latencyMs: number;
  };
  pipelineStages?: PipelineStage[];
  failureReason?: string | null;
  reversalStatus?: 'NONE' | 'INITIATED' | 'REVERSED';
  createdAt: string;
}

export interface TransactionItem {
  transaction_id: string;
  payment_id: string;
  user_id: string;
  type: 'DEBIT' | 'CREDIT' | 'REFUND' | 'REVERSAL';
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

export interface AuditLogItem {
  log_id: string;
  event_type: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  target_resource: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}
