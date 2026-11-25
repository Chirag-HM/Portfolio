import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

function readConfigMeta() {
  const configPath = path.resolve(process.cwd(), 'src/data/config.ts')
  const projectsPath = path.resolve(process.cwd(), 'src/data/projects.ts')

  const configSrc = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : ''
  const projectsSrc = fs.existsSync(projectsPath) ? fs.readFileSync(projectsPath, 'utf8') : ''

  const matchField = (key: string) => {
    const m = configSrc.match(new RegExp(`${key}:\\s*['"\`]([^'"\`]*)['"\`]`))
    return m ? m[1] : ''
  }

  const siteUrlRaw =
    configSrc.match(/export\s+const\s+SITE_URL\s*=\s*['"`]([^'"`]+)['"`]/)?.[1] ?? ''
  const trimmed = siteUrlRaw.replace(/\/+$/, '').trim()
  const siteUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : trimmed
      ? `https://${trimmed}`
      : ''

  const slugs = Array.from(projectsSrc.matchAll(/slug:\s*['"`]([^'"`]+)['"`]/g)).map((m) => m[1])

  return {
    siteUrl,
    name: matchField('name') || 'Chirag H M',
    email: matchField('email'),
    githubUrl: matchField('githubUrl'),
    linkedInUrl: matchField('linkedInUrl'),
    aboutParagraph:
      matchField('aboutParagraph') ||
      'Engineering student at VTU building AI-integrated apps, IoT systems, and automation tools.',
    slugs,
  }
}

function scanPublicFiles(publicDir: string): string[] {
  if (!fs.existsSync(publicDir)) return []
  const results: string[] = []
  const walk = (dir: string, prefix: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      const rel = `${prefix}/${entry.name}`
      if (entry.isDirectory()) {
        walk(full, rel)
      } else {
        results.push(rel)
      }
    }
  }
  walk(publicDir, '')
  return results
}

function syncPublicAssetsFile(): void {
  const publicDir = path.resolve(process.cwd(), 'public')
  const assetsFile = path.resolve(process.cwd(), 'src/lib/publicAssets.ts')
  const files = scanPublicFiles(publicDir)
  const content = `/**
 * Generated list of assets present in public/.
 * Keeps optional assets (resume, signature, portrait) hiding cleanly when absent.
 */
export const publicAssets: Set<string> = new Set(${JSON.stringify(files, null, 2)})

export function hasPublicAsset(path: string): boolean {
  return publicAssets.has(path)
}
`
  if (!fs.existsSync(assetsFile) || fs.readFileSync(assetsFile, 'utf8') !== content) {
    fs.writeFileSync(assetsFile, content)
  }
}

/**
 * Reads SITE_URL and metadata from src/data/config.ts + src/data/projects.ts so updating
 * SITE_URL automatically updates index.html meta/canonical/JSON-LD, sitemap.xml, and robots.txt.
 */
function seoSyncPlugin(): Plugin {
  const buildSitemapXml = (siteUrl: string, slugs: string[]) => {
    const urls = [
      `  <url>\n    <loc>${siteUrl}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
      ...slugs.map(
        (slug) =>
          `  <url>\n    <loc>${siteUrl}/projects/${slug}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
      ),
    ]
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  }

  const buildRobotsTxt = (siteUrl: string) =>
    `User-agent: *\nAllow: /\nDisallow: /play\n\nSitemap: ${siteUrl}/sitemap.xml\n`

  return {
    name: 'seo-sync-plugin',
    configureServer() {
      syncPublicAssetsFile()
    },
    transformIndexHtml(html) {
      const meta = readConfigMeta()
      const sameAs = [meta.githubUrl, meta.linkedInUrl].filter(Boolean)
      const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: meta.name,
        jobTitle: 'Full-Stack & AI Developer',
        description: meta.aboutParagraph,
        url: meta.siteUrl,
      }
      if (sameAs.length > 0) jsonLd.sameAs = sameAs
      if (meta.email) jsonLd.email = `mailto:${meta.email}`

      const updated = html
        .replaceAll('%SITE_URL%', meta.siteUrl)
        .replace(
          '<!-- JSON-LD injected from src/data/config.ts during Vite build & updated per route -->',
          `<script id="person-jsonld" type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
        )

      return updated
    },
    buildStart() {
      syncPublicAssetsFile()
      const publicDir = path.resolve(process.cwd(), 'public')
      fs.mkdirSync(publicDir, { recursive: true })
      const meta = readConfigMeta()
      fs.writeFileSync(path.join(publicDir, 'robots.txt'), buildRobotsTxt(meta.siteUrl))
      fs.writeFileSync(
        path.join(publicDir, 'sitemap.xml'),
        buildSitemapXml(meta.siteUrl, meta.slugs)
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoSyncPlugin()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
            },
            {
              name: 'motion-vendor',
              test: /[\\/]node_modules[\\/](framer-motion|gsap|lenis)[\\/]/,
            },
            {
              name: 'three-core',
              test: /[\\/]node_modules[\\/]three[\\/]/,
            },
            {
              name: 'r3f-vendor',
              test: /[\\/]node_modules[\\/](@react-three[\\/]fiber|suspend-react|its-fine|react-reconciler)[\\/]/,
            },
            {
              name: 'drei-core',
              test: /[\\/]node_modules[\\/](@react-three[\\/]drei|three-stdlib|maath|detect-gpu|@use-gesture)[\\/]/,
            },
            {
              name: 'postprocessing-vendor',
              test: /[\\/]node_modules[\\/](@react-three[\\/]postprocessing|postprocessing|n8ao)[\\/]/,
            },
          ],
        },
      },
    },
  },
})
