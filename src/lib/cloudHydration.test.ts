import { describe, expect, it, vi } from 'vitest';
import { CloudHydrationTimeoutError, withCloudTimeout } from './cloudHydration';

describe('cloud hydration timeout', () => {
  it('returns the original result when Supabase responds in time', async () => {
    await expect(withCloudTimeout(Promise.resolve('connected'), 100)).resolves.toBe('connected');
  });

  it('rejects with a readable timeout error when Supabase stalls', async () => {
    vi.useFakeTimers();

    try {
      const result = withCloudTimeout(new Promise(() => undefined), 1000);
      const assertion = result.catch((error: unknown) => {
        expect(error).toBeInstanceOf(CloudHydrationTimeoutError);
        expect(error).toHaveProperty('message', expect.stringContaining('Облако не ответило за 1 сек'));
      });

      await vi.advanceTimersByTimeAsync(1000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
