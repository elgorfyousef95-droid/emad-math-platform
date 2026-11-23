-- Teacher-only visibility for students in grades assigned to their courses.
-- Extend student support messages with a persisted staff reply.
alter table public.support_messages
  add column if not exists admin_reply text,
  add column if not exists replied_by uuid references auth.users(id) on delete set null,
  add column if not exists replied_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_teacher_read_assigned_students') then
    create policy profiles_teacher_read_assigned_students
      on public.profiles for select to authenticated
      using (
        role = 'student'
        and exists (
          select 1 from public.courses c
          where c.teacher_id = auth.uid() and c.grade = profiles.grade
        )
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='support_messages' and policyname='support_teacher_read_assigned_students') then
    create policy support_teacher_read_assigned_students
      on public.support_messages for select to authenticated
      using (
        exists (
          select 1 from public.profiles p
          join public.courses c on c.grade = p.grade
          where p.id = support_messages.user_id
            and p.role = 'student' and c.teacher_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='support_messages' and policyname='support_teacher_reply_assigned_students') then
    create policy support_teacher_reply_assigned_students
      on public.support_messages for update to authenticated
      using (
        exists (
          select 1 from public.profiles p
          join public.courses c on c.grade = p.grade
          where p.id = support_messages.user_id
            and p.role = 'student' and c.teacher_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.profiles p
          join public.courses c on c.grade = p.grade
          where p.id = support_messages.user_id
            and p.role = 'student' and c.teacher_id = auth.uid()
        )
      );
  end if;
end $$;
