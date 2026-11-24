-- Exact media duration metadata for Emad lessons; existing records remain valid.
alter table public.lessons
  add column if not exists duration_seconds integer;
