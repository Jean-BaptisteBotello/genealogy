import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnboarding } from '../useOnboarding'

const LS_KEY = 'genealogy_onboarding_step'

beforeEach(() => {
  localStorage.clear()
})

describe('useOnboarding', () => {
  it('starts at step 1 when localStorage empty and personCount is 0', () => {
    const { result } = renderHook(() => useOnboarding(0))
    expect(result.current.step).toBe(1)
    expect(result.current.isActive).toBe(true)
  })

  it('starts as done when personCount > 0 and no localStorage', () => {
    const { result } = renderHook(() => useOnboarding(3))
    expect(result.current.step).toBe('done')
    expect(result.current.isActive).toBe(false)
  })

  it('resumes from localStorage', () => {
    localStorage.setItem(LS_KEY, '3')
    const { result } = renderHook(() => useOnboarding(1))
    expect(result.current.step).toBe(3)
  })

  it('advance() moves 1 → 2', () => {
    const { result } = renderHook(() => useOnboarding(0))
    act(() => result.current.advance())
    expect(result.current.step).toBe(2)
    expect(localStorage.getItem(LS_KEY)).toBe('2')
  })

  it('advance() from 4 → done', () => {
    localStorage.setItem(LS_KEY, '4')
    const { result } = renderHook(() => useOnboarding(2))
    act(() => result.current.advance())
    expect(result.current.step).toBe('done')
    expect(result.current.isActive).toBe(false)
  })

  it('skip() sets skipped', () => {
    const { result } = renderHook(() => useOnboarding(0))
    act(() => result.current.skip())
    expect(result.current.step).toBe('skipped')
    expect(result.current.isActive).toBe(false)
  })

  it('auto-advances 1 → 2 when personCount goes from 0 to 1', () => {
    const { result, rerender } = renderHook(
      ({ count }) => useOnboarding(count),
      { initialProps: { count: 0 } }
    )
    expect(result.current.step).toBe(1)
    rerender({ count: 1 })
    expect(result.current.step).toBe(2)
  })

  it('auto-advances 3 → 4 when personCount goes from 1 to 2', () => {
    localStorage.setItem(LS_KEY, '3')
    const { result, rerender } = renderHook(
      ({ count }) => useOnboarding(count),
      { initialProps: { count: 1 } }
    )
    expect(result.current.step).toBe(3)
    rerender({ count: 2 })
    expect(result.current.step).toBe(4)
  })
})
