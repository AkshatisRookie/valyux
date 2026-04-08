const API_BASE = process.env.VALYUX_API_URL || 'http://localhost:8080';

type BackendFetchOptions = Omit<RequestInit, 'signal'> & {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
};

function isTransientBackendStatus(status: number) {
  return status === 502 || status === 503 || status === 504;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch helper for sleepy / cold-starting backends (e.g. free tiers):
 * - Retries on network errors + 502/503/504 with exponential-ish backoff
 * - Throws a friendly error if still failing after retries
 */
export async function fetchBackend(path: string, options: BackendFetchOptions = {}): Promise<Response> {
  const {
    timeoutMs = 20000,
    retries = 2,
    backoffMs = 1200,
    ...init
  } = options;

  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (isTransientBackendStatus(res.status) && attempt < retries) {
        await sleep(backoffMs * Math.pow(1.8, attempt));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await sleep(backoffMs * Math.pow(1.8, attempt));
        continue;
      }
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : 'Backend unreachable';
  void msg;
  throw new Error(`Backend is starting up — please try again in 10–15 seconds.`);
}

