import { NextResponse } from 'next/server'
import { serverFetch } from '@/lib/api'

interface ModelUploadRequest {
  modelName: string
  description: string
  category: string
  price: number
  fileName: string
  fileSize: number
  contentType: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export async function POST(request: Request) {
  let input: Partial<ModelUploadRequest>

  try {
    input = (await request.json()) as Partial<ModelUploadRequest>
  } catch {
    return NextResponse.json({ message: 'Request body must be valid JSON.' }, { status: 400 })
  }

  if (
    !isNonEmptyString(input.modelName) ||
    !isNonEmptyString(input.description) ||
    !isNonEmptyString(input.category) ||
    typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price < 0 ||
    !isNonEmptyString(input.fileName) ||
    typeof input.fileSize !== 'number' || !Number.isFinite(input.fileSize) || input.fileSize <= 0 ||
    !isNonEmptyString(input.contentType)
  ) {
    return NextResponse.json({ message: 'Model details or file information are invalid.' }, { status: 400 })
  }

  try {
    const backendResponse = await serverFetch('/api/v1/model-uploads', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    const responseBody = await backendResponse.text()

    return new Response(responseBody, {
      status: backendResponse.status,
      headers: {
        'Content-Type': backendResponse.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch {
    return NextResponse.json(
      { message: 'Unable to reach the model upload service.' },
      { status: 502 },
    )
  }
}