import type { APIResponse } from '@playwright/test';

/**
 * Shared response unwrapping for API classes: either the parsed body of a
 * successful JSON response, or an error carrying the status and a body
 * snippet. Extracted so every module API reports failures the same way.
 */
export async function unwrapJson<T>(res: APIResponse, action: string): Promise<T> {
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`${action} failed: ${res.status()} ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}
