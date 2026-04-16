import { useState, useEffect, useCallback, useRef } from 'react'

export type OnboardingStep = 1 | 2 | 3 | 4 | 'done' | 'skipped'

const LS_KEY = 'genealogy_onboarding_step'
const STEP_ORDER: OnboardingStep[] = [1, 2, 3, 4, 'done']

function readStep(): OnboardingStep | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return null
  if (raw === 'done' || raw === 'skipped') return raw
  const n = Number(raw)
  if (n >= 1 && n <= 4) return n as 1 | 2 | 3 | 4
  return null
}

function writeStep(step: OnboardingStep) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, String(step))
}

export function useOnboarding(personCount: number) {
  const [step, setStep] = useState<OnboardingStep>(() => {
    const saved = readStep()
    if (saved) return saved
    return personCount > 0 ? 'done' : 1
  })

  const prevCount = useRef(personCount)

  useEffect(() => {
    const prev = prevCount.current
    prevCount.current = personCount
    if (step === 1 && prev === 0 && personCount >= 1) {
      setStep(2)
      writeStep(2)
    } else if (step === 3 && prev <= 1 && personCount >= 2) {
      setStep(4)
      writeStep(4)
    }
  }, [personCount, step])

  const advance = useCallback(() => {
    setStep(current => {
      const idx = STEP_ORDER.indexOf(current)
      const next = idx >= 0 && idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : 'done'
      writeStep(next)
      return next
    })
  }, [])

  const skip = useCallback(() => {
    setStep('skipped')
    writeStep('skipped')
  }, [])

  const isActive = step !== 'done' && step !== 'skipped'

  return { step, advance, skip, isActive }
}
