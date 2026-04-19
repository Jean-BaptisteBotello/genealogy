'use client'
import { useState } from 'react'
import type { Person } from '@/lib/types/database'

interface OrphanPanelProps {
  orphanIds: string[]
  persons: Person[]
  onSelectPerson: (id: string) => void
  label?: string
}

export function OrphanPanel({ orphanIds, persons, onSelectPerson, label }: OrphanPanelProps) {
  const [expanded, setExpanded] = useState(false)

  if (orphanIds.length === 0) return null

  const orphans = orphanIds
    .map(id => persons.find(p => p.id === id))
    .filter((p): p is Person => p != null)

  const defaultLabel = `${orphans.length} non connecté${orphans.length > 1 ? 's' : ''}`

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #e5e2dd',
        borderRadius: 10,
        padding: expanded ? '10px 14px' : '6px 12px',
        fontSize: 12,
        color: '#6b6760',
        zIndex: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        maxWidth: 260,
        transition: 'padding 0.15s',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#6b6760',
          fontSize: 12,
          fontWeight: 500,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
        }}
      >
        <span style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'rgba(124, 58, 237, 0.08)',
          color: '#7c3aed',
          fontSize: 10,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {orphans.length}
        </span>
        {label ?? defaultLabel}
        <span style={{ marginLeft: 'auto', fontSize: 10 }}>{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {orphans.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPerson(p.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: '4px 6px',
                borderRadius: 6,
                fontSize: 11,
                color: '#3a3a3a',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {p.prenom} {p.nom}
              {p.date_naissance && (
                <span style={{ color: '#8a8580', marginLeft: 4 }}>
                  · {new Date(p.date_naissance).getFullYear()}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
