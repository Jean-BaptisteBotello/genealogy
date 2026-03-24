'use client'
import { createContext, useContext } from 'react'
import type { Person, Branch, Relationship, PersonBranch, Role } from '@/lib/types/database'

export interface TreeContextValue {
  // Data (fed from Server Component via AppShell props)
  persons: Person[]
  branches: Branch[]
  relationships: Relationship[]
  personBranches: PersonBranch[]
  // Role
  currentRole: Role
  // Selection
  selectedPersonId: string | null
  selectPerson: (id: string | null) => void
  // Modals
  openAddPerson: () => void
  openEditPerson: (id: string) => void
  // Suggestions
  pendingSuggestionsCount: number
  // Toast
  showToast: (message: string, type?: 'error' | 'info') => void
  // Filters
  showFamily: boolean
  setShowFamily: (v: boolean) => void
  showExtendedFamily: boolean
  setShowExtendedFamily: (v: boolean) => void
  filteredRelationships: Relationship[]
}

export const TreeContext = createContext<TreeContextValue | null>(null)

export function useTree(): TreeContextValue {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error('useTree must be used inside AppShell')
  return ctx
}
