const CACHE_NAME = 'cf-navs-bookmark-icons-v1'
const CACHE_ORIGIN = 'https://cf-navs.local'
const STORAGE_PREFIX = 'cf-navs.bookmark-icon.'

export type BookmarkIconCacheInput = {
  id: string | number
  icon: string
  iconSource?: string | null
}

function canUseCacheStorage(): boolean {
  return typeof window !== 'undefined' && 'caches' in window
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && 'localStorage' in window
}

function createHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(31, hash) + input.charCodeAt(i) | 0
  }
  return Math.abs(hash).toString(36)
}

function cacheRequest(cacheKey: string): Request {
  return new Request(`${CACHE_ORIGIN}/bookmark-icon/${encodeURIComponent(cacheKey)}`, {
    method: 'GET',
  })
}

function responseToObjectUrl(response: Response): Promise<string | null> {
  if (!response.ok) return Promise.resolve(null)

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().startsWith('image/')) return Promise.resolve(null)

  return response.blob().then((blob) => {
    if (blob.size === 0) return null
    return URL.createObjectURL(blob)
  })
}

export function createBookmarkIconCacheKey(input: BookmarkIconCacheInput): string {
  return `${input.id}-${createHash(`${input.iconSource ?? ''}:${input.icon}`)}`
}

export function isDataImage(value: string): boolean {
  return /^data:image\//i.test(value.trim())
}

export function revokeLocalIconUrl(value: string): void {
  if (value.startsWith('blob:')) {
    URL.revokeObjectURL(value)
  }
}

export function readCachedBookmarkIconDataUri(cacheKey: string): string | null {
  if (!canUseLocalStorage()) return null

  try {
    const value = localStorage.getItem(`${STORAGE_PREFIX}${cacheKey}`)
    return value && isDataImage(value) ? value : null
  } catch {
    return null
  }
}

export async function readCachedBookmarkIconUrl(cacheKey: string): Promise<string | null> {
  const dataUri = readCachedBookmarkIconDataUri(cacheKey)
  if (dataUri) return dataUri

  if (!canUseCacheStorage()) return null

  try {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(cacheRequest(cacheKey))
    return cached ? await responseToObjectUrl(cached) : null
  } catch {
    return null
  }
}

export async function writeBookmarkIconDataUri(cacheKey: string, dataUri: string): Promise<void> {
  if (!isDataImage(dataUri)) return

  if (canUseLocalStorage()) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${cacheKey}`, dataUri)
    } catch {
      // Browser storage can be disabled or full; Cache Storage remains a fallback.
    }
  }

  if (!canUseCacheStorage()) return

  try {
    const response = await fetch(dataUri)
    const cache = await caches.open(CACHE_NAME)
    await cache.put(cacheRequest(cacheKey), response)
  } catch {
    // Local cache is an optimization; rendering should not depend on it.
  }
}

export async function fetchAndCacheBookmarkIconUrl(cacheKey: string, url: string): Promise<string | null> {
  if (!url) return null

  try {
    const response = await fetch(url, {
      credentials: 'same-origin',
      cache: 'force-cache',
    })
    if (!response.ok) return null

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().startsWith('image/')) return null

    if (canUseCacheStorage()) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(cacheRequest(cacheKey), response.clone())
    }

    return await responseToObjectUrl(response)
  } catch {
    return null
  }
}
