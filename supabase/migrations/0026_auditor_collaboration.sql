-- Migration 0026: Auditor Collaboration™
-- Module 21 — Auditor Collaboration™
-- Idempotent: uses IF NOT EXISTS throughout

-- ============================================================
-- 1. auditor_organizations — external audit / law firms
-- ============================================================
CREATE TABLE IF NOT EXISTS auditor_organizations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  firm_type             text NOT NULL DEFAULT 'audit_firm'
                          CHECK (firm_type IN ('audit_firm','law_firm','consulting','assessor','other')),
  website               text,
  country               text,
  specializations       jsonb NOT NULL DEFAULT '[]',
  contact_email         text,
  contact_name          text,
  verification_status   text NOT NULL DEFAULT 'unverified'
                          CHECK (verification_status IN ('unverified','pending','verified')),
  notes                 text,
  is_active             boolean NOT NULL DEFAULT true,
  created_by            uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. external_users — auditors / assessors given portal access
-- ============================================================
CREATE TABLE IF NOT EXISTS external_users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  auditor_org_id    uuid REFERENCES auditor_organizations(id) ON DELETE SET NULL,
  email             text NOT NULL,
  full_name         text NOT NULL,
  user_type         text NOT NULL DEFAULT 'auditor'
                      CHECK (user_type IN (
                        'auditor','iso_auditor','soc_auditor','dpdp_assessor',
                        'privacy_consultant','law_firm','security_assessor',
                        'ai_governance_reviewer','customer_reviewer','vendor_reviewer'
                      )),
  title             text,
  company           text,
  phone             text,
  status            text NOT NULL DEFAULT 'invited'
                      CHECK (status IN ('invited','active','suspended','revoked')),
  access_expires_at timestamptz,
  last_accessed_at  timestamptz,
  invite_token      text UNIQUE,
  invite_sent_at    timestamptz,
  created_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. audit_rooms — dedicated workspaces per engagement
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_rooms (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  room_type        text NOT NULL DEFAULT 'audit'
                     CHECK (room_type IN ('audit','assessment','due_diligence','review','consulting','custom')),
  framework        text,
  scope            text,
  objective        text,
  status           text NOT NULL DEFAULT 'planning'
                     CHECK (status IN ('planning','active','under_review','completed','archived','cancelled')),
  start_date       date,
  end_date         date,
  completion_pct   int NOT NULL DEFAULT 0,
  auditor_org_id   uuid REFERENCES auditor_organizations(id) ON DELETE SET NULL,
  lead_auditor_id  uuid REFERENCES external_users(id) ON DELETE SET NULL,
  owner_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata         jsonb NOT NULL DEFAULT '{}',
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. audit_room_documents — docs shared inside a room
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_room_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid NOT NULL REFERENCES audit_rooms(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_name   text NOT NULL,
  document_type   text NOT NULL DEFAULT 'evidence'
                    CHECK (document_type IN (
                      'evidence','policy','contract','report','control_test',
                      'risk_register','assessment','privacy_record','ai_assessment','custom'
                    )),
  storage_path    text,
  file_size       bigint,
  content_type    text,
  source_module   text,
  source_id       text,
  uploaded_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. audit_room_activities — timeline of all room events
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_room_activities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id          uuid NOT NULL REFERENCES audit_rooms(id) ON DELETE CASCADE,
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  activity_type    text NOT NULL,
  description      text NOT NULL,
  actor_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  external_user_id uuid REFERENCES external_users(id) ON DELETE SET NULL,
  metadata         jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. evidence_requests — auditors request specific evidence
-- ============================================================
CREATE TABLE IF NOT EXISTS evidence_requests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id            uuid NOT NULL REFERENCES audit_rooms(id) ON DELETE CASCADE,
  organization_id    uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title              text NOT NULL,
  description        text,
  evidence_type      text NOT NULL DEFAULT 'custom'
                       CHECK (evidence_type IN (
                         'policy','control_test','risk_register','vendor_assessment',
                         'contract','privacy_record','ai_assessment','audit_log','custom'
                       )),
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','submitted','under_review','accepted','rejected','expired')),
  priority           text NOT NULL DEFAULT 'medium'
                       CHECK (priority IN ('low','medium','high','critical')),
  due_date           date,
  requested_by_id    uuid REFERENCES external_users(id) ON DELETE SET NULL,
  assigned_owner_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_notes     text,
  rejection_reason   text,
  submitted_at       timestamptz,
  reviewed_at        timestamptz,
  created_by         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. evidence_responses — uploaded evidence per request
-- ============================================================
CREATE TABLE IF NOT EXISTS evidence_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid NOT NULL REFERENCES evidence_requests(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_name   text NOT NULL,
  storage_path    text,
  file_size       bigint,
  content_type    text,
  description     text,
  source_module   text,
  source_id       text,
  uploaded_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. audit_reviews — review assignments per room
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid NOT NULL REFERENCES audit_rooms(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reviewer_id     uuid NOT NULL REFERENCES external_users(id) ON DELETE CASCADE,
  review_area     text NOT NULL DEFAULT 'general'
                    CHECK (review_area IN (
                      'documents','controls','risks','policies',
                      'ai_systems','privacy_assessments','general'
                    )),
  status          text NOT NULL DEFAULT 'assigned'
                    CHECK (status IN ('assigned','in_progress','completed','on_hold')),
  notes           text,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. external_comments — threaded comments across entities
-- ============================================================
CREATE TABLE IF NOT EXISTS external_comments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_id            uuid NOT NULL REFERENCES audit_rooms(id) ON DELETE CASCADE,
  entity_type        text NOT NULL
                       CHECK (entity_type IN ('room','evidence_request','finding','assessment')),
  entity_id          text NOT NULL,
  parent_id          uuid REFERENCES external_comments(id) ON DELETE CASCADE,
  content            text NOT NULL,
  comment_type       text NOT NULL DEFAULT 'external'
                       CHECK (comment_type IN ('internal','external')),
  is_resolved        boolean NOT NULL DEFAULT false,
  resolved_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at        timestamptz,
  author_id          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  external_author_id uuid REFERENCES external_users(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. external_findings — findings created by auditors
-- ============================================================
CREATE TABLE IF NOT EXISTS external_findings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid NOT NULL REFERENCES audit_rooms(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  severity        text NOT NULL DEFAULT 'medium'
                    CHECK (severity IN ('low','medium','high','critical')),
  finding_type    text NOT NULL DEFAULT 'observation'
                    CHECK (finding_type IN (
                      'observation','non_conformance','opportunity',
                      'major_nc','minor_nc','recommendation'
                    )),
  status          text NOT NULL DEFAULT 'open'
                    CHECK (status IN (
                      'open','in_remediation','ready_for_review',
                      'verified','closed','accepted'
                    )),
  framework       text,
  control_ref     text,
  recommendation  text,
  due_date        date,
  evidence_ref    text,
  raised_by_id    uuid REFERENCES external_users(id) ON DELETE SET NULL,
  owner_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  issue_id        uuid,
  verified_by_id  uuid REFERENCES external_users(id) ON DELETE SET NULL,
  verified_at     timestamptz,
  closed_at       timestamptz,
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. external_assessments — assessment projects in a room
-- ============================================================
CREATE TABLE IF NOT EXISTS external_assessments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id              uuid NOT NULL REFERENCES audit_rooms(id) ON DELETE CASCADE,
  organization_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  description          text,
  assessment_type      text NOT NULL DEFAULT 'custom'
                         CHECK (assessment_type IN (
                           'iso_27001','soc2','dpdp','ai_governance',
                           'vendor','privacy','custom'
                         )),
  status               text NOT NULL DEFAULT 'planning'
                         CHECK (status IN ('planning','in_progress','completed','cancelled')),
  completion_pct       int NOT NULL DEFAULT 0,
  start_date           date,
  end_date             date,
  lead_assessor_id     uuid REFERENCES external_users(id) ON DELETE SET NULL,
  open_findings        int NOT NULL DEFAULT 0,
  pending_evidence     int NOT NULL DEFAULT 0,
  total_milestones     int NOT NULL DEFAULT 0,
  completed_milestones int NOT NULL DEFAULT 0,
  ai_readiness_score   numeric(5,2),
  notes                text,
  created_by           uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. external_permissions — resource-level access grants
-- ============================================================
CREATE TABLE IF NOT EXISTS external_permissions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_user_id uuid NOT NULL REFERENCES external_users(id) ON DELETE CASCADE,
  resource_type    text NOT NULL CHECK (resource_type IN ('room','document','assessment')),
  resource_id      text NOT NULL,
  permission_level text NOT NULL DEFAULT 'read'
                     CHECK (permission_level IN ('read','review','comment','approve','admin')),
  granted_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_auditor_orgs_org      ON auditor_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_external_users_org    ON external_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_external_users_status ON external_users(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_rooms_org       ON audit_rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_rooms_status    ON audit_rooms(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_room_docs_room        ON audit_room_documents(room_id);
CREATE INDEX IF NOT EXISTS idx_room_activities_room  ON audit_room_activities(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_req_room     ON evidence_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_evidence_req_status   ON evidence_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_evidence_resp_req     ON evidence_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_reviews_room    ON audit_reviews(room_id);
CREATE INDEX IF NOT EXISTS idx_ext_comments_entity   ON external_comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ext_findings_room     ON external_findings(room_id);
CREATE INDEX IF NOT EXISTS idx_ext_findings_status   ON external_findings(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ext_assessments_room  ON external_assessments(room_id);
CREATE INDEX IF NOT EXISTS idx_ext_perms_user        ON external_permissions(external_user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE auditor_organizations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_rooms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_room_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_room_activities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_responses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_findings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_assessments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_permissions    ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='auditor_organizations' AND policyname='auditor_organizations_org_policy') THEN
    CREATE POLICY auditor_organizations_org_policy ON auditor_organizations USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='external_users' AND policyname='external_users_org_policy') THEN
    CREATE POLICY external_users_org_policy ON external_users USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='audit_rooms' AND policyname='audit_rooms_org_policy') THEN
    CREATE POLICY audit_rooms_org_policy ON audit_rooms USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='audit_room_documents' AND policyname='audit_room_documents_org_policy') THEN
    CREATE POLICY audit_room_documents_org_policy ON audit_room_documents USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='audit_room_activities' AND policyname='audit_room_activities_org_policy') THEN
    CREATE POLICY audit_room_activities_org_policy ON audit_room_activities USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='evidence_requests' AND policyname='evidence_requests_org_policy') THEN
    CREATE POLICY evidence_requests_org_policy ON evidence_requests USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='evidence_responses' AND policyname='evidence_responses_org_policy') THEN
    CREATE POLICY evidence_responses_org_policy ON evidence_responses USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='audit_reviews' AND policyname='audit_reviews_org_policy') THEN
    CREATE POLICY audit_reviews_org_policy ON audit_reviews USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='external_comments' AND policyname='external_comments_org_policy') THEN
    CREATE POLICY external_comments_org_policy ON external_comments USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='external_findings' AND policyname='external_findings_org_policy') THEN
    CREATE POLICY external_findings_org_policy ON external_findings USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='external_assessments' AND policyname='external_assessments_org_policy') THEN
    CREATE POLICY external_assessments_org_policy ON external_assessments USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='external_permissions' AND policyname='external_permissions_org_policy') THEN
    CREATE POLICY external_permissions_org_policy ON external_permissions USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
END $$;
