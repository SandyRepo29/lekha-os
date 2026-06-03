-- ============================================================
-- Lekha OS — Row-Level Security, tenancy helpers & auth triggers
--
-- Apply this AFTER the Drizzle schema is in the database
-- (`npm run db:push`), via the Supabase SQL Editor or psql.
--
-- This is the core of Lekha's tenant isolation: every row is
-- scoped to an organization, and Postgres itself enforces that a
-- user can only touch rows for orgs they are a member of.
-- ============================================================

-- ---- Link profiles to Supabase auth users -------------------
alter table public.profiles
  drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users (id) on delete cascade;

-- ---- Tenancy helper: is the current user in this org? -------
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(org uuid, roles public.membership_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org
      and m.user_id = auth.uid()
      and m.role = any(roles)
  );
$$;

-- ---- Auto-provision a profile on signup ---------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Enable RLS + policies
-- ============================================================

-- organizations -----------------------------------------------
alter table public.organizations enable row level security;

drop policy if exists "members read org" on public.organizations;
create policy "members read org" on public.organizations
  for select using (public.is_org_member(id));

drop policy if exists "owners update org" on public.organizations;
create policy "owners update org" on public.organizations
  for update using (public.has_org_role(id, array['owner','admin']::public.membership_role[]));

-- profiles -----------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid());

-- memberships --------------------------------------------------
alter table public.memberships enable row level security;

drop policy if exists "read memberships in my orgs" on public.memberships;
create policy "read memberships in my orgs" on public.memberships
  for select using (user_id = auth.uid() or public.is_org_member(organization_id));

drop policy if exists "admins manage memberships" on public.memberships;
create policy "admins manage memberships" on public.memberships
  for all using (public.has_org_role(organization_id, array['owner','admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin']::public.membership_role[]));

-- Generic tenant tables: read for members, write for members ---
-- (Tighten write roles per-table as the product matures.)

-- vendors ------------------------------------------------------
alter table public.vendors enable row level security;

drop policy if exists "members read vendors" on public.vendors;
create policy "members read vendors" on public.vendors
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write vendors" on public.vendors;
create policy "members write vendors" on public.vendors
  for all using (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]));

-- vendor_documents ---------------------------------------------
alter table public.vendor_documents enable row level security;

drop policy if exists "members read vendor docs" on public.vendor_documents;
create policy "members read vendor docs" on public.vendor_documents
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write vendor docs" on public.vendor_documents;
create policy "members write vendor docs" on public.vendor_documents
  for all using (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]));

-- audit_logs (append-only; readable by members) ----------------
alter table public.audit_logs enable row level security;

drop policy if exists "members read audit" on public.audit_logs;
create policy "members read audit" on public.audit_logs
  for select using (public.is_org_member(organization_id));

drop policy if exists "members append audit" on public.audit_logs;
create policy "members append audit" on public.audit_logs
  for insert with check (public.is_org_member(organization_id));

-- ============================================================
-- Compliance Module RLS
-- ============================================================

-- frameworks --------------------------------------------------
alter table public.frameworks enable row level security;

drop policy if exists "members read frameworks" on public.frameworks;
create policy "members read frameworks" on public.frameworks
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write frameworks" on public.frameworks;
create policy "members write frameworks" on public.frameworks
  for all using (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]));

-- controls ----------------------------------------------------
alter table public.controls enable row level security;

drop policy if exists "members read controls" on public.controls;
create policy "members read controls" on public.controls
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write controls" on public.controls;
create policy "members write controls" on public.controls
  for all using (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]));

-- evidence ----------------------------------------------------
alter table public.evidence enable row level security;

drop policy if exists "members read evidence" on public.evidence;
create policy "members read evidence" on public.evidence
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write evidence" on public.evidence;
create policy "members write evidence" on public.evidence
  for all using (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]));

-- policies ----------------------------------------------------
alter table public.policies enable row level security;

drop policy if exists "members read policies" on public.policies;
create policy "members read policies" on public.policies
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write policies" on public.policies;
create policy "members write policies" on public.policies
  for all using (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]));

-- readiness_scores (written by service, readable by all members) --
alter table public.readiness_scores enable row level security;

drop policy if exists "members read readiness" on public.readiness_scores;
create policy "members read readiness" on public.readiness_scores
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write readiness" on public.readiness_scores;
create policy "members write readiness" on public.readiness_scores
  for all using (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]));

-- gap_analysis ------------------------------------------------
alter table public.gap_analysis enable row level security;

drop policy if exists "members read gaps" on public.gap_analysis;
create policy "members read gaps" on public.gap_analysis
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write gaps" on public.gap_analysis;
create policy "members write gaps" on public.gap_analysis
  for all using (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]));

-- compliance_reports ------------------------------------------
alter table public.compliance_reports enable row level security;

drop policy if exists "members read compliance reports" on public.compliance_reports;
create policy "members read compliance reports" on public.compliance_reports
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write compliance reports" on public.compliance_reports;
create policy "members write compliance reports" on public.compliance_reports
  for all using (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]));

-- ai_compliance_insights --------------------------------------
alter table public.ai_compliance_insights enable row level security;

drop policy if exists "members read ai compliance insights" on public.ai_compliance_insights;
create policy "members read ai compliance insights" on public.ai_compliance_insights
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write ai compliance insights" on public.ai_compliance_insights;
create policy "members write ai compliance insights" on public.ai_compliance_insights
  for all using (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member']::public.membership_role[]));
