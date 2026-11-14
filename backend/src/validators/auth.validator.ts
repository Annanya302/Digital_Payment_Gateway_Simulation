import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits').max(15),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must only contain digits'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePinSchema = z.object({
  currentPin: z.string().length(4, 'Current PIN must be 4 digits'),
  newPin: z.string().length(4, 'New PIN must be 4 digits').regex(/^\d{4}$/, 'New PIN must only contain digits'),
});
