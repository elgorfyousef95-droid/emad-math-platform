-- Avoid recursive RLS evaluation by reading the trusted JWT app_metadata claim.
create or replace function private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, auth
as $function$
  select nullif(auth.jwt()->'app_metadata'->>'portal_role', '')
$function$;

-- Preserve the role claim for existing staff identities.
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('portal_role', p.role)
from public.profiles p
where p.id = u.id
  and p.role in ('owner','admin','teacher');
