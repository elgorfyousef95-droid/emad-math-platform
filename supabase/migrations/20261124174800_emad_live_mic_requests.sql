create table if not exists public.emad_live_mic_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.emad_teacher_live_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested','approved','rejected','removed','cancelled')),
  mic_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (session_id, student_id)
);

alter table public.emad_live_mic_requests enable row level security;
revoke all on public.emad_live_mic_requests from anon;
grant select, insert, update, delete on public.emad_live_mic_requests to authenticated;

drop policy if exists emad_live_mic_student_read_own on public.emad_live_mic_requests;
create policy emad_live_mic_student_read_own
on public.emad_live_mic_requests for select to authenticated
using (student_id = auth.uid() and private.current_profile_role() = 'student');

drop policy if exists emad_live_mic_student_insert_own on public.emad_live_mic_requests;
create policy emad_live_mic_student_insert_own
on public.emad_live_mic_requests for insert to authenticated
with check (
  student_id = auth.uid()
  and status = 'requested'
  and mic_enabled = false
  and private.current_profile_role() = 'student'
  and exists (
    select 1 from public.emad_teacher_live_sessions s
    join public.profiles p on p.id = auth.uid()
    where s.id = session_id and s.status = 'live' and s.grade = p.grade
  )
);

drop policy if exists emad_live_mic_student_cancel_own on public.emad_live_mic_requests;
create policy emad_live_mic_student_cancel_own
on public.emad_live_mic_requests for update to authenticated
using (
  student_id = auth.uid()
  and private.current_profile_role() = 'student'
  and status in ('requested','rejected','cancelled')
)
with check (
  student_id = auth.uid()
  and private.current_profile_role() = 'student'
  and status = 'cancelled'
  and mic_enabled = false
);

drop policy if exists emad_live_mic_student_delete_own on public.emad_live_mic_requests;
create policy emad_live_mic_student_delete_own
on public.emad_live_mic_requests for delete to authenticated
using (student_id = auth.uid() and private.current_profile_role() = 'student' and status in ('requested','rejected','removed','cancelled'));

drop policy if exists emad_live_mic_teacher_read_own_sessions on public.emad_live_mic_requests;
create policy emad_live_mic_teacher_read_own_sessions
on public.emad_live_mic_requests for select to authenticated
using (
  private.current_profile_role() = 'teacher'
  and exists (
    select 1 from public.emad_teacher_live_sessions s
    where s.id = session_id and s.teacher_id = auth.uid()
  )
);

drop policy if exists emad_live_mic_teacher_update_own_sessions on public.emad_live_mic_requests;
create policy emad_live_mic_teacher_update_own_sessions
on public.emad_live_mic_requests for update to authenticated
using (
  private.current_profile_role() = 'teacher'
  and exists (
    select 1 from public.emad_teacher_live_sessions s
    where s.id = session_id and s.teacher_id = auth.uid()
  )
)
with check (
  private.current_profile_role() = 'teacher'
  and status in ('approved','rejected','removed','requested')
  and mic_enabled = (status = 'approved')
  and exists (
    select 1 from public.emad_teacher_live_sessions s
    where s.id = session_id and s.teacher_id = auth.uid()
  )
);

drop policy if exists emad_live_mic_owner_all on public.emad_live_mic_requests;
create policy emad_live_mic_owner_all
on public.emad_live_mic_requests for all to authenticated
using (private.current_profile_role() = 'owner')
with check (private.current_profile_role() = 'owner');
