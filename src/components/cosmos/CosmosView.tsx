'use client'

import { useEffect, useRef, useState, useMemo, useCallback, createRef } from 'react'
import { useTree } from '@/lib/context/tree-context'
import { computeCosmosLayout, ORBIT_RADII } from './cosmosLayout'
import { CosmosNode } from './CosmosNode'
import { CosmosTooltip } from './CosmosTooltip'
import type { RelationshipType } from '@/lib/types/database'

const ORBIT_SPEEDS: Record<number, number> = {
  1: 0.16,
  2: 0.12,
  3: 0.09,
  4: 0.07,
  5: 0.05,
}

const STROKE_ALPHAS: Record<number, number> = {
  0: 0,
  1: 0.30,
  2: 0.22,
  3: 0.15,
  4: 0.10,
  5: 0.07,
}

const RELATION_LABEL: Record<RelationshipType, string> = {
  PARENT_CHILD: 'Parent / Enfant',
  UNION: 'Union',
  ADOPTION: 'Adoption',
  SIBLING: 'Frère / Sœur',
  HALF_SIBLING: 'Demi-frère / Demi-sœur',
  STEP: 'Beau-parent / Bel-enfant',
}

const BG_COLOR = '#f8f8f6'

const LS_KEY = 'cosmos_branch_colors'

function drawGrain(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width, height } = canvas
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.floor(Math.random() * 256)
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
    data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
}

