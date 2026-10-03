/**
 * lib/auth.ts
 *
 * Server-side auth helpers that read / clear the HttpOnly cookies set by the
 * BFF route (app/api/auth/[action]/route.ts).
 *
 * All functions are async-safe for use in Next.js App Router Server Components,
 * Route Handlers, and middleware.ts.
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// ─── Cookie names ────────────────────────────────────────────────────────────
export const COOKIE_TOKEN = 'aimarketplace_token'
export const COOKIE_REFRESH = 'aimarketplace_refresh_token'
export const COOKIE_WALLET = 'aimarketplace_wallet'
export const COOKIE_WALLET_PUB = 'aimarketplace_wallet_pub'

// ─── Server-Component helpers ─────────────────────────────────────────────────

/** Returns the JWT access token from the HttpOnly cookie, or null. */
export async function getToken(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(COOKIE_TOKEN)?.value ?? null
}

/** Returns the wallet address from the HttpOnly cookie, or null. */
export async function getWalletAddress(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(COOKIE_WALLET)?.value ?? null
}

/** Returns true when a valid-looking access token cookie is present. */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken()
  return token !== null && token.length > 0
}

// ─── Sign-out helper (Route Handler / Server Action) ──────────────────────────

/**
 * Clears all auth cookies and returns a NextResponse that redirects to /login.
 * Call this from a Route Handler or Server Action — not inside a Server Component.
 */
export function signOutResponse(redirectTo = '/login'): NextResponse {
  const response = NextResponse.redirect(redirectTo)
  const opts = { path: '/', maxAge: 0 } as const
  response.cookies.set(COOKIE_TOKEN, '', opts)
  response.cookies.set(COOKIE_REFRESH, '', opts)
  response.cookies.set(COOKIE_WALLET, '', opts)
  response.cookies.set(COOKIE_WALLET_PUB, '', opts)
  return response
}

// ─── Token-refresh helper ─────────────────────────────────────────────────────

/**
 * Attempts a silent token refresh using the stored refresh token.
 * Returns true if a new token was issued, false otherwise.
 *
 * Call from middleware or a Server Action before redirecting to /login.
 */
export async function tryRefreshToken(): Promise<boolean> {
  const jar = await cookies()
  const refreshToken = jar.get(COOKIE_REFRESH)?.value
  if (!refreshToken) return false

  try {
    const res = await fetch(
      `${process.env.AIMARKETPLACE_API_URL ?? 'http://localhost:8000'}/api/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      },
    )
    if (!res.ok) return false
    // The BFF route handles cookie-setting; here we're calling the backend directly,
    // so this is only used as a lightweight liveness check. Actual cookie refresh
    // goes through /api/auth/refresh (the BFF) from the client.
    return true
  } catch {
    return false
  }
}
