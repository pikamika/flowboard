import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { seo } from '../../config/seoPlugin'

// Regression tests for the SEO / GEO audit.
const root = (p: string) => resolve(process.cwd(), p)
const html = readFileSync(root('index.html'), 'utf8')
const doc = new DOMParser().parseFromString(html, 'text/html')
const meta = (sel: string) => doc.querySelector(sel)?.getAttribute('content') ?? ''

describe('index.html', () => {
  it('has a descriptive title of sensible length', () => {
    const title = doc.title
    expect(title).toMatch(/Flowboard/)
    expect(title.length).toBeGreaterThanOrEqual(30)
    expect(title.length).toBeLessThanOrEqual(65)
  })

  it('has a meta description that will not be truncated', () => {
    const d = meta('meta[name="description"]')
    expect(d.length).toBeGreaterThanOrEqual(70)
    expect(d.length).toBeLessThanOrEqual(160)
  })

  it('declares language, viewport, robots, theme colour and favicon', () => {
    expect(doc.documentElement.lang).toBe('en')
    expect(meta('meta[name="viewport"]')).toContain('width=device-width')
    expect(meta('meta[name="robots"]')).toContain('index')
    expect(meta('meta[name="theme-color"]')).toBeTruthy()
    const href = doc.querySelector('link[rel="icon"]')!.getAttribute('href')!
    expect(existsSync(root(`public${href}`))).toBe(true)
  })

  it('has Open Graph and Twitter tags', () => {
    expect(meta('meta[property="og:title"]')).toBeTruthy()
    expect(meta('meta[property="og:description"]')).toBeTruthy()
    expect(meta('meta[property="og:type"]')).toBe('website')
    expect(meta('meta[property="og:site_name"]')).toBe('Flowboard')
    expect(meta('meta[property="og:image:width"]')).toBe('1200')
    expect(meta('meta[property="og:image:height"]')).toBe('630')
    expect(meta('meta[property="og:image:alt"]')).toBeTruthy()
    expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image')
  })

  it('has valid WebApplication JSON-LD', () => {
    const json = JSON.parse(doc.querySelector('script[type="application/ld+json"]')!.textContent!)
    expect(json['@context']).toBe('https://schema.org')
    expect(json['@type']).toBe('WebApplication')
    expect(json.name).toBe('Flowboard')
    expect(json).not.toHaveProperty('aggregateRating')
  })

  it('ships crawlable static content with exactly one h1 for non-JS crawlers', () => {
    expect(doc.querySelectorAll('#root h1')).toHaveLength(1)
    expect(doc.querySelector('#root main')).not.toBeNull()
    expect(doc.querySelector('#root p')!.textContent).toMatch(/Backlog/)
  })
})

describe('public assets', () => {
  it('provides llms.txt describing the app', () => {
    const txt = readFileSync(root('public/llms.txt'), 'utf8')
    expect(txt).toMatch(/^# Flowboard/)
  })

  it('provides a 1200x630 PNG preview image', () => {
    const png = readFileSync(root('public/og-image.png'))
    expect(png.subarray(1, 4).toString()).toBe('PNG')
    expect(png.readUInt32BE(16)).toBe(1200)
    expect(png.readUInt32BE(20)).toBe(630)
  })
})

describe('seo build plugin', () => {
  type AnyFn = (...a: unknown[]) => unknown
  const run = (site: string, supabase = 'https://abc.supabase.co') => {
    const plugin = seo(site, supabase)
    const emitFile = vi.fn()
    ;(plugin.generateBundle as AnyFn).call({ emitFile }, {}, {})
    const { tags } = (plugin.transformIndexHtml as AnyFn)('<html></html>') as {
      tags: { tag: string; attrs: Record<string, string> }[]
    }
    const files = Object.fromEntries(emitFile.mock.calls.map(([f]) => [f.fileName, String(f.source)]))
    return { tags, files }
  }

  it('always emits robots.txt that allows crawling', () => {
    const { files } = run('')
    expect(files['robots.txt']).toContain('User-agent: *')
    expect(files['robots.txt']).toContain('Allow: /')
  })

  it('skips domain-dependent output when no site URL is configured', () => {
    const { tags, files } = run('')
    expect(files['sitemap.xml']).toBeUndefined()
    expect(files['robots.txt']).not.toContain('Sitemap:')
    expect(tags.some((t) => t.attrs.rel === 'canonical')).toBe(false)
    expect(tags.some((t) => t.attrs.property === 'og:image')).toBe(false)
  })

  it('emits sitemap, canonical, og:url and absolute image URLs when a site URL is set', () => {
    const { tags, files } = run('https://flowboard.test/')
    expect(files['sitemap.xml']).toContain('<loc>https://flowboard.test/</loc>')
    expect(files['robots.txt']).toContain('Sitemap: https://flowboard.test/sitemap.xml')
    const attr = (pred: (a: Record<string, string>) => boolean) => tags.find((t) => pred(t.attrs))!.attrs
    expect(attr((a) => a.rel === 'canonical').href).toBe('https://flowboard.test/')
    expect(attr((a) => a.property === 'og:url').content).toBe('https://flowboard.test/')
    expect(attr((a) => a.property === 'og:image').content).toBe('https://flowboard.test/og-image.png')
    expect(attr((a) => a.name === 'twitter:image').content).toBe('https://flowboard.test/og-image.png')
  })

  it('preconnects to the Supabase origin', () => {
    const { tags } = run('')
    expect(tags.find((t) => t.attrs.rel === 'preconnect')!.attrs.href).toBe('https://abc.supabase.co')
  })
})