export function CosmosView() {
  const {
    persons,
    relationships,
    filteredRelationships,
    branches,
    personBranches,
    selectedPersonId,
    selectPerson,
    openAddPerson,
  } = useTree()

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [branchMode, setBranchMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LS_KEY)
      return stored === 'true'
    }
    return false
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const cxRef = useRef<number>(0)
  const cyRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const tRef = useRef<number>(0)

  // Auto-select first person when none is selected
  useEffect(() => {
    if (persons.length > 0 && !selectedPersonId) {
      selectPerson(persons[0].id)
    }
  }, [persons, selectedPersonId, selectPerson])

  // Draw grain canvas once
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const { offsetWidth: w, offsetHeight: h } = container
    canvas.width = w || 800
    canvas.height = h || 600
    drawGrain(canvas)
  }, [])

  // ResizeObserver to update cxRef/cyRef
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const update = () => {
      cxRef.current = container.offsetWidth / 2
      cyRef.current = container.offsetHeight / 2
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Build branch color map
  const branchColorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const pb of personBranches) {
      const branch = branches.find(b => b.id === pb.branch_id)
      if (branch) map.set(pb.person_id, branch.couleur)
    }
    return map
  }, [branches, personBranches])

  // Role map: personId → role label string
  const roleMap = useMemo(() => {
    const map = new Map<string, string>()
    const centerId = selectedPersonId ?? (persons.length > 0 ? persons[0].id : null)
    if (!centerId) return map
    for (const rel of filteredRelationships) {
      let neighborId: string | null = null
      if (rel.person_a_id === centerId) neighborId = rel.person_b_id
      else if (rel.person_b_id === centerId) neighborId = rel.person_a_id
      if (!neighborId) continue
      const meta = rel.metadata as { role?: unknown }
      const role = typeof meta?.role === 'string' ? meta.role : RELATION_LABEL[rel.type] ?? rel.type
      if (!map.has(neighborId)) map.set(neighborId, role)
    }
    return map
  }, [filteredRelationships, selectedPersonId, persons])

  const centerId = selectedPersonId ?? (persons.length > 0 ? persons[0].id : null)
  const personIds = persons.map(p => p.id)
  const { nodes, orphans } = useMemo(() => {
    if (!centerId || persons.length === 0) return { nodes: [], orphans: [] }
    return computeCosmosLayout(personIds, filteredRelationships, centerId)
  }, [personIds, filteredRelationships, centerId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Non-center nodes only
  const nonCenterNodes = useMemo(
    () => nodes.filter(n => n.id !== centerId),
    [nodes, centerId]
  )

  // Create stable refs for each non-center node
  const nodeRefs = useMemo(() => {
    const map = new Map<string, React.RefObject<SVGGElement | null>>()
    for (const n of nonCenterNodes) {
      map.set(n.id, createRef<SVGGElement | null>())
    }
    return map
  }, [nonCenterNodes])

  // rAF animation loop
  useEffect(() => {
    if (persons.length === 0 || !centerId) return

    const loop = (timestamp: number) => {
      tRef.current = timestamp
      const cx = cxRef.current
      const cy = cyRef.current

      for (const node of nonCenterNodes) {
        const ref = nodeRefs.get(node.id)
        if (!ref?.current) continue
        const speed = ORBIT_SPEEDS[node.orbit] ?? 0.05
        const angle = node.angle + (timestamp * speed * 0.001)
        const radius = ORBIT_RADII[node.orbit] ?? ORBIT_RADII[5]
        const nx = cx + Math.cos(angle) * radius
        const ny = cy + Math.sin(angle) * radius
        ref.current.setAttribute('transform', `translate(${nx},${ny})`)

        // Update shadow line direction toward center
        const dx = cx - nx
        const dy = cy - ny
        const dist = Math.sqrt(dx * dx + dy * dy)
        const shadowLen = 8
        const sdx = dist > 0 ? (dx / dist) * shadowLen : 0
        const sdy = dist > 0 ? (dy / dist) * shadowLen : 0
        const line = ref.current.querySelector('.shadow-line')
        if (line) {
          line.setAttribute('x2', String(sdx))
          line.setAttribute('y2', String(sdy))
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [nonCenterNodes, nodeRefs, centerId, persons.length])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }, [])

  const handleToggleBranch = useCallback(() => {
    setBranchMode(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem(LS_KEY, String(next))
      }
      return next
    })
  }, [])

  // Empty state
  if (persons.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 16,
          background: BG_COLOR,
        }}
      >
        <div style={{ fontSize: 18, color: '#3a3a3a' }}>Votre arbre vous attend</div>
        <button
          onClick={openAddPerson}
          style={{
            padding: '8px 16px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          + Ajouter une personne
        </button>
      </div>
    )
  }

  const centerPerson = centerId ? persons.find(p => p.id === centerId) : null
  const hoveredPerson = hoveredId ? persons.find(p => p.id === hoveredId) ?? null : null

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: BG_COLOR,
        overflow: 'hidden',
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Grain canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          mixBlendMode: 'overlay',
          opacity: 0.10,
          pointerEvents: 'none',
        }}
      />

      {/* Branch toggle */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        <button
          data-testid="branch-toggle"
          onClick={handleToggleBranch}
          style={{
            padding: '4px 14px',
            background: branchMode ? '#7c3aed' : '#ffffff',
            color: branchMode ? 'white' : '#7c3aed',
            border: '1px solid #e5e2dd',
            borderRadius: 20,
            cursor: 'pointer',
            fontSize: 12,
            backdropFilter: 'blur(8px)',
          }}
        >
          Couleurs de branches
        </button>
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <defs>
          <radialGradient id="cosmosGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(124,58,237,0.08)" />
            <stop offset="100%" stopColor="rgba(124,58,237,0)" />
          </radialGradient>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glow disk */}
        <circle
          cx="50%"
          cy="50%"
          r={200}
          fill="url(#cosmosGlow)"
        />

        {/* Orbit rings */}
        {[1, 2, 3, 4, 5].map(orbit => (
          <circle
            key={`orbit-ring-${orbit}`}
            cx="50%"
            cy="50%"
            r={ORBIT_RADII[orbit]}
            fill="none"
            stroke={`rgba(124,58,237,${STROKE_ALPHAS[orbit]})`}
            strokeWidth={1.5}
          />
        ))}

        {/* Non-center nodes */}
        {nonCenterNodes.map(node => {
          const person = persons.find(p => p.id === node.id)
          if (!person) return null
          const color = branchColorMap.get(node.id) ?? 'white'
          const deceased = person.date_deces !== null
          return (
            <CosmosNode
              key={node.id}
              ref={nodeRefs.get(node.id) as React.RefObject<SVGGElement>}
              id={node.id}
              cx={0}
              cy={0}
              orbit={node.orbit}
              prenom={person.prenom}
              deceased={deceased}
              mode={branchMode ? 'branch' : 'mono'}
              branchColor={color}
              shadowDx={0}
              shadowDy={0}
              onClick={selectPerson}
              onHover={setHoveredId}
            />
          )
        })}

        {/* Center node */}
        {centerPerson && (
          <g
            data-testid="cosmos-center"
            style={{
              cursor: 'pointer',
              filter: 'drop-shadow(0 0 6px rgba(124, 58, 237, 0.35))',
            }}
            onClick={() => selectPerson(centerPerson.id)}
          >
            <circle
              cx="50%"
              cy="50%"
              r={18}
              fill="none"
              stroke="#7c3aed"
              strokeOpacity={0.9}
              strokeWidth={2}
            />
            <circle
              cx="50%"
              cy="50%"
              r={10}
              fill="#7c3aed"
              filter="url(#nodeGlow)"
            />
            <text
              x="50%"
              y="50%"
              dy="-28"
              textAnchor="middle"
              fill="#1a1a1a"
              fontSize={11}
              fontWeight={600}
              style={{ pointerEvents: 'none' }}
            >
              {centerPerson.prenom}
            </text>
            <text
              x="50%"
              y="50%"
              dy="-16"
              textAnchor="middle"
              fill="#8a8580"
              fontSize={9}
              style={{ pointerEvents: 'none' }}
            >
              {centerPerson.nom}
              {centerPerson.date_naissance
                ? ` · ${new Date(centerPerson.date_naissance).getFullYear()}`
                : ''}
            </text>
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {hoveredPerson && (
        <CosmosTooltip
          person={hoveredPerson}
          role={roleMap.get(hoveredPerson.id) ?? ''}
          x={mousePos.x}
          y={mousePos.y}
        />
      )}

      {/* Orphan badge */}
      {orphans.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            background: '#ffffff',
            color: '#8a8580',
            border: '1px solid #e5e2dd',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 12,
            backdropFilter: 'blur(8px)',
          }}
        >
          {orphans.length} non connecté{orphans.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
