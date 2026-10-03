import { NextRequest, NextResponse } from 'next/server'

const allowedActions = new Set(['request-nonce', 'verify', 'refresh'])

// Backend AuthResponse shape (expiresIn is milliseconds from JwtService default 86400000ms)
type BackendAuthResponse = {
  token?: string
  refreshToken?: string
  walletAddress?: string
  role?: string
  message?: string
  expiresIn?: number // milliseconds
}

function getBackendUrl() {
  return (process.env.AIMARKETPLACE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params

  if (!allowedActions.has(action)) {
    return NextResponse.json({ message: 'Unknown auth action' }, { status: 404 })
  }

  const backendUrl = getBackendUrl()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Request body must be valid JSON.' }, { status: 400 })
  }

  let backendResponse: Response
  try {
    backendResponse = await fetch(`${backendUrl}/api/auth/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json(
      { message: 'Unable to reach the authentication service. Is the backend running on port 8000?' },
      { status: 502 },
    )
  }

  let data: BackendAuthResponse
  try {
    data = (await backendResponse.json()) as BackendAuthResponse
  } catch {
    return NextResponse.json(
      { message: 'The authentication service returned an invalid response.' },
      { status: 502 },
    )
  }

  const outgoing = NextResponse.json(data, { status: backendResponse.status })

  // Only set cookies on successful auth responses that carry tokens
  if (backendResponse.ok && data.token && data.refreshToken && data.walletAddress) {
    const secure = process.env.NODE_ENV === 'production'

    // expiresIn from JwtService is in milliseconds → convert to seconds for cookie maxAge
    const expiresInSeconds = data.expiresIn
      ? Math.floor(data.expiresIn / 1000)
      : 86400 // fallback: 24 h

    // HttpOnly – not readable by JS, safe against XSS
    outgoing.cookies.set('aimarketplace_token', data.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: expiresInSeconds,
      path: '/',
    })
    outgoing.cookies.set('aimarketplace_refresh_token', data.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    // HttpOnly – stores wallet address server-side for middleware auth guards
    outgoing.cookies.set('aimarketplace_wallet', data.walletAddress, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: expiresInSeconds,
      path: '/',
    })

    // Non-HttpOnly – readable client-side so UI can display the abbreviated address
    // Contains no secret material – wallet addresses are public
    outgoing.cookies.set('aimarketplace_wallet_pub', data.walletAddress, {
      httpOnly: false,
      sameSite: 'lax',
      secure,
      maxAge: expiresInSeconds,
      path: '/',
    })
  }

  return outgoing
}
