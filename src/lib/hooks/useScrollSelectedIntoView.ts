import { useEffect } from 'react'

type Options = {
  behavior?: ScrollBehavior
  block?: ScrollLogicalPosition
  inline?: ScrollLogicalPosition
}

const DEFAULTS: Required<Options> = {
  behavior: 'smooth',
  block: 'center',
  inline: 'center',
}

export function useScrollSelectedIntoView(
  containerRef: React.RefObject<HTMLElement | null>,
  selectedId: string | null,
  options: Options = {}
) {
  useEffect(() => {
    if (!selectedId) return
    const container = containerRef.current
    if (!container) return
    const el = container.querySelector(`[data-person-id="${selectedId}"]`)
    if (!el || typeof (el as HTMLElement).scrollIntoView !== 'function') return
    const opts = { ...DEFAULTS, ...options }
    ;(el as HTMLElement).scrollIntoView(opts)
  }, [selectedId, containerRef, options.behavior, options.block, options.inline])
}
