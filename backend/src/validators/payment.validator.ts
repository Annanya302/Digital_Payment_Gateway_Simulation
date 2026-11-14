import { z } from 'zod';

export const sendMoneySchema = z.object({
  receiverIdentifier: z.string().min(3, 'Receiver email, mobile or UPI ID is required'),
  amount: z.number().positive('Payment amount must be greater than 0').max(25000, 'Single transaction limit is ₹25,000'),
  paymentMode: z.enum(['WALLET', 'UPI', 'CARD']),
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must only contain digits'),
  idempotencyKey: z.string().optional(),
  simulatedOutcome: z.enum(['APPROVED', 'DECLINED', 'TIMEOUT']).optional(),
  cardDetails: z
    .object({
      cardNumber: z.string().optional(),
      expiry: z.string().optional(),
      cvv: z.string().optional(),
    })
    .optional(),
});

export const payMerchantSchema = z.object({
  merchantId: z.string().min(1, 'Valid merchant ID is required'),
  amount: z.number().positive('Payment amount must be greater than 0').max(25000, 'Single transaction limit is ₹25,000'),
  paymentMode: z.enum(['WALLET', 'UPI', 'CARD']),
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must only contain digits'),
  idempotencyKey: z.string().optional(),
  simulatedOutcome: z.enum(['APPROVED', 'DECLINED', 'TIMEOUT']).optional(),
  cardDetails: z
    .object({
      cardNumber: z.string().optional(),
      expiry: z.string().optional(),
      cvv: z.string().optional(),
    })
    .optional(),
});
