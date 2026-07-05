export const ICON_SUCCESS_CACHE = 'public, max-age=604800, s-maxage=2592000, immutable'
export const ICON_FAILURE_CACHE = 'no-store'
export const ICON_FALLBACK_CACHE = 'public, max-age=300, s-maxage=300'

export function errorIconResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      'Cache-Control': ICON_FAILURE_CACHE,
    },
  })
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function fallbackIconResponse(title: string, url: string): Response {
  let hostname = 'NAV'
  try {
    hostname = new URL(url).hostname.replace(/^www\./, '') || hostname
  } catch {
    hostname = 'NAV'
  }

  const text = escapeSvgText((title.trim() || hostname).slice(0, 4))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#111827"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#f9fafb" font-size="180" font-weight="700" font-family="Arial,Helvetica,sans-serif">${text}</text>
</svg>`

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': ICON_FALLBACK_CACHE,
      'X-Icon-Fallback': '1',
    },
  })
}

export function cacheResponse(context: unknown, request: Request, response: Response) {
  const executionCtx = (context as { executionCtx?: ExecutionContext }).executionCtx
  const edgeCache = (caches as unknown as { default: Cache }).default
  executionCtx?.waitUntil(edgeCache.put(request, response.clone()))
}

export async function getCachedIconResponse(request: Request): Promise<Response | undefined> {
  const edgeCache = (caches as unknown as { default: Cache }).default
  return (await edgeCache.match(request)) ?? undefined
}

export function cachedFallbackIconResponse(
  context: unknown,
  request: Request,
  title: string,
  url: string,
): Response {
  const response = fallbackIconResponse(title, url)
  cacheResponse(context, request, response)
  return response
}
