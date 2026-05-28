import { z } from 'zod';

/*
! Single source of truth for API request payload shapes.
! Every mutation route parses its body through one of these schemas via
! `parseJson(request, schema)` (see ./parse.ts), so validation, error
! formatting, and types stay co-located with the contract.
*/

const positiveInt = z.coerce.number().int().positive();
const quality = z.coerce.number().int().min(0).max(5);

/*
! Session cookie payload — validated on every read so a tampered or legacy
! cookie cannot bypass type assumptions downstream. Stored as plain JSON in
! an httpOnly cookie; signing/encryption would require KMS work and is
! tracked separately.
*/
export const sessionPayloadSchema = z.object({
  userId: z.number().int().positive(),
  username: z.string().min(1).max(200),
  expiresAt: z.number().int().positive(),
});
export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username required'),
  password: z.string().min(1, 'Password required'),
});
export type LoginPayload = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(40),
  password: z.string().min(4, 'Password must be at least 4 characters').max(200),
});
export type RegisterPayload = z.infer<typeof registerSchema>;

export const favoriteSchema = z.object({
  chunkId: positiveInt,
});
export type FavoritePayload = z.infer<typeof favoriteSchema>;

export const reviewSubmitSchema = z.object({
  chunkId: positiveInt,
  quality,
});
export type ReviewSubmitPayload = z.infer<typeof reviewSubmitSchema>;

export const chunkReportSchema = z.object({
  chunkId: positiveInt,
  reason: z
    .string()
    .trim()
    .min(1, 'Reason must not be empty')
    .max(500, 'Reason must be at most 500 characters'),
});
export type ChunkReportPayload = z.infer<typeof chunkReportSchema>;

export const learnStartSchema = z.object({
  categoryId: positiveInt.optional(),
  count: z.coerce.number().int().min(1).max(50).optional(),
});
export type LearnStartPayload = z.infer<typeof learnStartSchema>;

export const feynmanSubmitSchema = z.object({
  chunkId: positiveInt,
  quality,
  explanation: z.string().trim().min(1).max(4000),
});
export type FeynmanSubmitPayload = z.infer<typeof feynmanSubmitSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z
      .string()
      .min(4, 'New password must be at least 4 characters')
      .max(200, 'New password must be at most 200 characters'),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must differ from current password',
    path: ['newPassword'],
  });
export type ChangePasswordPayload = z.infer<typeof changePasswordSchema>;
