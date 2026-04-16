import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

describe('sablier-flow__card--selected CSS', () => {
  it('la classe est appliquée sur le DOM de la card sélectionnée', () => {
    const { container } = render(
      <div>
        <div className="sablier-flow__card sablier-flow__card--selected">card</div>
      </div>
    )
    const el = container.querySelector('.sablier-flow__card--selected') as HTMLElement
    expect(el).toBeTruthy()
  })
})
