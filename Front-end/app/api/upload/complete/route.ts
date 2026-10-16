import { NextResponse } from 'next/server'
import { serverFetch } from '@/lib/api'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Request body must be valid JSON.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || !('uploadId' in body) || typeof body.uploadId !== 'string' || !body.uploadId) {
    return NextResponse.json({ message: 'uploadId is required.' }, { status: 400 })
  }
  const { uploadId, ...completion } = body
  try {
    const backendResponse = await serverFetch(
      `/api/v1/model-uploads/${encodeURIComponent(uploadId)}/complete`,
      { method: 'POST', body: JSON.stringify(completion) },
    )
    return new Response(await backendResponse.text(), {
      status: backendResponse.status,
      headers: { 'Content-Type': backendResponse.headers.get('content-type') ?? 'application/json' },
    })
  } catch {
    return NextResponse.json({ message: 'Unable to reach the model upload service.' }, { status: 502 })
  }
}
