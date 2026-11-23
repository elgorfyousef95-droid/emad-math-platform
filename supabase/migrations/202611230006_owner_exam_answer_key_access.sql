-- Allow the dedicated owner portal to maintain answer keys for exams.
drop policy if exists exam_answer_keys_owner_manage_all on public.exam_answer_keys;
create policy exam_answer_keys_owner_manage_all
on public.exam_answer_keys for all to authenticated
using ((select private.current_profile_role()) = 'owner')
with check ((select private.current_profile_role()) = 'owner');
