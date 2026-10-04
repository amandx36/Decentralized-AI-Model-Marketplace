import { ArrowLeft, Check, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import './page.css'

export default function UploadPage() {
  return (
    <main className="upload-page">
      <header className="upload-header">
        <div className="upload-header-inner">
          <a href="/" className="upload-brand">
            AI MARKETPLACE <span>/ @amandx36</span>
          </a>
          <a href="/dashboard" className="upload-header-back">
            Back to dashboard
          </a>
        </div>
      </header>

      <div className="upload-container">
        <a href="/dashboard" className="upload-breadcrumb">
          <ArrowLeft aria-hidden="true" />
          Dashboard
        </a>

        <section className="upload-intro">
          <p className="upload-eyebrow">Creator studio / IPFS + Ethereum</p>
          <h1>Monetize your intelligence</h1>
          <p className="upload-description">
            Upload your trained model, store it on IPFS, register its ownership on-chain,
            set your price, and make it available to buyers.
          </p>
        </section>

        <div className="upload-content">
          <form className="upload-form">
            <label className="upload-field">
              Model name
              <Input className="upload-input" placeholder="e.g. Vision Transformer XL" />
            </label>

            <label className="upload-field">
              Description
              <Textarea
                className="upload-input upload-textarea"
                placeholder="What makes this model useful?"
              />
            </label>

            <div className="upload-field-grid">
              <label className="upload-field">
                Category
                <Input className="upload-input" placeholder="Computer vision" />
              </label>
              <label className="upload-field">
                Access price
                <Input className="upload-input" placeholder="0.18 ETH" />
              </label>
            </div>

            <Button className="upload-publish-button" type="button">
              Publish model
              <Check aria-hidden="true" data-icon="inline-end" />
            </Button>
          </form>

          <section className="upload-dropzone" aria-labelledby="upload-dropzone-title">
            <UploadCloud className="upload-cloud-icon" aria-hidden="true" />
            <h2 id="upload-dropzone-title">Drop your model</h2>
            <p>
              Upload a .onnx, .pt, .pkl, or .safetensors file. Files are pinned to IPFS
              after publishing.
            </p>
            <Button variant="outline" className="upload-choose-button" type="button">
              Choose file
            </Button>
          </section>
        </div>
      </div>
    </main>
  )
}
