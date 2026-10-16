const DATABASE_NAME = 'aimarketplace-model-uploads'
const STORE_NAME = 'files'

export interface PinataUploadReceipt {
  cid: string
  fileId: string
  actualSize?: number
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local upload storage.'))
  })
}

export async function saveUploadFile(uploadId: string, file: File): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(file, uploadId)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save the selected file.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Could not save the selected file.'))
  })
  database.close()
}

export async function getUploadFile(uploadId: string): Promise<File | undefined> {
  const database = await openDatabase()
  const file = await new Promise<File | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(uploadId)
    request.onsuccess = () => resolve(request.result as File | undefined)
    request.onerror = () => reject(request.error ?? new Error('Could not read the selected file.'))
  })
  database.close()
  return file
}

export async function removeUploadFile(uploadId: string): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(uploadId)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not clear local upload storage.'))
  })
  database.close()
}

export async function saveUploadReceipt(uploadId: string, receipt: PinataUploadReceipt): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(receipt, `receipt:${uploadId}`)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save the upload receipt.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Could not save the upload receipt.'))
  })
  database.close()
}

export async function getUploadReceipt(uploadId: string): Promise<PinataUploadReceipt | undefined> {
  const database = await openDatabase()
  const receipt = await new Promise<PinataUploadReceipt | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(`receipt:${uploadId}`)
    request.onsuccess = () => resolve(request.result as PinataUploadReceipt | undefined)
    request.onerror = () => reject(request.error ?? new Error('Could not read the upload receipt.'))
  })
  database.close()
  return receipt
}

export async function removeUploadReceipt(uploadId: string): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(`receipt:${uploadId}`)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not clear the upload receipt.'))
  })
  database.close()
}
