import { z } from 'zod';

// Username validation:
// - 3-20 characters
// - Letters, numbers, special characters allowed
// - No spaces allowed
// - Must start with a letter or number
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9_\-\.!@#$%^&*()+=]*$/,
    'Username must start with a letter/number and contain no spaces'
  );

export const updateUsernameSchema = z.object({
  body: z.object({
    username: usernameSchema,
  }),
});

export const checkUsernameSchema = z.object({
  query: z.object({
    username: usernameSchema,
  }),
});

export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>['body'];
export type CheckUsernameInput = z.infer<typeof checkUsernameSchema>['query'];


