import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { SceneChapterId } from '../data/types'
import { ViewModeContext, type ViewMode } from './viewModeContext'

const STORAGE_KEY = 'portfolio:view-mode'

interface SlotEntry {
  el: HTMLElement
  hasAudio: boolean
}

function readStoredMode(): ViewMode {
  if (typeof window === 'undefined') return 'immersive'
  try {
    const params = new URLSearchParams(window.location.search)
    const queryMode = params.get('mode')
    if (queryMode === 'classic' || queryMode === 'immersive') {
      return queryMode
    }
  } catch {
    // ignore URL parsing errors
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'classic' || stored === 'immersive') return stored
  } catch {
    // ignore storage access restrictions
  }
  return 'immersive'
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => readStoredMode())
  const [activeSceneChapter, setActiveSceneChapter] = useState<SceneChapterId | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [sceneHasAudio, setSceneHasAudio] = useState(false)

  const slotsRef = useRef<Map<SceneChapterId, SlotEntry>>(new Map())
  const rafRef = useRef(0)

  const recomputeSlotsNow = useCallback(() => {
    if (viewMode === 'classic') {
      setActiveSceneChapter((prev) => (prev === null ? prev : null))
      setSceneHasAudio(false)
      return
    }

    const slots = slotsRef.current
    if (slots.size === 0) {
      setActiveSceneChapter((prev) => (prev === null ? prev : null))
      setSceneHasAudio(false)
      return
    }

    const vh = window.innerHeight || 900
    const vCenter = vh * 0.5
    let bestId: SceneChapterId | null = null
    let bestOverlap = 0
    let bestDist = Infinity
    let bestAudio = false

    // 1) Pick the eligible chapter covering the largest portion of the visible viewport
    for (const [chapterId, entry] of slots.entries()) {
      const rect = entry.el.getBoundingClientRect()
      const overlap = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0))
      if (overlap > 0) {
        const elCenter = (rect.top + rect.bottom) * 0.5
        const dist = Math.abs(elCenter - vCenter)
        if (overlap > bestOverlap || (overlap === bestOverlap && dist < bestDist)) {
          bestId = chapterId
          bestOverlap = overlap
          bestDist = dist
          bestAudio = entry.hasAudio
        }
      }
    }

    // 2) Pre-mount just before entering from Services (top of #stack within 12% of viewport bottom)
    //    Wait ensures initial load at y=0 (where #stack is >3x viewport below) never fetches 3D chunks.
    if (!bestId) {
      let nearestMarginDist = Infinity
      const preloadMargin = vh * 0.12
      for (const [chapterId, entry] of slots.entries()) {
        const rect = entry.el.getBoundingClientRect()
        const approachingFromBelow = rect.top > vh && rect.top <= vh + preloadMargin
        const justLeftAbove = rect.bottom < 0 && rect.bottom >= -preloadMargin
        if (approachingFromBelow || justLeftAbove) {
          const dist = approachingFromBelow ? rect.top - vh : -rect.bottom
          if (dist < nearestMarginDist) {
            nearestMarginDist = dist
            bestId = chapterId
            bestAudio = entry.hasAudio
          }
        }
      }
    }

    setActiveSceneChapter((prev) => (prev === bestId ? prev : bestId))
    setSceneHasAudio(bestAudio)
  }, [viewMode])

  const requestRecomputeSlots = useCallback(() => {
    if (typeof window === 'undefined') return
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(recomputeSlotsNow)
  }, [recomputeSlotsNow])

  useEffect(() => {
    window.addEventListener('scroll', requestRecomputeSlots, { passive: true })
    window.addEventListener('resize', requestRecomputeSlots, { passive: true })
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('scroll', requestRecomputeSlots)
      window.removeEventListener('resize', requestRecomputeSlots)
    }
  }, [requestRecomputeSlots])

  const registerSceneSlot = useCallback(
    (chapterId: SceneChapterId, el: HTMLElement, hasAudio = false) => {
      slotsRef.current.set(chapterId, { el, hasAudio })
      requestRecomputeSlots()

      return () => {
        const existing = slotsRef.current.get(chapterId)
        if (existing?.el === el) {
          slotsRef.current.delete(chapterId)
          requestRecomputeSlots()
        }
      }
    },
    [requestRecomputeSlots]
  )

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setViewModeState(mode)
      try {
        window.localStorage.setItem(STORAGE_KEY, mode)
      } catch {
        // ignore storage errors
      }
      if (mode === 'classic') {
        setActiveSceneChapter(null)
        setSceneHasAudio(false)
        setSoundEnabled(false)
      } else {
        requestRecomputeSlots()
      }
    },
    [requestRecomputeSlots]
  )

  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'classic' ? 'immersive' : 'classic')
  }, [viewMode, setViewMode])

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        setViewMode,
        toggleViewMode,
        activeSceneChapter,
        registerSceneSlot,
        requestRecomputeSlots,
        soundEnabled,
        setSoundEnabled,
        sceneHasAudio,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  )
}
