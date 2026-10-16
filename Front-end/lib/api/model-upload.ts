export interface CreateModelUploadInput {
  modelName: string
  description: string
  category: string
  price: number
  fileName: string
  fileSize: number
  contentType: string
}

export interface CreateModelUploadResponse {
  uploadId: string
  status: string
  expiresAt: string
}

export async function createModelUpload(input: CreateModelUploadInput): Promise<CreateModelUploadResponse> {
  const response = await fetch('/api/upload/model-upload', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  })

  const responseText = await response.text()
  let responseBody: unknown

  try {
    responseBody = responseText ? JSON.parse(responseText) : undefined
  } catch {
    responseBody = undefined
  }

  if (!response.ok) {
    const message =
      responseBody && typeof responseBody === 'object' && 'message' in responseBody &&
      typeof responseBody.message === 'string'
        ? responseBody.message
        : `Failed to submit model details (HTTP ${response.status}).`
    throw new Error(message)
  }

  if (!responseBody || typeof responseBody !== 'object' || !('uploadId' in responseBody) ||
      typeof responseBody.uploadId !== 'string') {
    throw new Error('The upload service returned an invalid upload session.')
  }

  return responseBody as CreateModelUploadResponse
}
