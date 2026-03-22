-- supabase/migrations/001_initial_schema.sql

-- Enums
CREATE TYPE relationship_type AS ENUM (
  'PARENT_CHILD', 'UNION', 'ADOPTION', 'SIBLING', 'HALF_SIBLING', 'STEP'
);

CREATE TYPE document_type AS ENUM (
  'ACTE_NAISSANCE', 'ACTE_MARIAGE', 'ACTE_DECES', 'AUTRE'
);

CREATE TYPE member_role AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- Person
CREATE TABLE person (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom          TEXT NOT NULL,
  nom             TEXT NOT NULL,
  date_naissance  DATE,
  lieu_naissance  TEXT,
  lat_naissance   DOUBLE PRECISION,
  lon_naissance   DOUBLE PRECISION,
  date_deces      DATE,
  lieu_deces      TEXT,
  lat_deces       DOUBLE PRECISION,
  lon_deces       DOUBLE PRECISION,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Relationship
CREATE TABLE relationship (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_a_id  UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  person_b_id  UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  type         relationship_type NOT NULL,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT no_self_relation CHECK (person_a_id <> person_b_id)
);

CREATE INDEX idx_relationship_a ON relationship(person_a_id);
CREATE INDEX idx_relationship_b ON relationship(person_b_id);

-- Branch
CREATE TABLE branch (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         TEXT NOT NULL,
  couleur     TEXT NOT NULL DEFAULT '#7ec8e3',
  description TEXT,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Person ↔ Branch (many-to-many)
CREATE TABLE person_branch (
  person_id  UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  branch_id  UUID NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, branch_id)
);

-- Document
CREATE TABLE document (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id      UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  nom            TEXT NOT NULL,
  type           document_type NOT NULL,
  url_stockage   TEXT NOT NULL,
  taille_bytes   INTEGER NOT NULL CHECK (taille_bytes <= 20971520),
  uploaded_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_person ON document(person_id);

-- Tree members (permissions)
CREATE TABLE tree_member (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        member_role NOT NULL DEFAULT 'VIEWER',
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  invited_by  UUID REFERENCES auth.users(id)
);

-- Auto-update updated_at on person
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER person_updated_at
  BEFORE UPDATE ON person
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
