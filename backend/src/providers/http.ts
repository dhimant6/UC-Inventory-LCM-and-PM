/**
 * Minimal HTTP client shared by the live providers: JSON parsing, request
 * timeout, and retry with backoff on 429/5xx honoring Retry-After.
 */

const MAX_RETRIES = 3;
const TIMEOUT_MS = 15_000;

export interface HttpResponse<T> {
  data: T;
  headers: Headers;
  status: number;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    body: string,
  ) {
    super(`HTTP ${status} from ${url}: ${body.slice(0, 300)}`);
    this.name = 'HttpError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (!Number.isNaN(seconds)) return seconds * 1000;
    const at = Date.parse(retryAfter);
    if (!Number.isNaN(at)) return Math.max(0, at - Date.now());
  }
  return 500 * 2 ** attempt;
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
): Promise<HttpResponse<T>> {
  let lastError: Error = new Error('unreachable');
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (response.status === 429 || response.status >= 500) {
        const body = await response.text();
        lastError = new HttpError(response.status, url, body);
        if (attempt < MAX_RETRIES) {
          await sleep(retryDelayMs(response, attempt));
          continue;
        }
        throw lastError;
      }
      if (!response.ok) {
        throw new HttpError(response.status, url, await response.text());
      }
      if (response.status === 204) {
        return { data: undefined as T, headers: response.headers, status: 204 };
      }
      return {
        data: (await response.json()) as T,
        headers: response.headers,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      // Network failure or timeout: retry with backoff.
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

/** Parse an RFC 5988 Link header and return the rel="next" URL, if any. */
export function nextLink(headers: Headers): string | null {
  const link = headers.get('link');
  if (!link) return null;
  for (const part of link.split(',')) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="?next"?/);
    if (match) return match[1];
  }
  return null;
}
