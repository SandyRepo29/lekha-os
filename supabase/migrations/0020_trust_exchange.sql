-- Third-Party Risk Exchange™ — Module 15
-- Enums
CREATE TYPE trust_doc_type AS ENUM ('soc2','iso27001','iso27701','pci_dss','hipaa','dpdp','cyber_insurance','pen_test','dpa','security_whitepaper','sig_questionnaire','caiq','custom');
CREATE TYPE trust_visibility AS ENUM ('private','specific','network','public');
CREATE TYPE trust_verification_level AS ENUM ('self_attested','customer_verified','auditor_verified','audt_verified');
CREATE TYPE trust_badge_type AS ENUM ('audt_verified','dpdp_ready','privacy_verified','vendor_trusted','low_risk','enterprise_ready','iso_verified','soc2_verified','custom');
CREATE TYPE trust_relationship_type AS ENUM ('customer','vendor','partner');
CREATE TYPE trust_relationship_status AS ENUM ('pending','active','inactive','revoked');
CREATE TYPE trust_activity_type AS ENUM ('profile_created','profile_updated','document_shared','document_verified','badge_issued','relationship_created','questionnaire_answered','verification_requested');

-- trust_profiles: one per org — the public Trust Profile
CREATE TABLE IF NOT EXISTS trust_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  industry TEXT,
  company_size TEXT,
  country TEXT,
  website TEXT,
  logo_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  visibility trust_visibility NOT NULL DEFAULT 'private',
  trust_score INTEGER,
  privacy_score INTEGER,
  risk_level TEXT DEFAULT 'unknown',
  profile_completeness INTEGER NOT NULL DEFAULT 0,
  certifications JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id)
);
CREATE INDEX IF NOT EXISTS trust_profiles_org_idx ON trust_profiles(organization_id);
CREATE INDEX IF NOT EXISTS trust_profiles_published_idx ON trust_profiles(is_published);
CREATE INDEX IF NOT EXISTS trust_profiles_industry_idx ON trust_profiles(industry);

-- trust_documents: evidence documents uploaded for exchange
CREATE TABLE IF NOT EXISTS trust_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trust_profile_id UUID NOT NULL REFERENCES trust_profiles(id) ON DELETE CASCADE,
  doc_type trust_doc_type NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT,
  file_size BIGINT,
  storage_path TEXT,
  storage_bucket TEXT,
  issued_date DATE,
  expiry_date DATE,
  issuer TEXT,
  visibility trust_visibility NOT NULL DEFAULT 'private',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_level trust_verification_level DEFAULT 'self_attested',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS trust_docs_org_idx ON trust_documents(organization_id);
CREATE INDEX IF NOT EXISTS trust_docs_profile_idx ON trust_documents(trust_profile_id);
CREATE INDEX IF NOT EXISTS trust_docs_type_idx ON trust_documents(doc_type);
CREATE INDEX IF NOT EXISTS trust_docs_visibility_idx ON trust_documents(visibility);
CREATE INDEX IF NOT EXISTS trust_docs_expiry_idx ON trust_documents(expiry_date);

-- trust_shares: which orgs can access specific documents
CREATE TABLE IF NOT EXISTS trust_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_document_id UUID NOT NULL REFERENCES trust_documents(id) ON DELETE CASCADE,
  owner_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS trust_shares_doc_idx ON trust_shares(trust_document_id);
CREATE INDEX IF NOT EXISTS trust_shares_owner_idx ON trust_shares(owner_org_id);
CREATE INDEX IF NOT EXISTS trust_shares_recipient_idx ON trust_shares(recipient_org_id);

-- trust_questionnaires: reusable questionnaire templates
CREATE TABLE IF NOT EXISTS trust_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'security',
  is_global BOOLEAN NOT NULL DEFAULT false,
  question_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS trust_questionnaires_org_idx ON trust_questionnaires(organization_id);
CREATE INDEX IF NOT EXISTS trust_questionnaires_global_idx ON trust_questionnaires(is_global);

-- trust_answers: an org's completed answers to a questionnaire
CREATE TABLE IF NOT EXISTS trust_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trust_profile_id UUID NOT NULL REFERENCES trust_profiles(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES trust_questionnaires(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  completion_percent INTEGER NOT NULL DEFAULT 0,
  visibility trust_visibility NOT NULL DEFAULT 'private',
  last_updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, questionnaire_id)
);
CREATE INDEX IF NOT EXISTS trust_answers_org_idx ON trust_answers(organization_id);
CREATE INDEX IF NOT EXISTS trust_answers_profile_idx ON trust_answers(trust_profile_id);
CREATE INDEX IF NOT EXISTS trust_answers_q_idx ON trust_answers(questionnaire_id);

