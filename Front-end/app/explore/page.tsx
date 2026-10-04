'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search, SlidersHorizontal, Orbit, Cpu, Database, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import './page.css'

type ModelListing = [string, string, string, string, string, string]

const models: ModelListing[] = [
  ['Vision Transformer XL', 'Computer Vision', 'High-resolution image classification with verifiable inference.', '0x71C7…4F2a', '0.18', 'ONNX'],
  ['Lumen Speech', 'Audio · Speech', 'Expressive, low-latency speech synthesis for production workflows.', '0xA93e…91D0', '0.24', 'PyTorch'],
  ['Semantic Atlas', 'Language · Embeddings', 'Compact multilingual embeddings for semantic search and retrieval.', '0x2bF1…C8e3', '0.08', 'Safetensors'],
  ['Delta Forecast', 'Time Series', 'Demand forecasting model with a transparent evaluation card.', '0x920a…88bC', '0.12', 'ONNX'],
  ['CodeLoom 7B', 'Developer Tools', 'A fine-tuned code completion model for local inference.', '0x9d11…21ef', '0.31', 'GGUF'],
  ['Latent Studio', 'Image Generation', 'A tuned diffusion model for consistent editorial illustration.', '0x451f…eA79', '0.16', 'Safetensors'],
]

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [sort, setSort] = useState('Featured')

  const categories = useMemo(
    () => ['All categories', ...Array.from(new Set(models.map((model) => model[1])))],
    [],
  )
  const filtered = useMemo(() => {
    const results = models.filter(
      (model) =>
        model.join(' ').toLowerCase().includes(query.trim().toLowerCase()) &&
        (category === 'All categories' || model[1] === category),
    )
    if (sort === 'Price: low to high') results.sort((a, b) => Number(a[4]) - Number(b[4]))
    if (sort === 'Name: A to Z') results.sort((a, b) => a[0].localeCompare(b[0]))
    return results
  }, [query, category, sort])

  function clearFilters() {
    setQuery('')
    setCategory('All categories')
    setSort('Featured')
  }

  return (
    <main className="marketplace-shell explore-page">
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

      <div className="explore-container">
        <div className="section-kicker">OPEN MODEL EXCHANGE <span>ETHEREUM · IPFS</span></div>
        <div className="explore-heading">
          <div>
            <h1>Discover AI Models</h1>
            <p>Inspect model details, verify creator ownership and IPFS availability, then purchase access using ETH.</p>
          </div>
          <span className="explore-count">
            {filtered.length.toString().padStart(2, '0')} OF {models.length.toString().padStart(2, '0')} MODELS
          </span>
        </div>

        <div className="explore-filters">
          <div className="explore-search">
            <Search aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search models, categories, creator wallets…"
              aria-label="Search models"
            />
          </div>
          <label className="explore-category-filter">
            <SlidersHorizontal aria-hidden="true" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <select className="explore-sort" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort models">
            <option>Featured</option>
            <option>Price: low to high</option>
            <option>Name: A to Z</option>
          </select>
        </div>

        {(query || category !== 'All categories' || sort !== 'Featured') && (
          <div className="explore-active-filters">
            <span>Showing {filtered.length} matching models</span>
            <button onClick={clearFilters}><X aria-hidden="true" /> Clear filters</button>
          </div>
        )}

        <div className="explore-grid">
          {filtered.map(([name, modelCategory, description, wallet, price, format], index) => {
            const ModelIcon = index % 3 === 0 ? Cpu : index % 3 === 1 ? Database : Orbit
            return (
              <article className="catalog-card" key={name}>
                <div className="catalog-art">
                  <div className="catalog-art-grid" />
                  <div className="catalog-model-icon"><ModelIcon aria-hidden="true" /></div>
                  <span className="catalog-status catalog-ipfs"><i /> IPFS PINNED</span>
                  <span className="catalog-status catalog-chain"><i /> ON-CHAIN</span>
                </div>
                <div className="catalog-body">
                  <span className="catalog-category">{modelCategory}</span>
                  <h2>{name}</h2>
                  <p>{description}</p>
                  <div className="catalog-meta">
                    <span>CREATOR <b>{wallet}</b></span>
                    <span>FORMAT <b>{format}</b></span>
                  </div>
                  <div className="catalog-footer">
                    <div><small>ACCESS PRICE</small><strong>{price} <i>ETH</i></strong></div>
                    <Link href={`/models/${name.toLowerCase().replaceAll(' ', '-')}`}>
                      View model <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="explore-empty">
            <p>No models match those filters.</p>
            <button onClick={clearFilters}>Clear filters</button>
          </div>
        )}
      </div>
    </main>
  )
}
