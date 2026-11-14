const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data.data !== undefined ? data.data : data;
  }

  // --- Auth ---
  register(payload: any) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  login(payload: any) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getMe() {
    return this.request<any>('/auth/me');
  }

  changePin(payload: { currentPin: string; newPin: string }) {
    return this.request<any>('/auth/change-pin', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Wallet ---
  getWallet() {
    return this.request<any>('/wallet');
  }

  topUpWallet(amount: number) {
    return this.request<any>('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  getWalletTransactions() {
    return this.request<any>('/wallet/transactions');
  }

  // --- Payments ---
  sendMoney(payload: any) {
    return this.request<any>('/payments/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  payMerchant(payload: any) {
    return this.request<any>('/payments/merchant', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getMerchants() {
    return this.request<any>('/payments/merchants');
  }

  getPaymentDetails(paymentId: string) {
    return this.request<any>(`/payments/${paymentId}`);
  }

  // --- Transactions ---
  getTransactions(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    return this.request<any>(`/transactions?${query.toString()}`);
  }

  getTransactionById(transactionId: string) {
    return this.request<any>(`/transactions/${transactionId}`);
  }

  // --- Refunds ---
  requestRefund(payload: { paymentId: string; reason: string; amount?: number }) {
    return this.request<any>('/refunds', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getRefunds() {
    return this.request<any>('/refunds');
  }

  getRefundById(refundId: string) {
    return this.request<any>(`/refunds/${refundId}`);
  }

  // --- Notifications ---
  getNotifications() {
    return this.request<any>('/notifications');
  }

  markNotificationRead(notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  markAllNotificationsRead() {
    return this.request<any>('/notifications/read-all', {
      method: 'POST',
    });
  }

  // --- Admin ---
  getAdminDashboard() {
    return this.request<any>('/admin/dashboard');
  }

  getAdminUsers() {
    return this.request<any>('/admin/users');
  }

  getAdminTransactions(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    return this.request<any>(`/admin/transactions?${query.toString()}`);
  }
}

export const api = new ApiClient();
