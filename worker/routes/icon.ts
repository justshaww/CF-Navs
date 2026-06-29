import { Hono } from 'hono'
import type { Context } from 'hono'
import { getBookmarkIconData, getCategory, setIconBlob } from '../lib/db'
import {
  dataUriToResponse,
  fetchCacheableIcon,
  iconBytesToDataUri,
  iconBytesToResponse,
  isIconifyIconUrl,
} from '../lib/iconData'
import type { HonoEnv } from '../types'

type AppContext = Context<HonoEnv>

export const iconRoutes = new Hono<HonoEnv>()

const SUCCESS_CACHE = 'public, max-age=604800, s-maxage=2592000, immutable'
const FAILURE_CACHE = 'no-store'
const FALLBACK_CACHE = 'public, max-age=300, s-maxage=300'

function errorResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      'Cache-Control': FAILURE_CACHE,
    },
  })
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function fallbackIconResponse(title: string, url: string): Response {
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
      'Cache-Control': FALLBACK_CACHE,
      'X-Icon-Fallback': '1',
    },
  })
}

function cacheResponse(c: AppContext, request: Request, response: Response) {
  const executionCtx = (c as unknown as { executionCtx?: ExecutionContext }).executionCtx
  const edgeCache = (caches as unknown as { default: Cache }).default
  executionCtx?.waitUntil(edgeCache.put(request, response.clone()))
}

function cachedFallbackIconResponse(c: AppContext, request: Request, title: string, url: string): Response {
  const response = fallbackIconResponse(title, url)
  cacheResponse(c, request, response)
  return response
}

function normalizeIconifyParam(value: string): string {
  return decodeURIComponent(value).replace(/\.svg$/i, '').trim().toLowerCase()
}

function normalizeIconifyPair(prefix: string, name: string): string | null {
  const normalizedPrefix = prefix.trim().toLowerCase()
  const normalizedName = name.trim().toLowerCase().replace(/\.svg$/i, '')
  if (!/^[a-z0-9-]+$/.test(normalizedPrefix) || !/^[a-z0-9-]+$/.test(normalizedName)) {
    return null
  }

  return `https://api.iconify.design/${encodeURIComponent(normalizedPrefix)}/${encodeURIComponent(normalizedName)}.svg`
}

function iconifyUrlFromParams(prefixParam: string, nameParam: string): string | null {
  const prefix = normalizeIconifyParam(prefixParam)
  const name = normalizeIconifyParam(nameParam)
  return normalizeIconifyPair(prefix, name)
}

iconRoutes.get('/iconify/:prefix/:name', async (c) => {
  const iconUrl = iconifyUrlFromParams(c.req.param('prefix'), c.req.param('name'))
  if (!iconUrl) {
    return errorResponse('invalid iconify icon', 400)
  }

  try {
    const edgeCache = (caches as unknown as { default: Cache }).default
    const cached = await edgeCache.match(c.req.raw)
    if (cached) {
      return cached
    }

    const icon = await fetchCacheableIcon(iconUrl)
    if (!icon) {
      return cachedFallbackIconResponse(c, c.req.raw, c.req.param('name').replace(/\.svg$/i, ''), iconUrl)
    }

    const response = iconBytesToResponse(icon, SUCCESS_CACHE)
    cacheResponse(c, c.req.raw, response)
    return response
  } catch {
    return fallbackIconResponse(c.req.param('name').replace(/\.svg$/i, ''), iconUrl)
  }
})

iconRoutes.get('/icon/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse('invalid id', 400)
  }

  try {
    const edgeCache = (caches as unknown as { default: Cache }).default
    const cached = await edgeCache.match(c.req.raw)
    if (cached) {
      return cached
    }

    const bookmark = await getBookmarkIconData(c.env.DB, id)
    if (bookmark?.icon_blob) {
      const response = dataUriToResponse(bookmark.icon_blob, SUCCESS_CACHE)
      if (!response) {
        await setIconBlob(c.env.DB, id, null)
      } else {
        cacheResponse(c, c.req.raw, response)
        return response
      }
    }

    if (!bookmark?.icon) {
      return cachedFallbackIconResponse(c, c.req.raw, bookmark?.title ?? '', bookmark?.url ?? '')
    }

    if (bookmark.icon.startsWith('data:image/')) {
      await setIconBlob(c.env.DB, id, bookmark.icon)
      const response = dataUriToResponse(bookmark.icon, SUCCESS_CACHE)
      if (!response) return cachedFallbackIconResponse(c, c.req.raw, bookmark.title, bookmark.url)
      cacheResponse(c, c.req.raw, response)
      return response
    }

    if (!/^https?:\/\//i.test(bookmark.icon)) {
      return cachedFallbackIconResponse(c, c.req.raw, bookmark.title, bookmark.url)
    }

    const fetchedIcon = await fetchCacheableIcon(bookmark.icon)
    if (!fetchedIcon) {
      return cachedFallbackIconResponse(c, c.req.raw, bookmark.title, bookmark.url)
    }

    if (isIconifyIconUrl(bookmark.icon)) {
      const response = iconBytesToResponse(fetchedIcon, SUCCESS_CACHE)
      cacheResponse(c, c.req.raw, response)
      return response
    }

    await setIconBlob(c.env.DB, id, iconBytesToDataUri(fetchedIcon))
    const response = iconBytesToResponse(fetchedIcon, SUCCESS_CACHE)
    cacheResponse(c, c.req.raw, response)
    return response
  } catch {
    return fallbackIconResponse('', '')
  }
})

iconRoutes.get('/category-icon/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse('invalid id', 400)
  }

  try {
    const edgeCache = (caches as unknown as { default: Cache }).default
    const cached = await edgeCache.match(c.req.raw)
    if (cached) {
      return cached
    }

    const category = await getCategory(c.env.DB, id)
    if (!category?.icon) {
      return cachedFallbackIconResponse(c, c.req.raw, category?.title ?? '', '')
    }

    if (category.icon.startsWith('data:image/')) {
      const response = dataUriToResponse(category.icon, SUCCESS_CACHE)
      if (!response) return cachedFallbackIconResponse(c, c.req.raw, category.title, '')
      cacheResponse(c, c.req.raw, response)
      return response
    }

    if (!/^https?:\/\//i.test(category.icon)) {
      return cachedFallbackIconResponse(c, c.req.raw, category.title, '')
    }

    const fetchedIcon = await fetchCacheableIcon(category.icon)
    if (!fetchedIcon) {
      return cachedFallbackIconResponse(c, c.req.raw, category.title, category.icon)
    }

    const response = iconBytesToResponse(fetchedIcon, SUCCESS_CACHE)
    cacheResponse(c, c.req.raw, response)
    return response
  } catch {
    return fallbackIconResponse('', '')
  }
})