-- trust_verifications: verification records for documents
CREATE TABLE IF NOT EXISTS trust_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_document_id UUID NOT NULL REFERENCES trust_documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  verification_level trust_verification_level NOT NULL DEFAULT 'customer_verified',
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verifier_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  verification_notes TEXT,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS trust_verifications_doc_idx ON trust_verifications(trust_document_id);
CREATE INDEX IF NOT EXISTS trust_verifications_org_idx ON trust_verifications(organization_id);

-- trust_badges: badges issued to orgs
CREATE TABLE IF NOT EXISTS trust_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trust_profile_id UUID NOT NULL REFERENCES trust_profiles(id) ON DELETE CASCADE,
  badge_type trust_badge_type NOT NULL DEFAULT 'audt_verified',
  label TEXT NOT NULL,
  description TEXT,
  issued_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS trust_badges_org_idx ON trust_badges(organization_id);
CREATE INDEX IF NOT EXISTS trust_badges_profile_idx ON trust_badges(trust_profile_id);
CREATE INDEX IF NOT EXISTS trust_badges_type_idx ON trust_badges(badge_type);
CREATE INDEX IF NOT EXISTS trust_badges_active_idx ON trust_badges(organization_id, is_active);

-- trust_relationships: org A (customer) ↔ org B (vendor) in the exchange
CREATE TABLE IF NOT EXISTS trust_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  relationship_type trust_relationship_type NOT NULL DEFAULT 'customer',
  status trust_relationship_status NOT NULL DEFAULT 'pending',
  initiated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_org_id, target_org_id)
);
CREATE INDEX IF NOT EXISTS trust_relationships_requester_idx ON trust_relationships(requester_org_id);
CREATE INDEX IF NOT EXISTS trust_relationships_target_idx ON trust_relationships(target_org_id);
CREATE INDEX IF NOT EXISTS trust_relationships_status_idx ON trust_relationships(status);

-- trust_activity: exchange activity log
CREATE TABLE IF NOT EXISTS trust_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  activity_type trust_activity_type NOT NULL,
  entity_id UUID,
  entity_type TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS trust_activity_org_idx ON trust_activity(organization_id);
CREATE INDEX IF NOT EXISTS trust_activity_actor_idx ON trust_activity(actor_id);
CREATE INDEX IF NOT EXISTS trust_activity_type_idx ON trust_activity(organization_id, activity_type);
CREATE INDEX IF NOT EXISTS trust_activity_created_idx ON trust_activity(organization_id, created_at DESC);

-- RLS
ALTER TABLE trust_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_activity ENABLE ROW LEVEL SECURITY;

-- RLS policies — org members can manage their own data
CREATE POLICY trust_profiles_org ON trust_profiles FOR ALL USING (is_org_member(organization_id));
CREATE POLICY trust_profiles_public ON trust_profiles FOR SELECT USING (is_published = true AND visibility = 'public');
CREATE POLICY trust_docs_org ON trust_documents FOR ALL USING (is_org_member(organization_id));
CREATE POLICY trust_shares_owner ON trust_shares FOR ALL USING (is_org_member(owner_org_id));
CREATE POLICY trust_shares_recipient ON trust_shares FOR SELECT USING (recipient_org_id IS NOT NULL AND is_org_member(recipient_org_id));
CREATE POLICY trust_questionnaires_own ON trust_questionnaires FOR ALL USING (organization_id IS NULL OR is_org_member(organization_id));
CREATE POLICY trust_questionnaires_global ON trust_questionnaires FOR SELECT USING (is_global = true);
CREATE POLICY trust_answers_org ON trust_answers FOR ALL USING (is_org_member(organization_id));
CREATE POLICY trust_verifications_org ON trust_verifications FOR ALL USING (is_org_member(organization_id));
CREATE POLICY trust_badges_org ON trust_badges FOR ALL USING (is_org_member(organization_id));
CREATE POLICY trust_relationships_req ON trust_relationships FOR ALL USING (is_org_member(requester_org_id) OR is_org_member(target_org_id));
CREATE POLICY trust_activity_org ON trust_activity FOR ALL USING (is_org_member(organization_id));
