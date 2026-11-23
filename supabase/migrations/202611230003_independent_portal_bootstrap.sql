-- One-time bootstrap credential is stored only as a digest in a private schema.
create table if not exists private.emad_portal_bootstrap (
  id boolean primary key default true check (id = true),
  token_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);
revoke all on private.emad_portal_bootstrap from public, anon, authenticated, service_role;

insert into private.emad_portal_bootstrap(id, token_hash, expires_at, consumed_at)
values (true, 'ae449be58af5fc63c6187c9d74a17ef2', now() + interval '7 days', null)
on conflict (id) do update
set token_hash=excluded.token_hash, expires_at=excluded.expires_at, consumed_at=null;

create or replace function public.validate_emad_portal_bootstrap(p_token text)
returns boolean
language sql
security definer
set search_path = pg_catalog, private
as $function$
  select exists (
    select 1 from private.emad_portal_bootstrap
    where id = true and token_hash = md5(coalesce(p_token,''))
      and consumed_at is null and expires_at > now()
  )
$function$;

create or replace function public.consume_emad_portal_bootstrap(p_token text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, private
as $function$
begin
  update private.emad_portal_bootstrap
  set consumed_at = now()
  where id = true and token_hash = md5(coalesce(p_token,''))
    and consumed_at is null and expires_at > now();
  return found;
end
$function$;

revoke all on function public.validate_emad_portal_bootstrap(text) from public, anon, authenticated;
revoke all on function public.consume_emad_portal_bootstrap(text) from public, anon, authenticated;
grant execute on function public.validate_emad_portal_bootstrap(text) to service_role;
grant execute on function public.consume_emad_portal_bootstrap(text) to service_role;
