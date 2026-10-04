'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Copy, Loader2, ShieldCheck, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './page.css'

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
      if (!window.ethereum) {
        throw new Error('Install a browser wallet such as MetaMask to continue.')
      }

      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[]
      const walletAddress = accounts?.[0]
      if (!walletAddress) throw new Error('No wallet address was returned.')
      setAddress(walletAddress)

      setStatus('Requesting a one-time nonce…')
      const nonceRes = await fetch('/api/auth/request-nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
        credentials: 'same-origin',
      })

      if (!nonceRes.ok) {
        const errBody = await nonceRes.json().catch(() => ({})) as { message?: string }
        throw new Error(
          errBody.message ?? `Nonce request failed (HTTP ${nonceRes.status}). Is the backend running?`,
        )
      }

      const nonceData = (await nonceRes.json()) as { nonce?: string; message?: string }
      if (!nonceData.nonce) {
        throw new Error(nonceData.message ?? 'The authentication service did not return a nonce.')
      }
      setMessage(nonceData.nonce)

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
        const msg = sigErr instanceof Error ? sigErr.message : String(sigErr)
        if (msg.toLowerCase().includes('user rejected') || msg.includes('4001')) {
          throw new Error('Signature request was rejected. Please try again.')
        }
        throw sigErr
      }

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

      setStatus(
        `Connected as ${result.walletAddress.slice(0, 6)}…${result.walletAddress.slice(-4)}`,
      )
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
    <main className="login-page">
      <header className="login-header">
        <a href="/" className="login-brand">AI MARKETPLACE <span>/ @amandx36</span></a>
        <a href="/" className="login-back">Back home</a>
      </header>

      <section className="login-main">
        <div className="login-card">
          <div className="login-icon"><WalletCards aria-hidden="true" /></div>
          <p className="login-eyebrow">Marketplace identity</p>
          <h1>Enter the<br />marketplace.</h1>
          <p className="login-description">
            Connect your wallet to access your workspace, publish models, and explore the network.
          </p>

          <Button onClick={connectWallet} disabled={busy} className="login-connect-button">
            {busy ? <Loader2 className="login-spinner" aria-hidden="true" /> : <WalletCards aria-hidden="true" />}
            {busy ? 'Connecting…' : 'Connect wallet'}
            <ArrowRight aria-hidden="true" />
          </Button>

          <div className="login-security-note">
            <ShieldCheck aria-hidden="true" />
            <span>Your wallet signs a five-minute nonce. We never receive or store your private key.</span>
          </div>

          {address && (
            <button className="login-address" onClick={() => navigator.clipboard.writeText(address)}>
              <Copy aria-hidden="true" />
              {address}
            </button>
          )}

          <p className="login-status" aria-live="polite">{status}</p>
          {message && <p className="login-sr-only">Nonce received: {message}</p>}
          {error && <p className="login-error" role="alert">{error}</p>}
        </div>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-loading" />}>
      <LoginPageContent />
    </Suspense>
  )
}
