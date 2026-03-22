// src/components/layout/AppShell.tsx
'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { DetailPanel } from '@/components/layout/DetailPanel'
import { PersonModal } from '@/components/person/PersonModal'
import { SearchOverlay } from '@/components/search/SearchOverlay'
import { MembersModal } from '@/components/members/MembersModal'
import { TreeContext } from '@/lib/context/tree-context'
import { ViewRouter } from '@/components/views/ViewRouter'
import type { Person, Branch, Relationship, PersonBranch, Role } from '@/lib/types/database'
import type { MemberWithUser } from '@/server-actions/members'

type View = 'cosmos' | 'sablier' | 'timeline' | 'carte' | 'eventail'

interface AppShellProps {
  userEmail: string
  initialPersons: Person[]
  initialBranches: Branch[]
  initialRelationships: Relationship[]
  initialPersonBranches: PersonBranch[]
  currentRole: Role
  initialMembers: MemberWithUser[]
}

type PersonModalMode = 'add' | { type: 'edit'; person: Person } | null

interface Toast {
  message: string
  type: 'error' | 'info'
}

export function AppShell({
  userEmail,
  initialPersons,
  initialBranches,
  initialRelationships,
  initialPersonBranches,
  currentRole,
  initialMembers,
}: AppShellProps) {
  const router = useRouter()
  const [activeView, setActiveView] = useState<View>('cosmos')
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [personModalMode, setPersonModalMode] = useState<PersonModalMode>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [membersModalOpen, setMembersModalOpen] = useState(false)
  const [members, setMembers] = useState<MemberWithUser[]>(initialMembers)

  useEffect(() => {
    setMembers(initialMembers)
  }, [initialMembers])

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const selectPerson = useCallback((id: string | null) => {
    setSelectedPersonId(id)
    setDetailOpen(id !== null)
  }, [])

  const openAddPerson = useCallback(() => {
    setPersonModalMode('add')
  }, [])

  const openEditPerson = useCallback((id: string) => {
    const person = initialPersons.find(p => p.id === id)
    if (!person) return
    setPersonModalMode({ type: 'edit', person })
  }, [initialPersons])

  const showToast = useCallback((message: string, type: 'error' | 'info' = 'info') => {
    setToast({ message, type })
  }, [])

  const selectedPerson = selectedPersonId
    ? initialPersons.find(p => p.id === selectedPersonId) ?? null
    : null

  return (
    <TreeContext.Provider
      value={{
        persons: initialPersons,
        branches: initialBranches,
        relationships: initialRelationships,
        personBranches: initialPersonBranches,
        currentRole,
        selectedPersonId,
        selectPerson,
        openAddPerson,
        openEditPerson,
        showToast,
      }}
    >
      <div className="flex flex-col h-screen overflow-hidden">
        <Topbar
          userEmail={userEmail}
          activeView={activeView}
          onViewChange={setActiveView}
          onAddPerson={currentRole !== 'VIEWER' ? openAddPerson : undefined}
          onSearchOpen={() => setSearchOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            branches={initialBranches}
            currentRole={currentRole}
            onManageMembers={() => setMembersModalOpen(true)}
          />
          <main className="flex-1 overflow-hidden relative">
            <ViewRouter activeView={activeView} />
          </main>
          <DetailPanel
            isOpen={detailOpen}
            onClose={() => { setDetailOpen(false); setSelectedPersonId(null) }}
            person={selectedPerson}
            personBranches={initialPersonBranches}
            branches={initialBranches}
            relationships={initialRelationships}
            allPersons={initialPersons}
            onSelectPerson={selectPerson}
            onEditPerson={openEditPerson}
            onDeletePerson={async (id) => {
              const { deletePerson } = await import('@/server-actions/persons')
              const result = await deletePerson(id)
              if (result.error) {
                showToast(result.error, 'error')
              } else {
                setDetailOpen(false)
                setSelectedPersonId(null)
                router.refresh()
              }
            }}
            onShowToast={showToast}
          />
        </div>
      </div>

      {personModalMode !== null && (
        <PersonModal
          mode={personModalMode === 'add' ? 'add' : personModalMode}
          onClose={() => setPersonModalMode(null)}
        />
      )}

      {membersModalOpen && (
        <MembersModal
          members={members}
          currentRole={currentRole}
          onClose={() => setMembersModalOpen(false)}
        />
      )}

      {toast && (
        <div
          role="status"
          className={[
            'fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg text-sm shadow-lg',
            toast.type === 'error'
              ? 'bg-red-900/90 text-red-200 border border-red-700'
              : 'bg-[#0d1117]/90 text-gray-200 border border-[#1e3a5f]',
          ].join(' ')}
        >
          {toast.message}
        </div>
      )}

      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          onSelectPerson={(id) => {
            selectPerson(id)
            setSearchOpen(false)
          }}
        />
      )}
    </TreeContext.Provider>
  )
}
