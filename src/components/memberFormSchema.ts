import { z } from 'zod';

/**
 * Client-safe Zod schema used by the MemberForm `'use client'` component.
 *
 * Kept separate from `src/interfaces/http/validators/memberValidators.ts` —
 * those validators live in the interfaces layer and import server-only code.
 * The client bundle MUST NOT import from `interfaces/` or from `domain/`
 * (the Email VO throws DomainError, not a great client-side experience),
 * so the email regex is duplicated here intentionally. See the matching
 * pattern in /books form work.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const memberFormSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .min(1, 'Email is required.')
    .max(320, 'Email must be at most 320 characters.')
    .regex(EMAIL_REGEX, 'Email must be a valid email address.'),
  name: z
    .string({ required_error: 'Name is required.' })
    .trim()
    .min(1, 'Name is required.')
    .max(300, 'Name must be at most 300 characters.'),
});

export type MemberFormInput = z.infer<typeof memberFormSchema>;
