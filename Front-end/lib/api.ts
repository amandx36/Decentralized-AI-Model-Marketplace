/**
 * lib/api.ts
 *
 * Lightweight fetch-based API client for protected backend calls.
 *
 * - Reads the JWT from the `aimarketplace_token` cookie (browser-side: reads
 *   the non-HttpOnly public wallet cookie; JWT itself stays HttpOnly so we
 *   attach it server-side via the BFF, or we pass it as a prop from Server
 *   Components).
 * - For client components that need to call the backend directly, use
 *   `apiFetch()` which reads the token from the cookie string via document.cookie.
 *   Because the access token cookie IS HttpOnly, direct client-side reads are
 *   blocked by design — protected calls should go through the Next.js BFF
 *   (app/api/*) which has access to the HttpOnly cookie via `next/headers`.
 *
 * Pattern:
 *   Client Component  →  POST /api/<route>  →  Next.js BFF  →  Spring Boot
 *
 * The BFF automatically forwards the HttpOnly cookie as an Authorization header
 * to the backend using `getServerToken()` below (for Server Components /
 * Route Handlers).
 */

import { getToken } from '@/lib/auth'

// ─── Server-side helper (Server Components & Route Handlers) ─────────────────

/**
 * Returns fetch options with an Authorization: Bearer header pre-populated
 * from the HttpOnly JWT cookie.  Only works in Server Components / Route Handlers.
 *
 * Usage:
 *   const opts = await withAuth({ method: 'GET' })
 *   const res  = await fetch(`${BACKEND}/api/models`, opts)
 */
export async function withAuth(init: RequestInit = {}): Promise<RequestInit> {
  const token = await getToken()
  if (!token) return init
  return {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${token}`,
    },
  }
}

/**
 * Convenience wrapper: fetch a backend URL with the auth header attached.
 * Only for use in Server Components / Route Handlers.
 *
 * Usage:
 *   const data = await serverFetch('/api/models')
 */
export async function serverFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const baseUrl = (
    process.env.AIMARKETPLACE_API_URL ?? 'http://localhost:8000'
  ).replace(/\/$/, '')
  const opts = await withAuth(init)
  return fetch(`${baseUrl}${path}`, { cache: 'no-store', ...opts })
}

// ─── Client-side BFF helper (Client Components) ──────────────────────────────

/**
 * Fetches a Next.js BFF route (relative URL starting with /api/...).
 * The BFF has access to the HttpOnly token cookie, so no Authorization header
 * is needed on the client side — the cookie is forwarded automatically by the
 * browser for same-origin requests.
 *
 * Usage (in a 'use client' component):
 *   const res  = await bffFetch('/api/models', { method: 'GET' })
 *   const data = await res.json()
 */
export async function bffFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(path, {
    credentials: 'same-origin', // ensures cookies are sent
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
    ...init,
  })
}
