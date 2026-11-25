/// <reference types="vite/client" />

declare module 'virtual:public-assets' {
  export const publicAssets: ReadonlySet<string>
  export function hasPublicAsset(path: string): boolean
}
