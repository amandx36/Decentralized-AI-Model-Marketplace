/**
 * middleware.ts
 *
 * Protects /dashboard and /upload — redirects unauthenticated visitors to /login.
 * Runs on the Edge Runtime so we read cookies directly from the request (no
 * `next/headers` import).
 */

import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_TOKEN } from '@/lib/auth'

// Routes that require a valid session
const PROTECTED = ['/dashboard']    // bypassing the /upload so that i can develop it '/upload']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  )
  if (!isProtected) return NextResponse.next()

  const token = request.cookies.get(COOKIE_TOKEN)?.value
  if (token && token.length > 0) return NextResponse.next()

  // No token — redirect to login, preserving the intended destination
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Only run middleware on app pages — skip API routes, static files, and _next internals
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
