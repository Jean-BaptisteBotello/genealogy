import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useScrollSelectedIntoView } from '../useScrollSelectedIntoView'

describe('useScrollSelectedIntoView', () => {
  it('appelle scrollIntoView sur l\'élément matchant le selector quand selectedId change', () => {
    const el = document.createElement('div')
    el.setAttribute('data-person-id', 'p1')
    el.scrollIntoView = vi.fn()
    document.body.appendChild(el)

    const containerRef = { current: document.body }
    renderHook(() =>
      useScrollSelectedIntoView(containerRef, 'p1', { behavior: 'smooth', block: 'center' })
    )
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center', inline: 'center' })
    document.body.removeChild(el)
  })

  it('ne fait rien si selectedId est null', () => {
    const el = document.createElement('div')
    el.setAttribute('data-person-id', 'p1')
    el.scrollIntoView = vi.fn()
    document.body.appendChild(el)

    const containerRef = { current: document.body }
    renderHook(() => useScrollSelectedIntoView(containerRef, null))
    expect(el.scrollIntoView).not.toHaveBeenCalled()
    document.body.removeChild(el)
  })

  it('ne fait rien si aucun élément ne matche', () => {
    const containerRef = { current: document.body }
    expect(() =>
      renderHook(() => useScrollSelectedIntoView(containerRef, 'unknown'))
    ).not.toThrow()
  })
})
