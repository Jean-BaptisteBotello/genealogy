// src/components/cosmos/CosmosNode.tsx
import { forwardRef, useCallback, useRef } from 'react'

export interface CosmosNodeProps {
  id: string
  cx: number
  cy: number
  orbit: number
  prenom: string
  deceased: boolean
  mode: 'mono' | 'branch'
  branchColor: string
  onClick: (id: string) => void
  onHover: (id: string | null) => void
}

export interface CosmosNodeRenderProps extends CosmosNodeProps {
  shadowDx: number
  shadowDy: number
  transform?: string
}

export const CosmosNode = forwardRef<SVGGElement, CosmosNodeRenderProps>(
  function CosmosNode({ id, prenom, deceased, mode, branchColor, shadowDx, shadowDy, transform, onClick, onHover }, ref) {
    const cleanupRef = useRef<(() => void) | null>(null)

    const setRef = useCallback((node: SVGGElement | null) => {
      // Forward to external ref
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as React.MutableRefObject<SVGGElement | null>).current = node

      // Clean up previous native listeners
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }

      if (node) {
        const handleMouseEnter = () => onHover(id)
        const handleMouseLeave = () => onHover(null)
        const handleClick = () => onClick(id)
        node.addEventListener('mouseenter', handleMouseEnter)
        node.addEventListener('mouseleave', handleMouseLeave)
        node.addEventListener('click', handleClick)
        cleanupRef.current = () => {
          node.removeEventListener('mouseenter', handleMouseEnter)
          node.removeEventListener('mouseleave', handleMouseLeave)
          node.removeEventListener('click', handleClick)
        }
      }
    }, [id, onHover, onClick, ref])

    const fill = mode === 'branch'
      ? (deceased ? 'none' : branchColor)
      : (deceased ? 'none' : '#7c3aed')

    const stroke = deceased
      ? (mode === 'branch' ? branchColor : '#b0aaa4')
      : 'none'

    const strokeOpacity = deceased ? (mode === 'branch' ? 0.7 : 1) : undefined
    const strokeDasharray = deceased ? '2 2' : undefined

    return (
      <g
        ref={setRef}
        transform={transform}
        style={{ cursor: 'pointer' }}
      >
        <line
          className="shadow-line"
          x1={0} y1={0}
          x2={shadowDx} y2={shadowDy}
          stroke="rgba(124,58,237,0.2)"
          strokeWidth={deceased ? 1 : 1.2}
          strokeLinecap="round"
        />
        <circle
          r={5}
          fill={fill}
          stroke={stroke}
          strokeWidth={deceased ? 1 : undefined}
          strokeOpacity={strokeOpacity}
          strokeDasharray={strokeDasharray}
          filter={!deceased ? 'url(#nodeGlow)' : undefined}
        />
        <text
          textAnchor="middle"
          dy={-9}
          fill={mode === 'branch'
            ? (deceased ? '#b0aaa4' : branchColor)
            : (deceased ? '#b0aaa4' : '#3a3a3a')}
          fontSize={9}
          fontFamily="SF Mono, Fira Code, monospace"
          letterSpacing="0.03em"
        >
          {prenom}
        </text>
      </g>
    )
  }
)
