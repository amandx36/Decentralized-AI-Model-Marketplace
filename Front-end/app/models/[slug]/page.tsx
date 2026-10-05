import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Cpu, Database, Fingerprint, Orbit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './page.css'

const modelDetails: Record<string, { category: string; description: string; creator: string; format: string; price: string; cid: string; id: string }> = {
  'vision-transformer-xl': { category: 'COMPUTER VISION', description: 'High-resolution image classification with transparent, reproducible inference. This model is published by its creator, stored on IPFS, and available for access through Ethereum smart contracts.', creator: '0x71C7…4F2a', format: 'ONNX', price: '0.18', cid: 'bafybeigdyr…mkt9x', id: '#0042' },
  'lumen-speech': { category: 'AUDIO · SPEECH', description: 'Expressive, low-latency speech synthesis tuned for production workflows. Review its provenance and access terms before purchasing.', creator: '0xA93e…91D0', format: 'PyTorch', price: '0.24', cid: 'bafybeiaudio…91q2', id: '#0038' },
  'semantic-atlas': { category: 'LANGUAGE · EMBEDDINGS', description: 'Compact multilingual embeddings for semantic search and retrieval, with transparent ownership and content addressed model storage.', creator: '0x2bF1…C8e3', format: 'Safetensors', price: '0.08', cid: 'bafybeisem…c8e3', id: '#0031' },
  'delta-forecast': { category: 'TIME SERIES', description: 'Demand forecasting model with a transparent evaluation card, ready for time series workflows.', creator: '0x920a…88bC', format: 'ONNX', price: '0.12', cid: 'bafybeifore…88bc', id: '#0027' },
  'codeloom-7b': { category: 'DEVELOPER TOOLS', description: 'Fine-tuned code completion model designed for local inference and developer workflows.', creator: '0x9d11…21ef', format: 'GGUF', price: '0.31', cid: 'bafybeicode…21ef', id: '#0022' },
  'latent-studio': { category: 'IMAGE GENERATION', description: 'A tuned diffusion model for consistent editorial illustration and image generation.', creator: '0x451f…eA79', format: 'Safetensors', price: '0.16', cid: 'bafybeilaten…ea79', id: '#0019' },
}

export default async function ModelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const detail = modelDetails[slug] ?? modelDetails['vision-transformer-xl']
  const name = slug.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ')

  return (
    <main className="marketplace-shell model-detail-page">
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

      <div className="model-detail-container">
        <Link href="/explore" className="model-back-link"><ArrowLeft aria-hidden="true" /> All models</Link>
        <div className="model-detail-grid">
          <div>
            <div className="model-detail-art">
              <div className="model-detail-art-icon"><Cpu aria-hidden="true" /></div>
            </div>
            <section className="model-detail-copy">
              <div className="section-kicker">
                {detail.category}<span className="model-verified">IPFS PINNED · OWNERSHIP VERIFIED</span>
              </div>
              <h1>{name}</h1>
              <p>{detail.description}</p>
              <div className="model-detail-actions">
                <Button className="button-primary">Buy Access · {detail.price} ETH <ArrowUpRight size={15} /></Button>
                <Button variant="outline" className="button-secondary"><Cpu size={15} /> Run Model</Button>
              </div>
              <p className="model-run-note">Run Model is enabled when access is verified for your connected wallet.</p>
            </section>
          </div>

          <aside className="model-provenance">
            <div className="model-provenance-heading">
              <h2>Model provenance</h2>
              <p>Storage, ownership, and contract identifiers</p>
            </div>
            <dl>
              {[
                ['Creator', detail.creator],
                ['Owner wallet', detail.creator],
                ['Model format', detail.format],
                ['Price', `${detail.price} ETH`],
                ['IPFS CID', detail.cid],
                ['Blockchain model ID', detail.id],
                ['Network', 'Ethereum'],
                ['Contract', '0x8A31…D09F'],
              ].map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
            <div className="model-ipfs-note">
              <Database aria-hidden="true" /> Content addressed on IPFS
              <Fingerprint aria-hidden="true" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
