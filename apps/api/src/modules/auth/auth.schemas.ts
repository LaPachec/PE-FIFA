import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Email must be valid').toLowerCase(),
  password: z.string().min(6, 'Password must have at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Email must be valid').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
