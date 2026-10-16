
'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import TriangleSpinner from '@/components/ui/TriangleSpinner'
import {
  getUploadFile,
  getUploadReceipt,
  removeUploadFile,
  removeUploadReceipt,
  saveUploadReceipt,
} from '@/lib/model-upload-file'
import styles from './page.module.css'

type UploadPhase = 'loading' | 'uploading' | 'success' | 'error'

type UploadReceipt = {
  cid: string
  fileId: string
  actualSize?: number
}

function messageFrom(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message
  }

  return fallback
}

async function readResponse(response: Response): Promise<unknown> {
  return response.json().catch(() => undefined)
}

async function completeUpload(
  uploadId: string,
  receipt: UploadReceipt
) {
  const response = await fetch(
    '/api/upload/complete',
    {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ uploadId, ...receipt }),
    }
  )

  const body = await readResponse(response)

  if (!response.ok) {
    throw new Error(
      messageFrom(
        body,
        `Could not confirm the upload (HTTP ${response.status}).`
      )
    )
  }
}

function UploadContent() {
  const searchParams = useSearchParams()
  const uploadId = searchParams.get('uploadId')

  const [phase, setPhase] = useState<UploadPhase>('loading')
  const [message, setMessage] = useState(
    'Preparing your secure upload…'
  )
  const [cid, setCid] = useState('')

  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    async function upload() {
      if (!uploadId) {
        setPhase('error')
        setMessage(
          'This upload link is missing its session ID. Return to the upload form and try again.'
        )
        return
      }

      try {
        // Recover a previous Pinata upload if its receipt was saved.
        const savedReceipt = await getUploadReceipt(uploadId)

        if (savedReceipt) {
          setMessage('Confirming the stored Pinata upload…')

          await completeUpload(uploadId, savedReceipt)

          await Promise.allSettled([
            removeUploadFile(uploadId),
            removeUploadReceipt(uploadId),
          ])

          setCid(savedReceipt.cid)
          setPhase('success')
          setMessage(
            'Your model file is stored on IPFS and the upload session has been updated.'
          )
          return
        }

        // Retrieve the file saved by the upload form.
        const file = await getUploadFile(uploadId)

        if (!file) {
          throw new Error(
            'The selected file is no longer available in this browser. Return to the upload form and select it again.'
          )
        }

        // Request a short-lived Pinata upload authorization.
        setMessage('Requesting a short-lived upload authorization…')

        const authorizationResponse = await fetch(
          '/api/upload/getVerifyandURL',
          {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({ uploadId }),
          }
        )

        const authorization = await readResponse(
          authorizationResponse
        )
        if (!authorizationResponse.ok) {
          throw new Error(
            messageFrom(
              authorization,
              `Could not authorize upload (HTTP ${authorizationResponse.status}).`
            )
          )
        }

        if (
          !authorization ||
          typeof authorization !== 'object' ||
          !('uploadUrl' in authorization) ||
          typeof authorization.uploadUrl !== 'string' ||
          !authorization.uploadUrl
        ) {
          throw new Error(
            'The upload service returned an invalid authorization.'
          )
        }

        const uploadUrl = authorization.uploadUrl

        setPhase('uploading')
        setMessage(
          `Uploading ${file.name} to Pinata… Keep this page open until it finishes.`
        )

        // Upload the file directly to Pinata.
        const form = new FormData()
        form.append('network', 'public')
        form.append('file', file, file.name)
        form.append('name', file.name)
        form.append('keyvalues', JSON.stringify({ uploadId }))

        const pinataResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: form,
        })

        const pinataResponseText = await pinataResponse.text()
        let pinataBody: unknown
        try {
          pinataBody = pinataResponseText ? JSON.parse(pinataResponseText) : undefined
        } catch {
          pinataBody = pinataResponseText
        }

        if (!pinataResponse.ok) {
          const uploadUrlForLog = new URL(uploadUrl)
          console.error('Pinata upload rejected', {
            status: pinataResponse.status,
            statusText: pinataResponse.statusText,
            response: pinataBody,
            file: { name: file.name, size: file.size, type: file.type || '(application/octet-stream fallback)' },
            request: { method: 'POST', multipartFields: ['network', 'file', 'name', 'keyvalues'] },
            uploadEndpoint: `${uploadUrlForLog.origin}${uploadUrlForLog.pathname}`,
          })
          const detail = typeof pinataBody === 'string'
            ? pinataBody
            : pinataBody && typeof pinataBody === 'object'
              ? JSON.stringify(pinataBody)
              : ''
          throw new Error(
            detail
              ? `Pinata upload failed (HTTP ${pinataResponse.status}): ${detail}`
              : `Pinata upload failed (HTTP ${pinataResponse.status}). Check the browser console for diagnostics.`
          )
        }

        const data =
          pinataBody &&
          typeof pinataBody === 'object' &&
          'data' in pinataBody &&
          pinataBody.data &&
          typeof pinataBody.data === 'object'
            ? pinataBody.data as {
                cid?: unknown
                id?: unknown
                size?: unknown
              }
            : undefined

        if (
          typeof data?.cid !== 'string' ||
          !data.cid ||
          typeof data.id !== 'string' ||
          !data.id
        ) {
          throw new Error(
            'Pinata completed the upload but did not return the required file ID and content ID.'
          )
        }

        const receipt: UploadReceipt = {
          cid: data.cid,
          fileId: data.id,
          ...(typeof data.size === 'number'
            ? { actualSize: data.size }
            : {}),
        }

        // Save the receipt before notifying the backend.
        await saveUploadReceipt(uploadId, receipt)

        await completeUpload(uploadId, receipt)

        await Promise.allSettled([
          removeUploadFile(uploadId),
          removeUploadReceipt(uploadId),
        ])

        setCid(receipt.cid)
        setPhase('success')
        setMessage(
          'Your model file is stored on IPFS and the upload session has been updated.'
        )
      } catch (error) {
        setPhase('error')
        setMessage(
          error instanceof Error
            ? error.message
            : 'The model upload failed. Please try again.'
        )
      }
    }

    void upload()
  }, [uploadId])

  return (
    <main className={styles.container}>
      <section className={styles.card} aria-live="polite">
        {(phase === 'loading' || phase === 'uploading') && (
          <TriangleSpinner />
        )}

        {phase === 'success' && (
          <div className={styles.successMark} aria-hidden="true">
            ✓
          </div>
        )}

        {phase === 'error' && (
          <div className={styles.errorMark} aria-hidden="true">
            !
          </div>
        )}

        <p className={styles.eyebrow}>MODEL UPLOAD</p>

        <h1>
          {phase === 'success'
            ? 'Upload complete'
            : phase === 'error'
              ? 'Upload needs attention'
              : 'Uploading your model'}
        </h1>

        <p className={styles.message}>{message}</p>

        {cid && (
          <p className={styles.cid}>
            <span>IPFS CID</span>
            <code>{cid}</code>
          </p>
        )}

        {phase === 'error' && (
          <>
            {uploadId && (
              <button
                className={styles.backLink}
                type="button"
                onClick={() => window.location.reload()}
              >
                Retry upload
              </button>
            )}

            <a className={styles.backLink} href="/upload">
              Back to upload form
            </a>
          </>
        )}
      </section>
    </main>
  )
}

export default function FilesToPinata() {
  return (
    <Suspense
      fallback={
        <main className={styles.container}>
          <section className={styles.card} aria-live="polite">
            <TriangleSpinner />
            <p className={styles.eyebrow}>MODEL UPLOAD</p>
            <h1>Preparing your model upload</h1>
            <p className={styles.message}>
              Preparing your secure upload…
            </p>
          </section>
        </main>
      }
    >
      <UploadContent />
    </Suspense>
  )
}
