-- Let the teacher open a private support conversation with any student.
-- Existing owner/student support conversation behavior is preserved.

create policy "emad_conversations_teacher_read_all_student_support"
on public.emad_conversations
for select
to authenticated
using (
  kind = 'support'
  and private.current_profile_role() = 'teacher'
  and exists (
    select 1 from public.profiles student
    where student.id = emad_conversations.created_by
      and student.role = 'student'
  )
);

create policy "emad_conversations_teacher_create_student_support"
on public.emad_conversations
for insert
to authenticated
with check (
  kind = 'support'
  and created_by is not null
  and private.current_profile_role() = 'teacher'
  and exists (
    select 1 from public.profiles student
    where student.id = emad_conversations.created_by
      and student.role = 'student'
  )
);

create policy "emad_members_teacher_join_any_student_support"
on public.emad_conversation_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and member_role = 'teacher'
  and left_at is null
  and private.current_profile_role() = 'teacher'
  and exists (
    select 1 from public.emad_conversations c
    join public.profiles student on student.id = c.created_by
    where c.id = emad_conversation_members.conversation_id
      and c.kind = 'support'
      and c.is_active = true
      and student.role = 'student'
  )
);

-- A limited directory for teacher-initiated chats. It intentionally excludes
-- phone numbers, parent contacts, and other private profile fields.
create or replace function private.emad_teacher_student_directory()
returns table (
  id uuid,
  full_name text,
  student_number bigint,
  grade text,
  group_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path to 'pg_catalog','public','auth','private'
as $function$
  select p.id,p.full_name,p.student_number,p.grade,p.group_name,p.avatar_url
  from public.profiles p
  where auth.uid() is not null
    and private.current_profile_role() = 'teacher'
    and p.role = 'student'
  order by p.full_name asc
  limit 2000;
$function$;

revoke all on function private.emad_teacher_student_directory() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.emad_teacher_student_directory() to authenticated;

create or replace function public.emad_teacher_student_directory()
returns table (
  id uuid,
  full_name text,
  student_number bigint,
  grade text,
  group_name text,
  avatar_url text
)
language sql
stable
security invoker
set search_path to 'pg_catalog','public','private'
as $function$
  select * from private.emad_teacher_student_directory();
$function$;

revoke all on function public.emad_teacher_student_directory() from public, anon;
grant execute on function public.emad_teacher_student_directory() to authenticated;
