-- ============================================================
-- Risk Lens™ — Row-Level Security policies
-- Apply after migration 0009 is run:
--   node scripts/apply-sql.mjs supabase/rls-risk-lens.sql
-- ============================================================

-- risks -------------------------------------------------------
drop policy if exists "members read risks" on public.risks;
create policy "members read risks" on public.risks
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write risks" on public.risks;
create policy "members write risks" on public.risks
  for all using (public.has_org_role(organization_id, array['owner','admin','member','compliance_manager','security_manager','procurement_manager']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member','compliance_manager','security_manager','procurement_manager']::public.membership_role[]));

-- risk_reviews -----------------------------------------------
drop policy if exists "members read risk reviews" on public.risk_reviews;
create policy "members read risk reviews" on public.risk_reviews
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write risk reviews" on public.risk_reviews;
create policy "members write risk reviews" on public.risk_reviews
  for all using (public.has_org_role(organization_id, array['owner','admin','member','compliance_manager','security_manager','procurement_manager']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member','compliance_manager','security_manager','procurement_manager']::public.membership_role[]));

-- risk_treatments --------------------------------------------
drop policy if exists "members read risk treatments" on public.risk_treatments;
create policy "members read risk treatments" on public.risk_treatments
  for select using (public.is_org_member(organization_id));

drop policy if exists "members write risk treatments" on public.risk_treatments;
create policy "members write risk treatments" on public.risk_treatments
  for all using (public.has_org_role(organization_id, array['owner','admin','member','compliance_manager','security_manager','procurement_manager']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin','member','compliance_manager','security_manager','procurement_manager']::public.membership_role[]));

-- Junction tables (no organization_id — use risk's org via JOIN)
-- For simplicity, we allow org members to manage junction rows via application-layer auth
-- (server actions already enforce org membership via requireUser())

drop policy if exists "allow all risk_vendors" on public.risk_vendors;
create policy "allow all risk_vendors" on public.risk_vendors
  for all using (
    exists (select 1 from public.risks r where r.id = risk_id and public.is_org_member(r.organization_id))
  )
  with check (
    exists (select 1 from public.risks r where r.id = risk_id and public.is_org_member(r.organization_id))
  );

drop policy if exists "allow all risk_controls" on public.risk_controls;
create policy "allow all risk_controls" on public.risk_controls
  for all using (
    exists (select 1 from public.risks r where r.id = risk_id and public.is_org_member(r.organization_id))
  )
  with check (
    exists (select 1 from public.risks r where r.id = risk_id and public.is_org_member(r.organization_id))
  );

drop policy if exists "allow all risk_findings" on public.risk_findings;
create policy "allow all risk_findings" on public.risk_findings
  for all using (
    exists (select 1 from public.risks r where r.id = risk_id and public.is_org_member(r.organization_id))
  )
  with check (
    exists (select 1 from public.risks r where r.id = risk_id and public.is_org_member(r.organization_id))
  );

drop policy if exists "allow all risk_policies" on public.risk_policies;
create policy "allow all risk_policies" on public.risk_policies
  for all using (
    exists (select 1 from public.risks r where r.id = risk_id and public.is_org_member(r.organization_id))
  )
  with check (
    exists (select 1 from public.risks r where r.id = risk_id and public.is_org_member(r.organization_id))
  );

drop policy if exists "allow all risk_frameworks" on public.risk_frameworks;
create policy "allow all risk_frameworks" on public.risk_frameworks
  for all using (
    exists (select 1 from public.risks r where r.id = risk_id and public.is_org_member(r.organization_id))
  )
  with check (
    exists (select 1 from public.risks r where r.id = risk_id and public.is_org_member(r.organization_id))
  );

drop policy if exists "allow all risk_evidence" on public.risk_evidence;
create policy "allow all risk_evidence" on public.risk_evidence
  for all using (
    exists (select 1 from public.risks r where r.id = risk_id and public.is_org_member(r.organization_id))
  )
  with check (
    exists (select 1 from public.risks r where r.id = risk_id and public.is_org_member(r.organization_id))
  );
