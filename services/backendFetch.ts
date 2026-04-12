const API_BASE = process.env.VALYUX_API_URL || 'http://localhost:8080';

type BackendFetchOptions = RequestInit & {
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

function mergeTimeoutWithUserSignal(timeoutMs: number, userSignal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!userSignal) return timeoutSignal;
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([timeoutSignal, userSignal]);
  }
  const c = new AbortController();
  const abort = () => {
    if (!c.signal.aborted) c.abort();
  };
  if (timeoutSignal.aborted || userSignal.aborted) {
    abort();
    return c.signal;
  }
  timeoutSignal.addEventListener('abort', abort, { once: true });
  userSignal.addEventListener('abort', abort, { once: true });
  return c.signal;
}

function isAbortError(e: unknown): boolean {
  return (
    (e instanceof DOMException && e.name === 'AbortError') ||
    (e instanceof Error && e.name === 'AbortError')
  );
}

/**
 * Fetch helper for sleepy / cold-starting backends (e.g. free tiers):
 * - Retries on network errors + 502/503/504 with exponential-ish backoff
 * - Optional `signal`: when aborted, does not retry (stale navigation / new pincode)
 * - Throws a friendly error if still failing after retries
 */
export async function fetchBackend(path: string, options: BackendFetchOptions = {}): Promise<Response> {
  const {
    timeoutMs = 20000,
    retries = 2,
    backoffMs = 1200,
    signal: userSignal,
    ...init
  } = options;

  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (userSignal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    try {
      const signal = mergeTimeoutWithUserSignal(timeoutMs, userSignal);
      const res = await fetch(url, { ...init, signal });
      if (isTransientBackendStatus(res.status) && attempt < retries) {
        await sleep(backoffMs * Math.pow(1.8, attempt));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (userSignal?.aborted) {
        throw isAbortError(e) ? (e as Error) : new DOMException('Aborted', 'AbortError');
      }
      if (isAbortError(e)) {
        if (attempt < retries) {
          await sleep(backoffMs * Math.pow(1.8, attempt));
          continue;
        }
        throw new Error(`Backend is starting up — please try again in 10–15 seconds.`);
      }
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
