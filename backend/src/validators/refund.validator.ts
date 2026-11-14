import { z } from 'zod';

export const requestRefundSchema = z.object({
  paymentId: z.string().min(1, 'Valid payment ID is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(255),
  amount: z.number().positive('Refund amount must be greater than 0').optional(),
});
