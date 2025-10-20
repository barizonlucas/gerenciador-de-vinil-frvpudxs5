import { describe, it, expect } from 'vitest';

describe('env and test runner sanity', () => {
  it('loads SUPABASE env vars from .env.test', () => {
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_PUBLISHABLE_KEY).toBeDefined();
  });
});