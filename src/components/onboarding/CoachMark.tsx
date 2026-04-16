import './coach-mark.css'

interface CoachMarkProps {
  step: number
  totalSteps: number
  title: string
  description: string
  ctaLabel: string
  onCtaClick: () => void
  onSkip: () => void
  position: 'top' | 'bottom' | 'left' | 'right'
  children?: React.ReactNode
}

export function CoachMark({
  step, totalSteps, title, description, ctaLabel,
  onCtaClick, onSkip, position, children,
}: CoachMarkProps) {
  return (
    <div className={`coach-mark coach-mark--arrow-${position}`}>
      <div className="coach-mark__badge">{step} / {totalSteps}</div>
      <div className="coach-mark__title">{title}</div>
      <div className="coach-mark__desc">{description}</div>
      {children}
      <div className="coach-mark__actions">
        <button type="button" className="coach-mark__cta" onClick={onCtaClick}>
          {ctaLabel}
        </button>
        <button type="button" className="coach-mark__skip" onClick={onSkip}>
          Passer le guide
        </button>
      </div>
    </div>
  )
}
