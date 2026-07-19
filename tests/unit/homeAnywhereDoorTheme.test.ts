import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const homeSource = readFileSync(new URL('../../src/views/Home.svelte', import.meta.url), 'utf8')

describe('anywhere door homepage theme', () => {
  it('shows the destination prompt only for Shaw\'s anywhere door site', () => {
    expect(homeSource).toContain('isShawAnywhereDoorSite(pageTitle, currentHostname)')
    expect(homeSource).toContain('<p class="anywhere-door-prompt">准备去哪儿呢？</p>')
  })

  it('keeps the prompt away from narrow screens', () => {
    expect(homeSource).toMatch(/@media \(max-width: 720px\)[\s\S]*?\.anywhere-door-scene \{\s*display: none;/)
  })

  it('uses a clean-edged asset without filters in dark mode', () => {
    expect(homeSource).toContain("activeTheme === 'dark' ? '/doraemon-thinking-dark.png' : '/doraemon-thinking.png'")
    expect(homeSource).toMatch(/\[data-theme='dark'\]\) \.anywhere-door-art \{\s*opacity: 0\.9;\s*filter: none;/)
  })
})
