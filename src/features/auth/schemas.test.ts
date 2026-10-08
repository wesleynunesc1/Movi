import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, forgotPasswordSchema } from './schemas';

describe('Auth Validation Schemas', () => {
  it('validates correct login credentials', () => {
    const valid = { email: 'comercio@movi.com.br', password: 'password123' };
    const result = loginSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email in login', () => {
    const invalid = { email: 'not-an-email', password: 'password123' };
    const result = loginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects short passwords in register', () => {
    const invalid = {
      fullName: 'Wesley Nunes',
      email: 'wesley@movi.com.br',
      password: '123',
      confirmPassword: '123',
    };
    const result = registerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects mismatching passwords in register', () => {
    const mismatch = {
      fullName: 'Wesley Nunes',
      email: 'wesley@movi.com.br',
      password: 'password123',
      confirmPassword: 'password999',
    };
    const result = registerSchema.safeParse(mismatch);
    expect(result.success).toBe(false);
  });

  it('accepts valid forgot password email', () => {
    const valid = { email: 'contato@loja.com.br' };
    const result = forgotPasswordSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
