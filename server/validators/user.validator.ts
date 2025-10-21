import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    birthDate: z.string().optional(),
    age: z.number().min(0).max(150).optional(),
    gender: z.enum(['male', 'female', 'other', '']).optional(),
    username: z.string().optional(), // Explicitly allow username but make it optional
    profilePicture: z.object({
      type: z.enum(['upload', 'avatar']),
      url: z.string().optional(),
      avatarStyle: z.string().optional(),
      seed: z.string().optional(),
    }).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
  }).passthrough(), // Allow additional fields
});

export const updateLocationSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    address: z.string().max(500).optional(),
    area: z.string().max(200).optional(),
    city: z.string().max(200).optional(),
    state: z.string().max(200).optional(),
    isVisible: z.boolean().optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>['body'];


