import crypto from 'crypto';

export function generateReferenceId(prefix: 'TXN' | 'REF' | 'PAY' | 'NOTIF'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${randomBytes}`;
}
