import { hasPublicAsset } from './publicAssets'

export function isNonEmpty(value?: string): boolean {
  if (!value) return false
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed !== '#'
}

/**
 * Checks whether a local public/ asset path exists at build time or is a valid relative path,
 * preventing broken <img> requests or 404 console errors while optional assets are absent.
 */
export function hasLocalAsset(assetPath?: string): boolean {
  if (!isNonEmpty(assetPath)) return false
  const trimmed = assetPath!.trim()
  if (trimmed.startsWith('/')) {
    return hasPublicAsset(trimmed)
  }
  return false
}

export function filterAvailableLocalAssets(paths: string[]): string[] {
  return paths.filter((p) => hasLocalAsset(p))
}
