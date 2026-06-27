import type { MiddlewareHandler } from 'hono'
import { ErrCode } from '../../shared/types'
import { fail } from '../lib/response'
import type { Env, HonoEnv, SessionValue } from '../types'

const SESSION_PREFIX = 'sess:'

export function extractBearerToken(authorization: string | undefined | null): string | null {
  if (!authorization) return null
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  const token = match?.[1]?.trim()
  return token ? token : null
}

export function getSessionKey(token: string): string {
  return `${SESSION_PREFIX}${token}`
}

export async function validateSession(env: Env, token: string): Promise<SessionValue | null> {
  const raw = await env.SESSION.get(getSessionKey(token))
  if (!raw) return null

  let session: SessionValue
  try {
    session = JSON.parse(raw) as SessionValue
  } catch {
    await env.SESSION.delete(getSessionKey(token))
    return null
  }

  if (!session.username || typeof session.exp !== 'number' || session.exp <= Date.now()) {
    await env.SESSION.delete(getSessionKey(token))
    return null
  }

  return session
}

export const authRequired: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const token = extractBearerToken(c.req.header('Authorization'))
  if (!token) {
    return c.json(fail(ErrCode.UNAUTHORIZED, 'unauthorized'), 401)
  }

  const session = await validateSession(c.env, token)
  if (!session) {
    return c.json(fail(ErrCode.UNAUTHORIZED, 'unauthorized'), 401)
  }

  c.set('username', session.username)
  await next()
}
