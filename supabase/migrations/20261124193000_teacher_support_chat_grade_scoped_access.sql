-- Allow teachers to participate in student support conversations only for grades
-- covered by courses assigned to that teacher. Owner and student policies remain unchanged.

create policy "emad_conversations_teacher_read_grade_support"
on public.emad_conversations
for select
to authenticated
using (
  kind = 'support'
  and private.current_profile_role() = 'teacher'
  and exists (
    select 1
    from public.profiles student
    where student.id = emad_conversations.created_by
      and student.role = 'student'
      and private.teacher_can_access_grade(student.grade)
  )
);

create policy "emad_members_teacher_join_grade_support"
on public.emad_conversation_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and member_role = 'teacher'
  and left_at is null
  and private.current_profile_role() = 'teacher'
  and exists (
    select 1
    from public.emad_conversations c
    join public.profiles student on student.id = c.created_by
    where c.id = emad_conversation_members.conversation_id
      and c.kind = 'support'
      and c.is_active = true
      and student.role = 'student'
      and private.teacher_can_access_grade(student.grade)
  )
);

create policy "emad_messages_teacher_read_grade_support"
on public.emad_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.emad_conversations c
    join public.profiles student on student.id = c.created_by
    where c.id = emad_messages.conversation_id
      and c.kind = 'support'
      and c.is_active = true
      and student.role = 'student'
      and private.current_profile_role() = 'teacher'
      and private.teacher_can_access_grade(student.grade)
  )
);

create policy "emad_messages_teacher_send_grade_support"
on public.emad_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and private.current_profile_role() = 'teacher'
  and exists (
    select 1
    from public.emad_conversations c
    join public.profiles student on student.id = c.created_by
    where c.id = emad_messages.conversation_id
      and c.kind = 'support'
      and c.is_active = true
      and student.role = 'student'
      and private.teacher_can_access_grade(student.grade)
  )
);
