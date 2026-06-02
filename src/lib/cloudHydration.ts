export const CLOUD_HYDRATION_TIMEOUT_MS = 5000;

export class CloudHydrationTimeoutError extends Error {
  constructor(timeoutMs = CLOUD_HYDRATION_TIMEOUT_MS) {
    super(
      `Облако не ответило за ${Math.round(
        timeoutMs / 1000
      )} сек. Можно продолжить локально и повторить позже.`
    );
    this.name = 'CloudHydrationTimeoutError';
  }
}

export async function withCloudTimeout<T>(
  promise: Promise<T>,
  timeoutMs = CLOUD_HYDRATION_TIMEOUT_MS
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new CloudHydrationTimeoutError(timeoutMs)), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
