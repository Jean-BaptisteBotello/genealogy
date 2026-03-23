// src/lib/validation/suggestions.ts
import { z } from 'zod'
import type { SuggestionType } from '@/lib/types/database'

export const editPersonPayloadSchema = z.object({
  prenom: z.string().optional(),
  nom: z.string().optional(),
  date_naissance: z.string().nullable().optional(),
  lieu_naissance: z.string().nullable().optional(),
  date_deces: z.string().nullable().optional(),
  lieu_deces: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const addPersonPayloadSchema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  date_naissance: z.string().nullable().optional(),
  lieu_naissance: z.string().nullable().optional(),
  date_deces: z.string().nullable().optional(),
  lieu_deces: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const addRelationshipPayloadSchema = z.object({
  person_a_id: z.string().uuid(),
  person_b_id: z.string().uuid(),
  type: z.enum(['PARENT_CHILD', 'UNION', 'ADOPTION', 'SIBLING', 'HALF_SIBLING', 'STEP']),
  metadata: z.record(z.unknown()).optional(),
})

export type EditPersonPayload = z.infer<typeof editPersonPayloadSchema>
export type AddPersonPayload = z.infer<typeof addPersonPayloadSchema>
export type AddRelationshipPayload = z.infer<typeof addRelationshipPayloadSchema>

type ParseResult =
  | { ok: true; data: EditPersonPayload | AddPersonPayload | AddRelationshipPayload | Record<string, never> }
  | { ok: false; error: string }

export function parsePayload(type: SuggestionType, payload: Record<string, unknown>): ParseResult {
  try {
    switch (type) {
      case 'EDIT_PERSON':
        return { ok: true, data: editPersonPayloadSchema.parse(payload) }
      case 'ADD_PERSON':
        return { ok: true, data: addPersonPayloadSchema.parse(payload) }
      case 'ADD_RELATIONSHIP':
        return { ok: true, data: addRelationshipPayloadSchema.parse(payload) }
      case 'DELETE_PERSON':
      case 'DELETE_RELATIONSHIP':
        return { ok: true, data: {} }
    }
  } catch (e) {
    const msg = e instanceof z.ZodError ? (e.issues[0]?.message ?? 'Payload invalide.') : 'Payload invalide.'
    return { ok: false, error: msg }
  }
}
