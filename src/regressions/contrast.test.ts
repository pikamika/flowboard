import { describe, expect, it } from 'vitest'
import { contrast, css, darkTokens, lightTokens } from '../test/contrast'

// Locks in the colour-contrast fixes from the accessibility audit (WCAG 1.4.3 text, 1.4.11 UI).
const textPairs: [string, string][] = [
  ['muted', 'surface'],
  ['muted', 'card'],
  ['muted', 'bg'],
  ['text', 'card'],
  ['text', 'surface'],
  ['accent', 'card'], // links and the "Add" option
  ['text', 'bg'],
  ['danger', 'card'],
  ['danger', 'bg'],
  ['on-accent', 'accent'], // primary buttons
]
const uiPairs: [string, string][] = [
  ['field-border', 'card'],
  ['field-border', 'bg'],
  ['focus', 'card'],
  ['focus', 'surface'],
]

describe.each([
  ['light', lightTokens],
  ['dark', darkTokens],
])('%s theme contrast', (_name, t) => {
  it.each(textPairs)('text %s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5)
  })

  it.each(uiPairs)('UI component %s against %s is at least 3:1', (fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(3)
  })
})

describe('priority badges', () => {
  it.each(['high', 'medium', 'low'])('priority-%s text is at least 4.5:1', (level) => {
    const rule = css.match(new RegExp(`\\.priority-${level}\\s*\\{([^}]*)\\}`))![1]
    const bg = rule.match(/background:\s*(#[0-9a-f]{6})/i)![1]
    const fg = rule.match(/color:\s*(#[0-9a-f]{6})/i)![1]
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('stylesheet accessibility rules', () => {
  it('defines a visible focus style', () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px/)
  })
  it('has a screen-reader-only utility', () => {
    expect(css).toMatch(/\.sr-only\s*\{/)
  })
  it('respects reduced motion', () => {
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/)
  })
  it('stacks columns on small screens', () => {
    expect(css).toMatch(/@media \(max-width: 720px\)[\s\S]*grid-template-columns:\s*1fr/)
  })
  it('sizes text in rem, not px', () => {
    expect(css).not.toMatch(/font-size:\s*\d+px/)
  })
})
