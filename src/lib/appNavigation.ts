export type AppView = 'home' | 'admin' | 'login'

type HomeAccessInput = {
  publicMode: boolean | null | undefined
  authenticated: boolean
}

export function canSeeHomeView(input: HomeAccessInput): boolean {
  return Boolean(input.publicMode || input.authenticated)
}

export function getHomeGateView(input: HomeAccessInput): Extract<AppView, 'home' | 'login'> {
  return input.publicMode === false && !input.authenticated ? 'login' : 'home'
}
