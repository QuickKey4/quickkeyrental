-- Documents lifecycle/storage hardening:
-- - extend existing public.documents table
-- - keep the customer-documents bucket private
-- - replace broad live policies with lifecycle-aware policies
-- - keep file_path as the canonical forward-going private storage reference

alter table public.documents
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size integer,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references public.profiles(id),
  add column if not exists deletion_due_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists deletion_reason text;

alter table public.documents
  alter column file_url set default '';

do $$
begin
  alter type public.document_type add value if not exists 'id_card';
exception
  when duplicate_object then null;
end;
$$;

update public.documents
set created_at = uploaded_at
where created_at is distinct from uploaded_at
  and uploaded_at is not null;

update public.documents
set file_name = coalesce(nullif(file_name, ''), 'Legacy document')
where file_name is null;

alter table public.documents
  alter column file_name set default 'Uploaded document';

do $$
begin
  alter type public.verification_status add value if not exists 'pending';
  alter type public.verification_status add value if not exists 'approved';
  alter type public.verification_status add value if not exists 'rejected';
exception
  when duplicate_object then null;
end;
$$;

create index if not exists idx_documents_cleanup_due
  on public.documents (deletion_due_at)
  where deleted_at is null and deletion_due_at is not null;

drop policy if exists documents_select_own on public.documents;
drop policy if exists documents_insert_own on public.documents;
drop policy if exists documents_update_own on public.documents;
drop policy if exists documents_delete_own on public.documents;
drop policy if exists "Users can read own documents" on public.documents;
drop policy if exists "Users can insert own documents" on public.documents;
drop policy if exists "Users can delete own pending documents" on public.documents;

create policy "Users can read own documents"
  on public.documents
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and deleted_at is null
  );

create policy "Users can insert own documents"
  on public.documents
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and coalesce(verification_status::text, 'pending') in ('pending', 'uploaded')
    and verified_at is null
    and verified_by is null
    and deleted_at is null
  );

create or replace function public.delete_own_pending_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document public.documents%rowtype;
begin
  select * into v_document
  from public.documents
  where id = p_document_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Document not found';
  end if;

  if v_document.deleted_at is not null then
    return;
  end if;

  if v_document.verification_status::text not in ('pending', 'uploaded')
    or v_document.verified_at is not null then
    raise exception 'Verified documents cannot be removed from the customer portal';
  end if;

  update public.documents
  set
    deleted_at = now(),
    deletion_due_at = now(),
    deletion_reason = 'user_removed_before_verification'
  where id = p_document_id;
end;
$$;

revoke execute on function public.delete_own_pending_document(uuid) from public;
grant execute on function public.delete_own_pending_document(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values ('customer-documents', 'customer-documents', false)
on conflict (id) do update set public = false;

drop policy if exists customer_documents_insert_own on storage.objects;
drop policy if exists customer_documents_select_own on storage.objects;
drop policy if exists customer_documents_update_own on storage.objects;
drop policy if exists customer_documents_delete_own on storage.objects;
drop policy if exists "Users can upload own customer documents" on storage.objects;
drop policy if exists "Users can read own customer documents" on storage.objects;
drop policy if exists "Users can delete own customer documents" on storage.objects;

create policy "Users can upload own customer documents"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'customer-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own customer documents"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'customer-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1
      from public.documents d
      where d.file_path = storage.objects.name
        and d.user_id = auth.uid()
        and d.deleted_at is null
    )
  );
