import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, Orbit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './page.css'

const rows = [
  ['Model access purchased', 'Vision Transformer XL', '0.18 ETH', 'Confirmed', '0x4d…9ae1'],
  ['Creator earnings', 'Semantic Atlas', '0.08 ETH', 'Confirmed', '0x71…a4c2'],
  ['Model registered', 'Lumen Speech', '—', 'Confirmed', '0xb2…c508'],
  ['Model access purchased', 'Delta Forecast', '0.12 ETH', 'Confirmed', '0x8c…4d92'],
]

export default function TransactionsPage() {
  return (
    <main className="marketplace-shell transactions-page">
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
        <Link href="/login"><Button className="wallet-button">Connect Wallet</Button></Link>
      </header>

      <div className="transactions-container">
        <div className="section-kicker">ETHEREUM ACTIVITY <span>PUBLICLY VERIFIABLE</span></div>
        <h1>Transactions</h1>
        <p className="transactions-description">
          Purchases, creator earnings, and model registrations linked to marketplace smart contracts.
        </p>

        <div className="transactions-table-wrap">
          <div className="transactions-table transactions-table-head">
            <span>ACTIVITY</span><span>MODEL</span><span>VALUE</span><span>STATUS</span><span>TX HASH</span>
          </div>
          {rows.map(([action, model, value, status, hash], index) => (
            <div className="transactions-table transactions-table-row" key={hash}>
              <span className="transaction-action">
                {index === 1
                  ? <ArrowDownLeft className="transaction-incoming" aria-hidden="true" />
                  : <ArrowUpRight className="transaction-outgoing" aria-hidden="true" />}
                {action}
              </span>
              <span className="transaction-model">{model}</span>
              <span className="transaction-value">{value}</span>
              <span className="transaction-status"><i />{status}</span>
              <span className="transaction-hash">{hash} ↗</span>
            </div>
          ))}
        </div>
        <p className="transactions-note">Activity data will reflect transactions associated with your connected wallet.</p>
      </div>
    </main>
  )
}
