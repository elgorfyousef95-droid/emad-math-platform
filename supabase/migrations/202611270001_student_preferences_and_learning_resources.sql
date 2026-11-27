-- Student settings, protected learning-resource library, and self-owned avatar uploads
create table if not exists public.student_preferences (user_id uuid primary key references public.profiles(id) on delete cascade,theme text not null default 'dark' check(theme in ('dark','light','system')),autoplay boolean not null default false,playback_speed numeric(3,2) not null default 1.00 check(playback_speed between 0.5 and 2.0),notifications jsonb not null default '{"platform":true,"homework":true,"exams":true,"messages":true}'::jsonb,updated_at timestamptz not null default now());
alter table public.student_preferences add column if not exists reduce_motion boolean not null default false;
alter table public.student_preferences add column if not exists data_saver boolean not null default false;
alter table public.student_preferences add column if not exists compact_layout boolean not null default false;
alter table public.student_preferences add column if not exists content_scale numeric(3,2) not null default 1.00 check(content_scale between 0.90 and 1.20);

alter table public.student_preferences enable row level security;
drop policy if exists student_preferences_read_self on public.student_preferences;
create policy student_preferences_read_self on public.student_preferences for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists student_preferences_insert_self on public.student_preferences;
create policy student_preferences_insert_self on public.student_preferences for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists student_preferences_update_self on public.student_preferences;
create policy student_preferences_update_self on public.student_preferences for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select,insert,update on public.student_preferences to authenticated;
create table if not exists public.learning_resources (id uuid primary key default gen_random_uuid(),course_id uuid references public.courses(id) on delete set null,grade text not null,title text not null,description text not null default '',file_path text not null unique,file_name text not null,mime_type text not null,file_size bigint not null default 0 check(file_size>=0),is_published boolean not null default false,created_by uuid not null references public.profiles(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index if not exists learning_resources_grade_published_idx on public.learning_resources(grade,is_published,created_at desc);
create index if not exists learning_resources_creator_idx on public.learning_resources(created_by,created_at desc);
alter table public.learning_resources enable row level security;
drop policy if exists learning_resources_student_read on public.learning_resources;
create policy learning_resources_student_read on public.learning_resources for select to authenticated using(is_published=true and exists(select 1 from public.profiles p join public.emad_student_subscriptions s on s.student_id=p.id and s.grade=p.grade and s.ends_at>now() where p.id=(select auth.uid()) and p.role='student' and p.grade=learning_resources.grade));
drop policy if exists learning_resources_teacher_read on public.learning_resources;
create policy learning_resources_teacher_read on public.learning_resources for select to authenticated using((select private.current_profile_role())='owner' or (created_by=(select auth.uid()) and (select private.current_profile_role())='teacher'));
drop policy if exists learning_resources_staff_insert on public.learning_resources;
create policy learning_resources_staff_insert on public.learning_resources for insert to authenticated with check(created_by=(select auth.uid()) and ((select private.current_profile_role())='owner' or ((select private.current_profile_role())='teacher' and private.teacher_can_access_grade(grade))));
drop policy if exists learning_resources_staff_update on public.learning_resources;
create policy learning_resources_staff_update on public.learning_resources for update to authenticated using((select private.current_profile_role())='owner' or (created_by=(select auth.uid()) and (select private.current_profile_role())='teacher')) with check((select private.current_profile_role())='owner' or (created_by=(select auth.uid()) and (select private.current_profile_role())='teacher' and private.teacher_can_access_grade(grade)));
drop policy if exists learning_resources_staff_delete on public.learning_resources;
create policy learning_resources_staff_delete on public.learning_resources for delete to authenticated using((select private.current_profile_role())='owner' or (created_by=(select auth.uid()) and (select private.current_profile_role())='teacher'));
grant select,insert,update,delete on public.learning_resources to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('emad-learning-files','emad-learning-files',false,104857600,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain','image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=104857600,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists emad_learning_files_staff_insert on storage.objects;
create policy emad_learning_files_staff_insert on storage.objects for insert to authenticated with check(bucket_id='emad-learning-files' and ((select private.current_profile_role())='owner' or ((select private.current_profile_role())='teacher' and (storage.foldername(name))[1]='teacher' and (storage.foldername(name))[2]=(select auth.uid())::text)));
drop policy if exists emad_learning_files_staff_read on storage.objects;
create policy emad_learning_files_staff_read on storage.objects for select to authenticated using(bucket_id='emad-learning-files' and ((select private.current_profile_role())='owner' or ((select private.current_profile_role())='teacher' and (storage.foldername(name))[1]='teacher' and (storage.foldername(name))[2]=(select auth.uid())::text) or exists(select 1 from public.learning_resources r join public.profiles p on p.id=(select auth.uid()) join public.emad_student_subscriptions s on s.student_id=p.id and s.grade=p.grade and s.ends_at>now() where r.file_path=storage.objects.name and r.is_published=true and p.role='student' and p.grade=r.grade)));
drop policy if exists emad_learning_files_staff_delete on storage.objects;
create policy emad_learning_files_staff_delete on storage.objects for delete to authenticated using(bucket_id='emad-learning-files' and ((select private.current_profile_role())='owner' or ((select private.current_profile_role())='teacher' and (storage.foldername(name))[1]='teacher' and (storage.foldername(name))[2]=(select auth.uid())::text)));
drop policy if exists emad_student_avatar_insert_self on storage.objects;
create policy emad_student_avatar_insert_self on storage.objects for insert to authenticated with check(bucket_id='emad-student-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists emad_student_avatar_update_self on storage.objects;
create policy emad_student_avatar_update_self on storage.objects for update to authenticated using(bucket_id='emad-student-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='emad-student-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists emad_student_avatar_delete_self on storage.objects;
create policy emad_student_avatar_delete_self on storage.objects for delete to authenticated using(bucket_id='emad-student-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);


-- Owner-managed platform settings. Only non-secret operational settings are public-readable.
create table if not exists public.platform_settings (id smallint primary key default 1 check(id=1),platform_name text not null default 'أكاديمية عماد السنافيري',maintenance_mode boolean not null default false,student_registration_enabled boolean not null default true,support_enabled boolean not null default true,default_video_speed numeric(3,2) not null default 1.00 check(default_video_speed between 0.5 and 2.0),maintenance_message text not null default 'نعمل حاليًا على تحسين المنصة. سنعود للعمل قريبًا.',updated_by uuid references public.profiles(id),updated_at timestamptz not null default now());
insert into public.platform_settings(id) values(1) on conflict(id) do nothing;
alter table public.platform_settings enable row level security;
drop policy if exists platform_settings_public_read on public.platform_settings;
create policy platform_settings_public_read on public.platform_settings for select to anon,authenticated using(true);
drop policy if exists platform_settings_owner_manage_all on public.platform_settings;
create policy platform_settings_owner_manage_all on public.platform_settings for all to authenticated using((select private.current_profile_role())='owner') with check((select private.current_profile_role())='owner');
grant select on public.platform_settings to anon,authenticated;
grant insert,update,delete on public.platform_settings to authenticated;
