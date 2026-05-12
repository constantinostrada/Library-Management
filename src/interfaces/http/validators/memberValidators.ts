import { z } from 'zod';

/**
 * Input validation schemas for Member API endpoints.
 *
 * Shape/format validation lives here in the interfaces layer.
 * Business validation (email uniqueness, status transitions, etc.) lives
 * in the domain/application layers.
 */

export const memberStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'CLOSED']);

export const createMemberSchema = z.object({
  email: z.string().email({ message: 'email must be a valid email address.' }),
  name: z.string().min(1).max(300),
});

export const updateMemberSchema = z
  .object({
    name: z.string().min(1).max(300).optional(),
    email: z
      .string()
      .email({ message: 'email must be a valid email address.' })
      .optional(),
    status: memberStatusSchema.optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined || data.email !== undefined || data.status !== undefined,
    { message: 'At least one of name, email or status must be provided.' },
  );

/**
 * GET /api/members query parameters.
 * Coerces strings to numbers because URLSearchParams returns strings.
 */
export const listMembersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: memberStatusSchema.optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
