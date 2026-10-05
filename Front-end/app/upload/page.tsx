'use client'
import { createModelUpload } from '@/lib/api/model-upload'
import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent, KeyboardEvent } from 'react'
import { ArrowLeft, Check, FileUp, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import './page.css'

// Allowed file types for model uploads.
const ALLOWED_EXTENSIONS = ['.onnx', '.pt', '.pkl', '.safetensors']
const ACCEPTED_FILE_TYPES = ALLOWED_EXTENSIONS.join(',')

type UploadStatus = 'idle' | 'file-selected' | 'uploading' | 'success' | 'error'
type FieldName = 'modelName' | 'description' | 'category' | 'price' | 'file'
type FieldErrors = Partial<Record<FieldName, string>>

// Check if the chosen file is in the list of supported model formats.
function isAllowedModelFile(file: File): boolean {
  const lowerCaseName = file.name.toLowerCase()
  return ALLOWED_EXTENSIONS.some((extension) => lowerCaseName.endsWith(extension))
}

// Convert bytes into a readable size like KB or MB.
function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`

  const units = ['KB', 'MB', 'GB', 'TB']
  let size = sizeInBytes / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

export default function UploadPage() {
  // This ref lets us trigger the hidden file input from the button or dropzone.
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Store the values the user types into the form.
  const [file, setFile] = useState<File | null>(null)
  const [modelName, setModelName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')

  // UI state: drag effect, form status, progress bar, and validation messages.
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [statusMessage, setStatusMessage] = useState('')

  // Validate the selected file and save it if the type is allowed.
  const handleSelectedFile = (selectedFile: File) => {
    if (!isAllowedModelFile(selectedFile)) {
      const message = 'Choose an .onnx, .pt, .pkl, or .safetensors model file.'
      setFile(null)
      setFieldErrors((currentErrors) => ({ ...currentErrors, file: message }))
      setUploadStatus('error')
      setStatusMessage(message)
      setProgress(0)
      return
    }

    setFile(selectedFile)
    setFieldErrors((currentErrors) => ({ ...currentErrors, file: undefined }))
    setUploadStatus('file-selected')
    setStatusMessage('File selected. Complete the details, then validate the form.')
    setProgress(0)
  }

  // When the user chooses a file from file picker.
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: FileList | null = event.currentTarget.files
    const selectedFile = selectedFiles?.item(0)

    if (selectedFile) handleSelectedFile(selectedFile)

    // Reset the input so the same file can be picked again later.
    event.currentTarget.value = ''
  }

  // When the user drags a file into the upload area.
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)

    const droppedFiles: FileList = event.dataTransfer.files
    const droppedFile = droppedFiles.item(0)
    if (droppedFile) handleSelectedFile(droppedFile)
  }

  // Allow pressing Enter or Space to open the file picker.
  const handleDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      fileInputRef.current?.click()
    }
  }

  // Remove the selected file and reset the file-related message.
  const removeSelectedFile = () => {
    setFile(null)
    setFieldErrors((currentErrors) => ({ ...currentErrors, file: undefined }))
    setUploadStatus('idle')
    setStatusMessage('')
    setProgress(0)
  }

  // Check all required fields before the form can be submitted.
  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {}

    if (!modelName.trim()) errors.modelName = 'Enter a model name.'
    if (!description.trim()) errors.description = 'Enter a model description.'
    if (!category.trim()) errors.category = 'Enter a category.'

    if (price.trim() === '') {
      errors.price = 'Enter an access price in ETH.'
    } else if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      errors.price = 'Price must be a valid, non-negative number.'
    }

    if (!file) errors.file = 'Select a supported model file before publishing.'

    return errors
  }

  // Submit the model metadata and file details to the backend.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors = validateForm()
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0 || !file) {
      setUploadStatus('error')
      setStatusMessage('Please correct the highlighted fields before publishing.')
      return
    }

    try {
      setUploadStatus('uploading')
      setProgress(0)
      setStatusMessage('Sending model details to the backend...')

      await createModelUpload({
        modelName: modelName.trim(),
        description: description.trim(),
        category: category.trim(),
        price: Number(price),
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || 'application/octet-stream',
      })

      setUploadStatus('success')
      setProgress(100)
      setStatusMessage('Model details submitted and upload session created successfully.')
    } catch (error) {
      setUploadStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'Failed to submit model details.')
    }
  }

  // Combine CSS classes for the dropzone based on state.
  const dropzoneClassName = [
    'upload-dropzone',
    isDragging ? 'upload-dropzone-dragging' : '',
    file ? 'upload-dropzone-selected' : '',
    fieldErrors.file ? 'upload-dropzone-error' : '',
  ].filter(Boolean).join(' ')

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
          <form className="upload-form" noValidate onSubmit={handleSubmit}>
            <label className="upload-field" htmlFor="model-name">
              Model name
              <Input
                id="model-name"
                className="upload-input"
                placeholder="e.g. Vision Transformer XL"
                value={modelName}
                onChange={(event) => setModelName(event.currentTarget.value)}
                aria-invalid={Boolean(fieldErrors.modelName)}
                aria-describedby={fieldErrors.modelName ? 'model-name-error' : undefined}
              />
              {fieldErrors.modelName && <span className="upload-field-error" id="model-name-error">{fieldErrors.modelName}</span>}
            </label>

            <label className="upload-field" htmlFor="model-description">
              Description
              <Textarea
                id="model-description"
                className="upload-input upload-textarea"
                placeholder="What makes this model useful?"
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={fieldErrors.description ? 'description-error' : undefined}
              />
              {fieldErrors.description && <span className="upload-field-error" id="description-error">{fieldErrors.description}</span>}
            </label>

            <div className="upload-field-grid">
              <label className="upload-field" htmlFor="model-category">
                Category
                <Input
                  id="model-category"
                  className="upload-input"
                  placeholder="Computer vision"
                  value={category}
                  onChange={(event) => setCategory(event.currentTarget.value)}
                  aria-invalid={Boolean(fieldErrors.category)}
                  aria-describedby={fieldErrors.category ? 'category-error' : undefined}
                />
                {fieldErrors.category && <span className="upload-field-error" id="category-error">{fieldErrors.category}</span>}
              </label>

              <label className="upload-field" htmlFor="model-price">
                Access price (ETH)
                <Input
                  id="model-price"
                  className="upload-input"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.18"
                  value={price}
                  onChange={(event) => setPrice(event.currentTarget.value)}
                  aria-invalid={Boolean(fieldErrors.price)}
                  aria-describedby={fieldErrors.price ? 'price-error' : undefined}
                />
                {fieldErrors.price && <span className="upload-field-error" id="price-error">{fieldErrors.price}</span>}
              </label>
            </div>

            <Button className="upload-publish-button" type="submit" disabled={uploadStatus === 'uploading'}>
              {uploadStatus === 'uploading' ? 'Preparing upload…' : 'Publish model'}
              <Check aria-hidden="true" data-icon="inline-end" />
            </Button>

            {statusMessage && (
              <p
                className={`upload-status-message upload-status-${uploadStatus}`}
                role={uploadStatus === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >
                {statusMessage}
              </p>
            )}
          </form>

          <section className="upload-file-panel" aria-label="Model file selection">
            <input
              ref={fileInputRef}
              id="model-file-input"
              className="upload-file-input"
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              aria-label="Choose a model file"
              onChange={handleFileSelect}
            />

            <div
              className={dropzoneClassName}
              role="button"
              tabIndex={0}
              aria-label="Choose a model file by browsing or dragging it here"
              aria-describedby="upload-file-help upload-file-error"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={handleDropzoneKeyDown}
              onDragOver={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'copy'
                setIsDragging(true)
              }}
              onDragLeave={(event: DragEvent<HTMLDivElement>) => {
                if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
                setIsDragging(false)
              }}
              onDrop={handleDrop}
            >
              {file ? (
                <FileUp className="upload-cloud-icon" aria-hidden="true" />
              ) : (
                <UploadCloud className="upload-cloud-icon" aria-hidden="true" />
              )}

              <h2 id="upload-dropzone-title">{file ? 'Model selected' : 'Drop your model'}</h2>

              <p id="upload-file-help">
                {file
                  ? 'Your file is selected locally and has not been uploaded.'
                  : 'Upload a .onnx, .pt, .pkl, or .safetensors file. Select or drag a file to begin.'}
              </p>

              {file && (
                <div className="upload-selected-file" aria-live="polite">
                  <strong title={file.name}>{file.name}</strong>
                  <span>{formatFileSize(file.size)}</span>
                </div>
              )}
            </div>

            <p className="upload-file-error" id="upload-file-error" role="status" aria-live="polite">
              {fieldErrors.file ?? ''}
            </p>

            <div className="upload-file-actions">
              <Button
                variant="outline"
                className="upload-choose-button"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose file
              </Button>

              {file && (
                <Button variant="outline" className="upload-remove-button" type="button" onClick={removeSelectedFile}>
                  <Trash2 aria-hidden="true" />
                  Remove file
                </Button>
              )}
            </div>

            {uploadStatus === 'uploading' && (
              <div className="upload-progress" aria-label="Upload progress">
                <div className="upload-progress-label">
                  <span>Submitting model details</span>
                  <span>{progress}%</span>
                </div>

                <div
                  className="upload-progress-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label="Model upload progress"
                >
                  <span className="upload-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
