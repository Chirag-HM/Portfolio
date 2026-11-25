import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface SceneErrorBoundaryProps {
  children: ReactNode
  onError: (error: Error) => void
  fallback: ReactNode
}

interface SceneErrorBoundaryState {
  hasError: boolean
}

/**
 * Isolates WebGL / React Three Fiber failures per chapter so any shader compile error,
 * GPU crash, or context loss falls back seamlessly to that section's Classic UI.
 */
export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.warn('[SceneErrorBoundary] Falling back to Classic chapter:', error, info)
    }
    this.props.onError(error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
