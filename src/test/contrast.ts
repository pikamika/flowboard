import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

const vars = (block: string) => {
  const out: Record<string, string> = {}
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
    const hex = m[2].length === 4 ? '#' + [...m[2].slice(1)].map((c) => c + c).join('') : m[2]
    out[m[1]] = hex
  }
  return out
}

const rootBlock = css.match(/:root\s*\{([^}]*)\}/)![1]
const darkBlock = css.match(/prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([^}]*)\}/)![1]

export const lightTokens = vars(rootBlock)
export const darkTokens = { ...lightTokens, ...vars(darkBlock) }

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** WCAG contrast ratio between two #rrggbb colours. */
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
