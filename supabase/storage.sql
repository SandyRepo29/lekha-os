-- ============================================================
-- Lekha OS — Vendor documents storage bucket + RLS
-- Apply with: node scripts/apply-sql.mjs supabase/storage.sql
--
-- Path convention: {orgId}/{vendorId}/{timestamp}-{filename}
-- Access is scoped to org membership via the first path segment.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('vendor-documents', 'vendor-documents', false)
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
