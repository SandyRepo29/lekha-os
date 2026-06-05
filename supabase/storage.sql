-- ============================================================
-- Lekha OS — Storage buckets + RLS
-- Apply with: node scripts/apply-sql.mjs supabase/storage.sql
--
-- vendor-documents  (legacy)  — path: {orgId}/{vendorId}/{ts}-{filename}
-- compliance-documents (new)  — path: tenant_{orgId}/{category}/{id}/{ts}-{filename}
--
-- Both buckets are PRIVATE. All downloads require signed URLs.
-- ============================================================

-- Legacy bucket (keep for existing files)
insert into storage.buckets (id, name, public)
values ('vendor-documents', 'vendor-documents', false)
on conflict (id) do nothing;

-- New compliance bucket — all new uploads go here
insert into storage.buckets (id, name, public)
values ('compliance-documents', 'compliance-documents', false)
on conflict (id) do nothing;

drop policy if exists "org members read vendor docs" on storage.objects;
create policy "org members read vendor docs" on storage.objects
  for select using (
    bucket_id = 'vendor-documents'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "org members insert vendor docs" on storage.objects;
create policy "org members insert vendor docs" on storage.objects
  for insert with check (
    bucket_id = 'vendor-documents'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "org members delete vendor docs" on storage.objects;
create policy "org members delete vendor docs" on storage.objects
  for delete using (
    bucket_id = 'vendor-documents'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

-- ============================================================
-- compliance-documents RLS
-- Path: tenant_{orgId}/... — org ID extracted after "tenant_" prefix
-- ============================================================

drop policy if exists "org members read compliance docs" on storage.objects;
create policy "org members read compliance docs" on storage.objects
  for select using (
    bucket_id = 'compliance-documents'
    and public.is_org_member(
      (substring((storage.foldername(name))[1] from 8))::uuid
    )
  );

drop policy if exists "org members insert compliance docs" on storage.objects;
create policy "org members insert compliance docs" on storage.objects
  for insert with check (
    bucket_id = 'compliance-documents'
    and public.is_org_member(
      (substring((storage.foldername(name))[1] from 8))::uuid
    )
  );

drop policy if exists "org members delete compliance docs" on storage.objects;
create policy "org members delete compliance docs" on storage.objects
  for delete using (
    bucket_id = 'compliance-documents'
    and public.is_org_member(
      (substring((storage.foldername(name))[1] from 8))::uuid
    )
  );
