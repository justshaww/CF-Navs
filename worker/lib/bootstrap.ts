import type { Env } from '../types'
import { hashPassword } from './crypto'
import { getSettingValue, setSettingValue } from './db'

const ADMIN_USERNAME_KEY = 'admin_username'
const ADMIN_PASSWORD_KEY = 'admin_password'

export async function ensureAdminBootstrap(env: Env): Promise<void> {
  const [adminUsername, adminPassword] = await Promise.all([
    getSettingValue<string>(env.DB, ADMIN_USERNAME_KEY),
    getSettingValue<string>(env.DB, ADMIN_PASSWORD_KEY),
  ])

  if (adminUsername && adminPassword) return

  const initUsername = adminUsername ?? env.INIT_ADMIN_USER?.trim()
  const initPassword = env.INIT_ADMIN_PASSWORD?.trim()

  if (!initUsername || !initPassword) {
    throw new Error('Missing INIT_ADMIN_USER or INIT_ADMIN_PASSWORD for admin bootstrap')
  }

  const writes: Promise<unknown>[] = []

  if (!adminUsername) {
    writes.push(setSettingValue(env.DB, ADMIN_USERNAME_KEY, initUsername))
  }

  if (!adminPassword) {
    writes.push(
      hashPassword(initPassword).then((hashedPassword) =>
        setSettingValue(env.DB, ADMIN_PASSWORD_KEY, hashedPassword),
      ),
    )
  }

  await Promise.all(writes)
}
