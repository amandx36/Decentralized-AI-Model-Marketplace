'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Copy, Loader2, ShieldCheck, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

/** Read the non-HttpOnly public wallet cookie so we can skip login if already authed. */
function readPublicWalletCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)aimarketplace_wallet_pub=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function LoginPageContent() {
  const searchParams = useSearchParams()

  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('Connect your wallet to continue')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // If already authenticated, forward to the intended destination (or dashboard)
  useEffect(() => {
    const existing = readPublicWalletCookie()
    if (existing) {
      const from = searchParams?.get('from') ?? '/dashboard'
      window.location.href = from
    }
  }, [searchParams])

  async function connectWallet() {
    setError('')
    setBusy(true)
    try {
      // ── 1. MetaMask check ──────────────────────────────────────────────────
      if (!window.ethereum) {
        throw new Error('Install a browser wallet such as MetaMask to continue.')
      }

      // ── 2. Request accounts ────────────────────────────────────────────────
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[]
      const walletAddress = accounts?.[0]
      if (!walletAddress) throw new Error('No wallet address was returned.')
      setAddress(walletAddress)

      // ── 3. Request a one-time nonce from the backend (via BFF) ────────────
      setStatus('Requesting a one-time nonce…')
      const nonceRes = await fetch('/api/auth/request-nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
        credentials: 'same-origin',
      })

      // Surface backend error message if available
      if (!nonceRes.ok) {
        const errBody = await nonceRes.json().catch(() => ({})) as { message?: string }
        throw new Error(
          errBody.message ??
            `Nonce request failed (HTTP ${nonceRes.status}). Is the backend running?`,
        )
      }

      const nonceData = (await nonceRes.json()) as { nonce?: string; message?: string }
      if (!nonceData.nonce) {
        throw new Error(
          nonceData.message ?? 'The authentication service did not return a nonce.',
        )
      }
      setMessage(nonceData.nonce)

      // ── 4. Ask MetaMask to sign the nonce (EIP-191 personal_sign) ─────────
      setStatus('Sign the nonce in your wallet…')
      const nonceBytes = new TextEncoder().encode(nonceData.nonce)
      const nonceHex = `0x${Array.from(nonceBytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
      let signature: string
      try {
        signature = (await window.ethereum.request({
          method: 'personal_sign',
          params: [nonceHex, walletAddress],
        })) as string
      } catch (sigErr: unknown) {
        // User rejected the signature request
        const msg = sigErr instanceof Error ? sigErr.message : String(sigErr)
        if (msg.toLowerCase().includes('user rejected') || msg.includes('4001')) {
          throw new Error('Signature request was rejected. Please try again.')
        }
        throw sigErr
      }

      // ── 5. Send { walletAddress, message (nonce), signature } to backend ──
      setStatus('Verifying your signature…')
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, message: nonceData.nonce, signature }),
        credentials: 'same-origin',
      })

      const result = (await verifyRes.json()) as {
        walletAddress?: string
        role?: string
        message?: string
        expiresIn?: number
        token?: string
      }

      if (!verifyRes.ok || !result.walletAddress) {
        throw new Error(result.message ?? 'Wallet verification failed.')
      }

      // ── 6. Success — BFF already set HttpOnly JWT cookies ─────────────────
      setStatus(
        `Connected as ${result.walletAddress.slice(0, 6)}…${result.walletAddress.slice(-4)}`,
      )

      // Forward to the originally intended page (or dashboard)
      const from = searchParams?.get('from') ?? '/dashboard'
      window.location.href = from
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong.')
      setStatus('Connect your wallet to continue')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#030303] px-6 text-white sm:px-10 lg:px-12">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between py-7">
        <a href="/" className="font-serif text-[15px] tracking-[-.04em] text-white/90">
          PRISMATIC
        </a>
        <a
          href="/"
          className="text-xs uppercase tracking-[.12em] text-white/45 hover:text-white"
        >
          Back home
        </a>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-90px)] max-w-[1440px] items-center justify-center py-16">
        <div className="w-full max-w-[470px] rounded-[28px] border border-white/15 bg-[#0b0b0b] p-7 shadow-[0_30px_120px_rgba(0,0,0,.45)] sm:p-10">
          <div className="mb-10 flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[.04]">
            <WalletCards className="text-white/80" />
          </div>

          <p className="text-xs uppercase tracking-[.18em] text-white/40">Prismatic identity</p>
          <h1 className="mt-4 font-serif text-5xl leading-[.9] tracking-[-.06em]">
            Enter the
            <br />
            marketplace.
          </h1>
          <p className="mt-6 text-sm leading-6 text-white/50">
            Connect your wallet to access your workspace, publish models, and explore the
            network.
          </p>

          <Button
            onClick={connectWallet}
            disabled={busy}
            className="mt-9 h-14 w-full rounded-full bg-white text-black hover:bg-white/85"
          >
            {busy ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <WalletCards data-icon="inline-start" />
            )}
            {busy ? 'Connecting…' : 'Connect wallet'}
            <ArrowRight data-icon="inline-end" />
          </Button>

          <div className="mt-6 flex items-start gap-3 border-t border-white/10 pt-6 text-xs leading-5 text-white/40">
            <ShieldCheck className="mt-0.5 shrink-0 text-white/65" />
            Your wallet signs a five-minute nonce. We never receive or store your private key.
          </div>

          {address && (
            <button
              onClick={() => navigator.clipboard.writeText(address)}
              className="mt-5 flex w-full items-center gap-2 rounded-xl bg-white/[.04] px-3 py-2 text-left font-mono text-xs text-white/50 hover:text-white"
            >
              <Copy />
              {address}
            </button>
          )}

          <p className="mt-5 text-center text-xs text-white/35" aria-live="polite">
            {status}
          </p>

          {/* Screen-reader nonce announcement */}
          {message && <p className="sr-only">Nonce received: {message}</p>}

          {error && (
            <p className="mt-4 text-center text-sm text-red-300" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030303]" />}>
      <LoginPageContent />
    </Suspense>
  )
}
