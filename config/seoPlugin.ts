import type { Plugin } from 'vite'

// Injects absolute-URL SEO tags and emits robots.txt / sitemap.xml.
// Absolute URLs require the deployed origin, so these are only produced when VITE_SITE_URL is set.
export function seo(siteUrl: string, supabaseUrl: string): Plugin {
  const origin = siteUrl.replace(/\/+$/, '')
  return {
    name: 'flowboard-seo',
    transformIndexHtml(html) {
      const tags: { tag: string; attrs: Record<string, string>; injectTo: 'head' }[] = []
      if (origin) {
        tags.push(
          { tag: 'link', attrs: { rel: 'canonical', href: `${origin}/` }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:url', content: `${origin}/` }, injectTo: 'head' },
          // Social platforms need an absolute image URL.
          { tag: 'meta', attrs: { property: 'og:image', content: `${origin}/og-image.png` }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'twitter:image', content: `${origin}/og-image.png` }, injectTo: 'head' },
        )
      }
      if (supabaseUrl) {
        tags.push({
          tag: 'link',
          attrs: { rel: 'preconnect', href: new URL(supabaseUrl).origin, crossorigin: '' },
          injectTo: 'head',
        })
      }
      return { html, tags }
    },
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /']
      if (origin) robots.push('', `Sitemap: ${origin}/sitemap.xml`)
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots.join('\n') + '\n' })
      if (origin) {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${origin}/</loc></url>\n</urlset>\n`,
        })
      }
    },
  }
}
