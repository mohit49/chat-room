import { z } from 'zod';

export const sendOTPSchema = z.object({
  body: z.object({
    mobileNumber: z
      .string()
      .min(10, 'Mobile number must be at least 10 digits')
      .max(15, 'Mobile number must be at most 15 digits')
      .regex(/^[+]?[\d\s-()]+$/, 'Invalid mobile number format'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    mobileNumber: z
      .string()
      .min(10, 'Mobile number must be at least 10 digits')
      .max(15, 'Mobile number must be at most 15 digits'),
    otp: z
      .string()
      .length(6, 'OTP must be 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only digits'),
  }),
});

export type SendOTPInput = z.infer<typeof sendOTPSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];



