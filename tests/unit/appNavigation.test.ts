import { describe, expect, it } from 'vitest'
import { canSeeHomeView, getHomeGateView } from '../../src/lib/appNavigation'

describe('app navigation helpers', () => {
  it('allows the home view for public mode or authenticated sessions', () => {
    expect(canSeeHomeView({ publicMode: true, authenticated: false })).toBe(true)
    expect(canSeeHomeView({ publicMode: false, authenticated: true })).toBe(true)
  })

  it('blocks the home view for private mode when logged out', () => {
    expect(canSeeHomeView({ publicMode: false, authenticated: false })).toBe(false)
  })

  it('keeps unknown public mode out of the visible home gate', () => {
    expect(canSeeHomeView({ publicMode: undefined, authenticated: false })).toBe(false)
  })

  it('routes private logged-out sessions to login and all other boot states to home', () => {
    expect(getHomeGateView({ publicMode: false, authenticated: false })).toBe('login')
    expect(getHomeGateView({ publicMode: false, authenticated: true })).toBe('home')
    expect(getHomeGateView({ publicMode: true, authenticated: false })).toBe('home')
    expect(getHomeGateView({ publicMode: undefined, authenticated: false })).toBe('home')
  })
})
