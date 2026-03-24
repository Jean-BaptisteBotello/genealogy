'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import ReactFlow, { Background, Controls, Handle, Position, type NodeChange, applyNodeChanges, type Node, type NodeProps } from 'reactflow'
import 'reactflow/dist/style.css'
import { useTree } from '@/lib/context/tree-context'
import { computeSablierLayout } from './sablierLayout'

const STORAGE_KEY = 'sablier_positions'

// Custom node with 4 handles: top/bottom for filiation, left/right for union
function SablierNode({ data }: NodeProps) {
  return (
    <div style={data.nodeStyle}>
      <Handle type="target" position={Position.Top} id="top" style={{ background: 'transparent', border: 'none', width: 6, height: 6 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: 'transparent', border: 'none', width: 6, height: 6 }} />
      <Handle type="source" position={Position.Left} id="left" style={{ background: 'transparent', border: 'none', width: 6, height: 6 }} />
      <Handle type="target" position={Position.Right} id="right" style={{ background: 'transparent', border: 'none', width: 6, height: 6 }} />
      {data.label}
    </div>
  )
}

const nodeTypes = { sablier: SablierNode }

type SavedPositions = Record<string, { x: number; y: number }>

function loadPositions(): SavedPositions {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function savePositions(positions: SavedPositions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
}

export function SablierView() {
  const { persons, relationships, selectedPersonId, selectPerson, openAddPerson } = useTree()

  const [customPositions, setCustomPositions] = useState<SavedPositions>({})

  // Load saved positions on mount
  useEffect(() => {
    setCustomPositions(loadPositions())
  }, [])

  // Auto-select first person
  useEffect(() => {
    if (persons.length > 0 && !selectedPersonId) {
      selectPerson(persons[0].id)
    }
  }, [persons, selectedPersonId, selectPerson])

  const centerId = selectedPersonId ?? persons[0]?.id ?? ''
  const personMap = useMemo(() => new Map(persons.map(p => [p.id, p])), [persons])

  const { nodes: layoutNodes, orphans } = useMemo(
    () => computeSablierLayout(persons.map(p => p.id), relationships, centerId),
    [persons, relationships, centerId]
  )

  const CENTER_X = 400
  const CENTER_Y = 400

  // Build ReactFlow nodes, merging custom positions
  const initialNodes: Node[] = useMemo(() => layoutNodes.map(n => {
    const person = personMap.get(n.id)
    const autoPos = { x: CENTER_X + n.x, y: CENTER_Y + n.y }
    const pos = customPositions[n.id] ?? autoPos
    return {
      id: n.id,
      type: 'sablier',
      position: pos,
      draggable: true,
      data: {
        label: person ? `${person.prenom} ${person.nom}` : n.id,
        nodeStyle: {
          background: n.id === centerId ? 'var(--accent-hover, #1e3a5f)' : 'var(--accent-bg, #0d1117)',
          color: 'var(--text-primary, white)',
          border: n.id === centerId ? '2px solid var(--text-link, #3b82f6)' : '1px solid var(--divider, #1e3a5f)',
          borderRadius: 6,
          fontSize: 12,
          padding: '4px 8px',
          minWidth: 120,
          textAlign: 'center' as const,
        },
      },
    }
  }), [layoutNodes, personMap, centerId, customPositions])

  // Controlled nodes state for ReactFlow
  const [nodes, setNodes] = useState<Node[]>(initialNodes)

  // Sync when initialNodes change (new person selected, data changes)
  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes])

  const nodeIds = useMemo(() => new Set(layoutNodes.map(n => n.id)), [layoutNodes])
  const rfEdges = useMemo(() => relationships
    .filter(r => nodeIds.has(r.person_a_id) && nodeIds.has(r.person_b_id))
    .map(r => {
      const isUnion = r.type === 'UNION'
      const isSibling = r.type === 'SIBLING' || r.type === 'HALF_SIBLING'
      const isHorizontal = isUnion || isSibling
      const isDashed = isSibling || r.type === 'ADOPTION' || r.type === 'STEP'
      return {
        id: r.id,
        source: r.person_a_id,
        target: r.person_b_id,
        sourceHandle: isHorizontal ? 'left' : 'bottom',
        targetHandle: isHorizontal ? 'right' : 'top',
        style: {
          stroke: isUnion ? '#60a5fa' : '#4b5563',
          strokeDasharray: isDashed ? '6 3' : undefined,
        },
      }
    }),
  [relationships, nodeIds])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds))
  }, [])

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    setCustomPositions(prev => {
      const next = { ...prev, [node.id]: { x: node.position.x, y: node.position.y } }
      savePositions(next)
      return next
    })
  }, [])

  const hasCustomPositions = Object.keys(customPositions).length > 0

  const resetPositions = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setCustomPositions({})
  }, [])

  if (persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⧖</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary, white)' }}>Votre arbre vous attend</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary, #6b7280)' }}>Commencez par ajouter la première personne.</p>
          <button
            type="button"
            onClick={openAddPerson}
            className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
          >
            + Ajouter une personne
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={(_, node) => selectPerson(node.id)}
        nodesDraggable
        fitView
      >
        <Background color="var(--divider, #1e3a5f)" gap={40} />
        <Controls />
      </ReactFlow>

      {hasCustomPositions && (
        <button
          type="button"
          onClick={resetPositions}
          data-testid="reset-positions"
          className="absolute bottom-14 right-4 text-xs px-3 py-1.5 rounded transition-colors"
          style={{
            background: 'var(--accent-bg, rgba(255,255,255,0.1))',
            color: 'var(--text-secondary, #9ca3af)',
            border: '1px solid var(--divider, #1e3a5f)',
          }}
        >
          Réinitialiser les positions
        </button>
      )}

      {orphans.length > 0 && (
        <div
          className="absolute bottom-4 left-4 text-xs rounded px-2 py-1"
          style={{
            background: 'var(--badge-bg, #0d1117)',
            color: 'var(--badge-text, #9ca3af)',
            border: '1px solid var(--divider, #1e3a5f)',
          }}
        >
          {orphans.length} non connecté{orphans.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
