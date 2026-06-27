import { Hono } from 'hono'
import type { Context } from 'hono'
import { getIconBlob } from '../lib/db'
import { fail } from '../lib/response'
import type { HonoEnv } from '../types'

type AppContext = Context<HonoEnv>

export const iconRoutes = new Hono<HonoEnv>()

iconRoutes.get('/icon/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return new Response('invalid id', { status: 400 })
  }

  try {
    const blob = await getIconBlob(c.env.DB, id)
    if (!blob) {
      // 没有缓存时返回一个透明 1x1 PNG
      return new Response(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Content-Length': '68',
            'Cache-Control': 'public, max-age=86400',
          },
        },
      )
    }

    // blob 是 data:image/...;base64,... 格式
    const commaIdx = blob.indexOf(',')
    if (commaIdx === -1) {
      return new Response('invalid blob', { status: 500 })
    }

    const mime = blob.slice(5, blob.indexOf(';'))
    const b64 = blob.slice(commaIdx + 1)

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': mime || 'image/png',
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new Response('server error', { status: 500 })
  }
})