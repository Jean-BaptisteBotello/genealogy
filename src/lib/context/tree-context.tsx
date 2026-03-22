'use client'
import { createContext, useContext } from 'react'
import type { Person, Branch, Relationship, PersonBranch } from '@/lib/types/database'

export interface TreeContextValue {
  // Data (fed from Server Component via AppShell props)
  persons: Person[]
  branches: Branch[]
  relationships: Relationship[]
  personBranches: PersonBranch[]
  // Selection
  selectedPersonId: string | null
  selectPerson: (id: string | null) => void
  // Modals
  openAddPerson: () => void
  openEditPerson: (id: string) => void
  // Toast
  showToast: (message: string, type?: 'error' | 'info') => void
}

export const TreeContext = createContext<TreeContextValue | null>(null)

export function useTree(): TreeContextValue {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error('useTree must be used inside AppShell')
  return ctx
}
