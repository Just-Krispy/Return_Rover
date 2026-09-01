import type { APIResponse } from '@playwright/test';

/**
 * Resilient HTTP wrapper for LIVE, free-tier APIs (MockAPI, JSONPlaceholder).
 *
 * MockAPI's free tier rate-limits aggressively and can return HTTP 429
 * ("Too Many Requests") when a burst of requests arrives too fast. The Playwright
 * `request` fixture does not retry a 429 on its own, so any one of these transient
 * responses would otherwise fail the spec. This helper re-runs the request until it
 * either stops returning 429 or we exhaust the retry budget, with a short delay
 * between attempts to let the rate-limit window reset.
 *
 * All other status codes (including 404! — that is a *real* MockAPI behavior we
 * sometimes assert on) are returned immediately, untouched.
 */
export interface RetryFor429Options {
  /** Total number of attempts before giving up. Default 6 (1 initial + 5 retries). */
  maxRetries?: number;
  /** Wait between 429 retries in ms. Default 1500. */
  delayMs?: number;
}

export async function retryFor429(
  fn: () => Promise<APIResponse>,
  { maxRetries = 6, delayMs = 1500 }: RetryFor429Options = {}
): Promise<APIResponse> {
  let last!: APIResponse;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fn();
    last = res;
    if (res.status() !== 429) return res; // any real status, incl. 404, is final
    if (attempt + 1 < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return last; // last response is still a 429 — let the caller's expect() report it
}