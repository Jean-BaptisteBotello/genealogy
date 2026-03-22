'use client'
import { useState, useTransition } from 'react'
import { inviteMember, updateMemberRole, removeMember } from '@/server-actions/members'
import type { MemberWithUser } from '@/server-actions/members'
import type { Role } from '@/lib/types/database'
import { useRouter } from 'next/navigation'

const ROLES: Role[] = ['ADMIN', 'EDITOR', 'VIEWER']
const INVITE_ROLES: Role[] = ['EDITOR', 'VIEWER']
const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrateur',
  EDITOR: 'Éditeur',
  VIEWER: 'Lecteur',
}

interface MembersModalProps {
  members: MemberWithUser[]
  currentRole: Role
  onClose: () => void
}

export function MembersModal({ members, currentRole, onClose }: MembersModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('EDITOR')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleInvite() {
    if (!email.trim()) return
    setInviteError(null)
    startTransition(async () => {
      const result = await inviteMember(email.trim(), inviteRole)
      if (result.error) {
        setInviteError(result.error)
      } else {
        setEmail('')
        router.refresh()
      }
    })
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      await removeMember(userId)
      router.refresh()
    })
  }

  function handleRoleChange(userId: string, role: Role) {
    startTransition(async () => {
      await updateMemberRole(userId, role)
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#080d16] border border-[#1e3a5f] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Gérer les accès</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-gray-500 hover:text-gray-300 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Member list */}
        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {members.length === 0 && (
            <p className="text-xs text-gray-600 italic">Aucun membre pour l'instant.</p>
          )}
          {members.map(m => (
            <div key={m.user_id} className="flex items-center gap-2 py-1.5 border-b border-[#1e3a5f]/40">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white truncate">
                  {m.users?.email ?? m.user_id}
                </div>
              </div>
              {currentRole === 'ADMIN' ? (
                <select
                  value={m.role}
                  onChange={e => handleRoleChange(m.user_id, e.target.value as Role)}
                  aria-label={`Rôle de ${m.users?.email ?? m.user_id}`}
                  className="text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-1 py-0.5"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-gray-500">{m.role}</span>
              )}
              {currentRole === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleRemove(m.user_id)}
                  title="Supprimer ce membre"
                  className="text-gray-600 hover:text-red-400 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Invite form (ADMIN only) */}
        {currentRole === 'ADMIN' && (
          <div className="border-t border-[#1e3a5f] pt-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Inviter un membre</p>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600"
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as Role)}
                aria-label="Rôle à attribuer"
                className="text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-1 py-1.5"
              >
                {INVITE_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            {inviteError && (
              <p className="text-xs text-red-400 mb-2">{inviteError}</p>
            )}
            <button
              type="button"
              onClick={handleInvite}
              disabled={isPending || !email.trim()}
              className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Envoi...' : 'Inviter'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
