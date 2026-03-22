export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER'

export type RelationshipType =
  | 'PARENT_CHILD'
  | 'UNION'
  | 'ADOPTION'
  | 'SIBLING'
  | 'HALF_SIBLING'
  | 'STEP'

export type DocumentType =
  | 'ACTE_NAISSANCE'
  | 'ACTE_MARIAGE'
  | 'ACTE_DECES'
  | 'AUTRE'

export interface Person {
  id: string
  prenom: string
  nom: string
  date_naissance: string | null
  lieu_naissance: string | null
  lat_naissance: number | null
  lon_naissance: number | null
  date_deces: string | null
  lieu_deces: string | null
  lat_deces: number | null
  lon_deces: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Relationship {
  id: string
  person_a_id: string
  person_b_id: string
  type: RelationshipType
  metadata: Record<string, unknown>
}

export interface Branch {
  id: string
  nom: string
  couleur: string
  description: string | null
  created_by: string
  created_at: string
}

export interface PersonBranch {
  person_id: string
  branch_id: string
}

export interface Document {
  id: string
  person_id: string
  nom: string
  type: DocumentType
  url_stockage: string
  taille_bytes: number
  uploaded_by: string
  created_at: string
}

export interface TreeMember {
  user_id: string
  role: Role
  invited_at: string
  invited_by: string
}

export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
}

// Graph representation for views
export interface GraphNode {
  id: string
  data: Person & { branches: Branch[] }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: RelationshipType
  metadata: Record<string, unknown>
}
