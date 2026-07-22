-- Customer-visible deleted document tombstones.
-- Keep the existing documents SELECT policy unchanged:
--   user_id = auth.uid() and deleted_at is null
-- Deleted document metadata is exposed only through this narrow RPC shape.

create or replace function public.get_my_deleted_document_tombstones()
returns table (
  document_id uuid,
  document_type public.document_type,
  verification_status public.verification_status,
  deleted_at timestamptz,
  uploaded_at timestamptz,
  file_name text
)
language sql
security definer
set search_path = public
as $$
  select
    d.id as document_id,
    d.document_type,
    d.verification_status,
    d.deleted_at,
    d.uploaded_at,
    d.file_name
  from public.documents d
  where auth.uid() is not null
    and d.user_id = auth.uid()
    and d.deleted_at is not null
  order by d.deleted_at desc;
$$;

revoke execute on function public.get_my_deleted_document_tombstones() from public;
revoke execute on function public.get_my_deleted_document_tombstones() from anon;
grant execute on function public.get_my_deleted_document_tombstones() to authenticated;
