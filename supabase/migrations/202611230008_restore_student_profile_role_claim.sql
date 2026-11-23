-- Resolve the role from trusted portal claims first, then the signed-in user's own profile.
-- SECURITY DEFINER executes as postgres, so reading profiles here does not recurse through RLS.
create or replace function private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, auth
as $function$
  select coalesce(
    nullif(auth.jwt()->'app_metadata'->>'portal_role', ''),
    (select p.role from public.profiles p where p.id = auth.uid())
  )
$function$;
