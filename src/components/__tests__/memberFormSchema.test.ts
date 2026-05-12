import { memberFormSchema } from '../memberFormSchema';

describe('memberFormSchema', () => {
  it('accepts a valid email and a trimmed name', () => {
    const result = memberFormSchema.safeParse({
      email: 'jane@example.com',
      name: '  Jane Doe  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Jane Doe');
      expect(result.data.email).toBe('jane@example.com');
    }
  });

  it('rejects an empty name', () => {
    const result = memberFormSchema.safeParse({ email: 'j@example.com', name: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path[0])).toContain('name');
    }
  });

  it('rejects a non-email string', () => {
    const result = memberFormSchema.safeParse({ email: 'not-an-email', name: 'Jane' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'email');
      expect(issue?.message).toMatch(/valid email/i);
    }
  });

  it('rejects an empty email', () => {
    const result = memberFormSchema.safeParse({ email: '', name: 'Jane' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'email');
      expect(issue?.message).toMatch(/required/i);
    }
  });

  it('rejects an over-long name', () => {
    const result = memberFormSchema.safeParse({
      email: 'j@example.com',
      name: 'x'.repeat(301),
    });
    expect(result.success).toBe(false);
  });
});
