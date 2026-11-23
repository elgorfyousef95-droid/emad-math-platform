-- Avoid RLS policy cycles between profiles and courses/support_messages.
create or replace function private.teacher_can_access_grade(p_grade text)
returns boolean language sql stable security definer
set search_path = pg_catalog, public, auth
as $function$
  select exists (
    select 1 from public.courses c
    where c.teacher_id = auth.uid() and c.grade = p_grade
  )
$function$;

create or replace function private.teacher_can_access_student(p_student_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public, auth
as $function$
  select exists (
    select 1 from public.profiles p
    join public.courses c on c.grade = p.grade
    where p.id = p_student_id and p.role = 'student' and c.teacher_id = auth.uid()
  )
$function$;

drop policy if exists profiles_teacher_read_assigned_students on public.profiles;
create policy profiles_teacher_read_assigned_students
on public.profiles for select to authenticated
using (role = 'student' and private.teacher_can_access_grade(grade));

drop policy if exists support_teacher_read_assigned_students on public.support_messages;
create policy support_teacher_read_assigned_students
on public.support_messages for select to authenticated
using (private.teacher_can_access_student(user_id));

drop policy if exists support_teacher_reply_assigned_students on public.support_messages;
create policy support_teacher_reply_assigned_students
on public.support_messages for update to authenticated
using (private.teacher_can_access_student(user_id))
with check (private.teacher_can_access_student(user_id));
