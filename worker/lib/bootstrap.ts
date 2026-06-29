import type { Env } from '../types'
import { hashPassword } from './crypto'
import { getSettingValues, setSettingValue } from './db'

const ADMIN_USERNAME_KEY = 'admin_username'
const ADMIN_PASSWORD_KEY = 'admin_password'

export interface AdminCredentials {
  username: string
  passwordHash: string
}

export async function ensureAdminBootstrap(env: Env): Promise<AdminCredentials> {
  const credentials = await getSettingValues<string>(env.DB, [ADMIN_USERNAME_KEY, ADMIN_PASSWORD_KEY])
  const adminUsername = credentials.get(ADMIN_USERNAME_KEY) ?? null
  const adminPassword = credentials.get(ADMIN_PASSWORD_KEY) ?? null

  if (adminUsername && adminPassword) {
    return {
      username: adminUsername,
      passwordHash: adminPassword,
    }
  }

  const initUsername = adminUsername ?? env.INIT_ADMIN_USER?.trim()
  const initPassword = env.INIT_ADMIN_PASSWORD?.trim()

  if (!initUsername || !initPassword) {
    throw new Error('Missing INIT_ADMIN_USER or INIT_ADMIN_PASSWORD for admin bootstrap')
  }

  let nextPasswordHash = adminPassword
  const writes: Promise<unknown>[] = []

  if (!adminUsername) {
    writes.push(setSettingValue(env.DB, ADMIN_USERNAME_KEY, initUsername))
  }

  if (!adminPassword) {
    nextPasswordHash = await hashPassword(initPassword)
    writes.push(setSettingValue(env.DB, ADMIN_PASSWORD_KEY, nextPasswordHash))
  }

  await Promise.all(writes)

  if (!nextPasswordHash) {
    throw new Error('Missing admin password hash after bootstrap')
  }

  return {
    username: initUsername,
    passwordHash: nextPasswordHash,
  }
}
