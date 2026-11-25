import { createContext, useContext } from 'react'
import type { SceneChapterId } from '../data/types'

export type ViewMode = 'classic' | 'immersive'

export interface ViewModeContextValue {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
  activeSceneChapter: SceneChapterId | null
  registerSceneSlot: (chapterId: SceneChapterId, el: HTMLElement, hasAudio?: boolean) => () => void
  requestRecomputeSlots: () => void
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
  sceneHasAudio: boolean
}

export const ViewModeContext = createContext<ViewModeContextValue | null>(null)

export function useViewMode(): ViewModeContextValue {
  const ctx = useContext(ViewModeContext)
  if (!ctx) {
    throw new Error('useViewMode must be used inside ViewModeProvider')
  }
  return ctx
}
