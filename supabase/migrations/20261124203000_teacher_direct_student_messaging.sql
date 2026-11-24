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
