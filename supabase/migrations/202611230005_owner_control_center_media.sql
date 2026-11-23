-- Owner control-center permissions and learning media metadata.
-- This migration touches only the Emad education tables and the dedicated media bucket.

alter table public.courses add column if not exists cover_image_url text;
alter table public.lessons add column if not exists cover_image_url text;
alter table public.exams add column if not exists cover_image_url text;
alter table public.homework_assignments add column if not exists cover_image_url text;
alter table public.announcements add column if not exists cover_image_url text;
alter table public.emad_subscription_codes add column if not exists code_hint text;

-- Keep only a harmless suffix for code inventory; the complete code remains one-time visible.
create or replace function public.emad_issue_subscription_code(p_grade text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_uid uuid := auth.uid();
  v_code text;
begin
  if v_uid is null or not exists (
    select 1 from public.profiles
    where id = v_uid and role in ('admin','owner')
  ) then
    raise exception 'not_authorized';
  end if;
  if p_grade not in ('الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي') then
    raise exception 'invalid_grade';
  end if;
  v_code := 'EMAD-' || upper(encode(extensions.gen_random_bytes(4),'hex')) || '-' || upper(encode(extensions.gen_random_bytes(4),'hex'));
  insert into public.emad_subscription_codes(code_hash,grade,created_by,code_hint)
  values(encode(extensions.digest(v_code,'sha256'),'hex'),p_grade,v_uid,right(v_code,4));
  return v_code;
end;
$function$;

-- Owner-only access to subscription lifecycle and code inventory.
drop policy if exists emad_subscriptions_owner_manage_all on public.emad_student_subscriptions;
create policy emad_subscriptions_owner_manage_all
on public.emad_student_subscriptions for all to authenticated
using ((select private.current_profile_role()) = 'owner')
with check ((select private.current_profile_role()) = 'owner');

drop policy if exists emad_subscription_codes_owner_manage_all on public.emad_subscription_codes;
create policy emad_subscription_codes_owner_manage_all
on public.emad_subscription_codes for all to authenticated
using ((select private.current_profile_role()) = 'owner')
with check ((select private.current_profile_role()) = 'owner');

drop policy if exists payments_owner_manage_all on public.payments;
create policy payments_owner_manage_all
on public.payments for all to authenticated
using ((select private.current_profile_role()) = 'owner')
with check ((select private.current_profile_role()) = 'owner');

-- Owner overview and student progress.
drop policy if exists exam_attempts_owner_read_all on public.exam_attempts;
create policy exam_attempts_owner_read_all
on public.exam_attempts for select to authenticated
using ((select private.current_profile_role()) = 'owner');

drop policy if exists exam_answers_owner_read_all on public.exam_answers;
create policy exam_answers_owner_read_all
on public.exam_answers for select to authenticated
using ((select private.current_profile_role()) = 'owner');

drop policy if exists lesson_progress_owner_read_all on public.lesson_progress;
create policy lesson_progress_owner_read_all
on public.lesson_progress for select to authenticated
using ((select private.current_profile_role()) = 'owner');

drop policy if exists attendance_owner_manage_all on public.attendance;
create policy attendance_owner_manage_all
on public.attendance for all to authenticated
using ((select private.current_profile_role()) = 'owner')
with check ((select private.current_profile_role()) = 'owner');

drop policy if exists enrollments_owner_manage_all on public.enrollments;
create policy enrollments_owner_manage_all
on public.enrollments for all to authenticated
using ((select private.current_profile_role()) = 'owner')
with check ((select private.current_profile_role()) = 'owner');

drop policy if exists notifications_owner_manage_all on public.emad_notifications;
create policy notifications_owner_manage_all
on public.emad_notifications for all to authenticated
using ((select private.current_profile_role()) = 'owner')
with check ((select private.current_profile_role()) = 'owner');

drop policy if exists homework_assignments_owner_manage_all on public.homework_assignments;
create policy homework_assignments_owner_manage_all
on public.homework_assignments for all to authenticated
using ((select private.current_profile_role()) = 'owner')
with check ((select private.current_profile_role()) = 'owner');

-- Dedicated public bucket for course, lesson, exam, homework and announcement cover images.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('emad-learning-media','emad-learning-media',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public=true,
  file_size_limit=5242880,
  allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists emad_learning_media_public_read on storage.objects;
create policy emad_learning_media_public_read
on storage.objects for select to public
using (bucket_id='emad-learning-media');

drop policy if exists emad_learning_media_staff_insert on storage.objects;
create policy emad_learning_media_staff_insert
on storage.objects for insert to authenticated
with check (
  bucket_id='emad-learning-media'
  and (
    (select private.current_profile_role())='owner'
    or (
      (select private.current_profile_role())='teacher'
      and (storage.foldername(name))[1]='teacher'
      and (storage.foldername(name))[2]=(select auth.uid())::text
    )
  )
);

drop policy if exists emad_learning_media_staff_update on storage.objects;
create policy emad_learning_media_staff_update
on storage.objects for update to authenticated
using (
  bucket_id='emad-learning-media'
  and (
    (select private.current_profile_role())='owner'
    or (
      (select private.current_profile_role())='teacher'
      and (storage.foldername(name))[1]='teacher'
      and (storage.foldername(name))[2]=(select auth.uid())::text
    )
  )
)
with check (
  bucket_id='emad-learning-media'
  and (
    (select private.current_profile_role())='owner'
    or (
      (select private.current_profile_role())='teacher'
      and (storage.foldername(name))[1]='teacher'
      and (storage.foldername(name))[2]=(select auth.uid())::text
    )
  )
);

drop policy if exists emad_learning_media_staff_delete on storage.objects;
create policy emad_learning_media_staff_delete
on storage.objects for delete to authenticated
using (
  bucket_id='emad-learning-media'
  and (
    (select private.current_profile_role())='owner'
    or (
      (select private.current_profile_role())='teacher'
      and (storage.foldername(name))[1]='teacher'
      and (storage.foldername(name))[2]=(select auth.uid())::text
    )
  )
);
