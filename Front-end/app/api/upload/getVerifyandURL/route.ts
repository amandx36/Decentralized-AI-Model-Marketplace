import { NextResponse } from 'next/server'
import { serverFetch } from '@/lib/api'

export async function POST(request: Request) {
  let uploadId: unknown
  try {
    uploadId = (await request.json() as { uploadId?: unknown }).uploadId
  } catch {
    return NextResponse.json({ message: 'Request body must be valid JSON.' }, { status: 400 })
  }

  if (typeof uploadId !== 'string' || !uploadId.trim()) {
    return NextResponse.json({ message: 'uploadId is required.' }, { status: 400 })
  }

  try {
    const backendResponse = await serverFetch(
      `/api/v1/model-uploads/${encodeURIComponent(uploadId)}/upload-authorization`,
      { method: 'POST' },
    )
    return new Response(await backendResponse.text(), {
      status: backendResponse.status,
      headers: { 'Content-Type': backendResponse.headers.get('content-type') ?? 'application/json' },
    })
  } catch {
    return NextResponse.json({ message: 'Unable to reach the model upload service.' }, { status: 502 })
  }
}
