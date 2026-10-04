'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Box,
  Cpu,
  ExternalLink,
  Fingerprint,
  Orbit,
  Plus,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import './page.css'

function readWallet() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)aimarketplace_wallet_pub=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

const entries = [
  ['Vision Transformer XL', 'Uploaded · Inference ready', '0.18 ETH', '0x71C7…4F2a'],
  ['Semantic Atlas', 'Purchased · Access verified', '0.08 ETH', '0x2bF1…C8e3'],
  ['Lumen Speech', 'Uploaded · IPFS pinned', '0.24 ETH', '0xA93e…91D0'],
]

const stats = [
  { label: 'ETH Balance', value: '—', sub: 'Connected wallet', Icon: Wallet },
  { label: 'Uploaded Models', value: '02', sub: 'Published by you', Icon: Box },
  { label: 'Purchased Models', value: '01', sub: 'Access verified', Icon: Cpu },
  { label: 'Earnings', value: '— ETH', sub: 'Settled on Ethereum', Icon: ArrowDownLeft },
]

export default function DashboardPage() {
  const [wallet, setWallet] = useState<string | null>(null)

  useEffect(() => setWallet(readWallet()), [])

  return (
    <main className="marketplace-shell dashboard-page">
      <header className="site-header">
        <Link href="/" className="brand">
          <span className="brand-mark"><Orbit size={18} /></span>
          <span><b>AI MARKETPLACE</b><small>/ @amandx36</small></span>
        </Link>
        <nav className="main-nav">
          <Link href="/explore">Explore</Link>
          <Link href="/upload">Upload</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/#architecture">Documentation</Link>
        </nav>
        <span className="wallet-button dashboard-wallet">
          <span className="live-dot" />
          {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : 'Wallet connected'}
        </span>
      </header>

      <div className="dashboard-container">
        <div className="section-kicker">YOUR ON-CHAIN WORKSPACE <span>ACCOUNT / OVERVIEW</span></div>

        <div className="dashboard-titlebar">
          <div>
            <h1>Marketplace Dashboard</h1>
            <p>{wallet ?? 'Wallet address unavailable'}</p>
          </div>
          <Link href="/upload">
            <Button className="button-primary"><Plus size={16} /> Quick Upload</Button>
          </Link>
        </div>

        <div className="dashboard-stats">
          {stats.map(({ label, value, sub, Icon }) => (
            <article className="dashboard-stat" key={label}>
              <div className="dashboard-stat-heading">
                <span>{label}</span>
                <Icon aria-hidden="true" />
              </div>
              <strong>{value}</strong>
              <span className="dashboard-stat-subtitle">{sub}</span>
            </article>
          ))}
        </div>

        <div className="dashboard-panels">
          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Your models</h2>
                <p>Ownership, access and inference readiness</p>
              </div>
              <Link href="/explore">Browse models <ArrowUpRight aria-hidden="true" /></Link>
            </div>
            <div>
              {entries.map(([name, status, price, creator], index) => (
                <div className="dashboard-model-row" key={name}>
                  <div className="dashboard-model-icon">
                    {index === 1 ? <Cpu size={16} /> : <Box size={16} />}
                  </div>
                  <div className="dashboard-model-copy">
                    <b>{name}</b>
                    <span>{status}</span>
                  </div>
                  <span className="dashboard-model-creator">{creator}</span>
                  <strong className="dashboard-model-price">{price}</strong>
                  <Link href="/models/vision-transformer-xl" aria-label={`View ${name}`}>
                    <ExternalLink aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel dashboard-identity">
            <div className="dashboard-identity-heading">
              <Fingerprint aria-hidden="true" />
              <h2>Wallet identity</h2>
            </div>
            <p className="dashboard-address">
              {wallet ?? 'Connect your wallet to view identity'}
            </p>
            <div className="dashboard-identity-details">
              <div><span>Authentication</span><span className="verified-text">Signed message verified</span></div>
              <div><span>Network</span><span>Ethereum</span></div>
            </div>
            <Link href="/transactions" className="dashboard-transactions-link">
              Recent transactions <ArrowUpRight aria-hidden="true" />
            </Link>
          </section>
        </div>

        <section className="dashboard-panel dashboard-recent">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Recent transactions</h2>
              <p>Purchases and model registrations</p>
            </div>
            <Link href="/transactions">View all <ArrowUpRight aria-hidden="true" /></Link>
          </div>
          <div className="dashboard-activity-grid">
            <div><ArrowUpRight aria-hidden="true" /><span>Model access purchased</span><b>0.08 ETH</b></div>
            <div><ArrowDownLeft aria-hidden="true" /><span>Model registered on-chain</span><b>Confirmed</b></div>
          </div>
        </section>
      </div>
    </main>
  )
}
