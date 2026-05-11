import { z } from 'zod';

/**
 * Input validation schemas for Member API endpoints.
 */

export const createMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(300),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CLOSED']).optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
