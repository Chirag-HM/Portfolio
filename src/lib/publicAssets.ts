/**
 * Generated list of assets present in public/.
 * Keeps optional assets (resume, signature, portrait) hiding cleanly when absent.
 */
export const publicAssets: Set<string> = new Set([
  "/apple-touch-icon.png",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/og-image.png",
  "/robots.txt",
  "/site.webmanifest",
  "/sitemap.xml"
])

export function hasPublicAsset(path: string): boolean {
  return publicAssets.has(path)
}
