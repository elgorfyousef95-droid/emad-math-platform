-- Emad platform communication hub. Isolated from the unrelated nova_* schema.
create table if not exists public.emad_conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('grade_group','support','direct')),
  title text not null,
  grade text,
  created_by uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint emad_conversations_grade_check check (
    grade is null or grade in ('الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي')
  )
);
create unique index if not exists emad_one_group_per_grade
  on public.emad_conversations(grade) where kind='grade_group';
create unique index if not exists emad_one_support_thread_per_student
  on public.emad_conversations(created_by) where kind='support' and created_by is not null;

create table if not exists public.emad_conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.emad_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'student' check (member_role in ('owner','teacher','student')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  is_pinned boolean not null default false,
  pinned_at timestamptz,
  left_at timestamptz,
  unique(conversation_id,user_id)
);
create index if not exists emad_conversation_members_user_idx
  on public.emad_conversation_members(user_id, left_at, conversation_id);

create table if not exists public.emad_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.emad_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  message_type text not null default 'text' check (message_type in ('text','image','file','system')),
  body text not null default '',
  attachment_path text,
  attachment_name text,
  attachment_mime text,
  attachment_size bigint,
  reply_to uuid references public.emad_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint emad_messages_body_or_attachment check (length(trim(body)) > 0 or attachment_path is not null)
);
create index if not exists emad_messages_conversation_created_idx
  on public.emad_messages(conversation_id, created_at desc);

create table if not exists public.emad_message_receipts (
  message_id uuid not null references public.emad_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  delivered_at timestamptz not null default now(),
  read_at timestamptz,
  primary key(message_id,user_id)
);
create index if not exists emad_message_receipts_user_idx
  on public.emad_message_receipts(user_id, read_at);

create or replace function private.emad_chat_can_access_conversation(p_conversation_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public, auth, private
as $$
  select auth.uid() is not null and (
    private.current_profile_role() in ('owner','admin')
    or exists (
      select 1 from public.emad_conversation_members m
      where m.conversation_id=p_conversation_id
        and m.user_id=auth.uid() and m.left_at is null
    )
  );
$$;

create or replace function private.emad_chat_is_owner()
returns boolean language sql stable security definer
set search_path = pg_catalog, public, auth, private
as $$
  select auth.uid() is not null and private.current_profile_role() in ('owner','admin');
$$;

create or replace function private.emad_chat_sync_profile_memberships()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, auth, private
as $$
declare
  g record;
  role_value text;
begin
  role_value := coalesce(new.role,'student');
  if role_value='student' then
    update public.emad_conversation_members m
      set left_at=now()
      from public.emad_conversations c
      where m.conversation_id=c.id and m.user_id=new.id
        and c.kind='grade_group' and c.grade is distinct from new.grade
        and m.left_at is null;
    if new.grade is not null then
      insert into public.emad_conversation_members(conversation_id,user_id,member_role)
      select c.id,new.id,'student' from public.emad_conversations c
      where c.kind='grade_group' and c.grade=new.grade
      on conflict(conversation_id,user_id) do update
        set left_at=null, member_role='student';
    end if;
  elsif role_value in ('owner','admin','teacher') then
    for g in select id from public.emad_conversations where kind='grade_group' loop
      insert into public.emad_conversation_members(conversation_id,user_id,member_role)
      values(g.id,new.id,case when role_value in ('owner','admin') then 'owner' else 'teacher' end)
      on conflict(conversation_id,user_id) do update
        set left_at=null,member_role=excluded.member_role;
    end loop;
  else
    update public.emad_conversation_members set left_at=now()
      where user_id=new.id and left_at is null;
  end if;
  return new;
end;
$$;

create or replace function private.emad_chat_add_support_owners()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, auth, private
as $
begin
  if new.kind='support' then
    if new.created_by is not null then
      insert into public.emad_conversation_members(conversation_id,user_id,member_role)
      values(new.id,new.created_by,'student')
      on conflict(conversation_id,user_id) do nothing;
    end if;
    insert into public.emad_conversation_members(conversation_id,user_id,member_role)
    select new.id,p.id,'owner' from public.profiles p where p.role in ('owner','admin')
    on conflict(conversation_id,user_id) do nothing;
  end if;
  return new;
end;
$;

create or replace function private.emad_chat_add_course_teacher()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, auth, private
as $$
declare group_id uuid;
begin
  select id into group_id from public.emad_conversations
    where kind='grade_group' and grade=new.grade;
  if group_id is not null then
    insert into public.emad_conversation_members(conversation_id,user_id,member_role)
    values(group_id,new.teacher_id,'teacher')
    on conflict(conversation_id,user_id) do update set left_at=null,member_role='teacher';
  end if;
  return new;
end;
$$;

create or replace function private.emad_chat_after_message()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, auth, private
as $
declare c record; conversation_kind text;
begin
  insert into public.emad_message_receipts(message_id,user_id)
  select new.id,m.user_id from public.emad_conversation_members m
  where m.conversation_id=new.conversation_id and m.user_id<>new.sender_id and m.left_at is null
  on conflict(message_id,user_id) do nothing;

  update public.emad_conversations set updated_at=new.created_at
    where id=new.conversation_id
    returning kind into conversation_kind;

  for c in
    select m.user_id from public.emad_conversation_members m
    where m.conversation_id=new.conversation_id and m.user_id<>new.sender_id and m.left_at is null
  loop
    insert into public.emad_notifications(recipient_id,notification_type,title,body,action_url,metadata)
    values(c.user_id,case when conversation_kind='support' then 'support' else 'general' end,'رسالة جديدة',
      case when new.message_type='image' then 'أرسل صورة جديدة'
           when new.message_type='file' then 'أرسل ملفًا جديدًا'
           else coalesce(nullif(left(trim(new.body),180),''),'أرسل مرفقًا جديدًا') end,
      case when conversation_kind='support' then '/messages' else '/groups' end,
      jsonb_build_object('conversation_id',new.conversation_id,'message_id',new.id));
  end loop;
  return new;
end;
$;

drop trigger if exists emad_chat_profile_memberships on public.profiles;
create trigger emad_chat_profile_memberships
after insert or update of role,grade on public.profiles
for each row execute function private.emad_chat_sync_profile_memberships();

drop trigger if exists emad_chat_support_owners on public.emad_conversations;
create trigger emad_chat_support_owners
after insert on public.emad_conversations
for each row execute function private.emad_chat_add_support_owners();

drop trigger if exists emad_chat_course_teacher on public.courses;
create trigger emad_chat_course_teacher
after insert or update of teacher_id,grade on public.courses
for each row execute function private.emad_chat_add_course_teacher();

drop trigger if exists emad_chat_message_after_insert on public.emad_messages;
create trigger emad_chat_message_after_insert
after insert on public.emad_messages
for each row execute function private.emad_chat_after_message();

insert into public.emad_conversations(kind,title,grade)
values
 ('grade_group','جروب الصف الأول الثانوي','الصف الأول الثانوي'),
 ('grade_group','جروب الصف الثاني الثانوي','الصف الثاني الثانوي'),
 ('grade_group','جروب الصف الثالث الثانوي','الصف الثالث الثانوي')
on conflict do nothing;

insert into public.emad_conversation_members(conversation_id,user_id,member_role)
select c.id,p.id,
  case when p.role in ('owner','admin') then 'owner'
       when p.role='teacher' then 'teacher' else 'student' end
from public.emad_conversations c
join public.profiles p on
  (p.role in ('owner','admin','teacher'))
  or (p.role='student' and p.grade=c.grade)
where c.kind='grade_group'
on conflict(conversation_id,user_id) do update
set left_at=null,member_role=excluded.member_role;

alter table public.emad_conversations enable row level security;
alter table public.emad_conversation_members enable row level security;
alter table public.emad_messages enable row level security;
alter table public.emad_message_receipts enable row level security;

grant select,insert,update,delete on public.emad_conversations to authenticated;
grant select,insert,update,delete on public.emad_conversation_members to authenticated;
grant select,insert,update,delete on public.emad_messages to authenticated;
grant select,insert,update,delete on public.emad_message_receipts to authenticated;
grant usage on schema private to authenticated;
grant execute on function private.emad_chat_can_access_conversation(uuid) to authenticated;
grant execute on function private.emad_chat_is_owner() to authenticated;

drop policy if exists emad_conversations_read on public.emad_conversations;
create policy emad_conversations_read on public.emad_conversations
for select to authenticated
using (private.emad_chat_can_access_conversation(id));

drop policy if exists emad_conversations_create_support on public.emad_conversations;
create policy emad_conversations_create_support on public.emad_conversations
for insert to authenticated
with check (
  kind='support' and created_by=auth.uid()
  and private.current_profile_role()='student'
);

drop policy if exists emad_conversations_owner_manage on public.emad_conversations;
create policy emad_conversations_owner_manage on public.emad_conversations
for all to authenticated
using (private.emad_chat_is_owner())
with check (private.emad_chat_is_owner());

drop policy if exists emad_members_read on public.emad_conversation_members;
create policy emad_members_read on public.emad_conversation_members
for select to authenticated
using (user_id=auth.uid() or private.emad_chat_can_access_conversation(conversation_id));

drop policy if exists emad_members_join_grade_group on public.emad_conversation_members;
create policy emad_members_join_grade_group on public.emad_conversation_members
for insert to authenticated
with check (
  user_id=auth.uid() and exists (
    select 1 from public.emad_conversations c
    join public.profiles p on p.id=auth.uid()
    where c.id=conversation_id and c.kind='grade_group'
      and ((p.role='student' and p.grade=c.grade)
        or (p.role='teacher' and private.teacher_can_access_grade(c.grade)))
  )
);

drop policy if exists emad_members_update_self on public.emad_conversation_members;
create policy emad_members_update_self on public.emad_conversation_members
for update to authenticated
using (user_id=auth.uid() or private.emad_chat_is_owner())
with check (user_id=auth.uid() or private.emad_chat_is_owner());

drop policy if exists emad_members_owner_manage on public.emad_conversation_members;
create policy emad_members_owner_manage on public.emad_conversation_members
for all to authenticated
using (private.emad_chat_is_owner())
with check (private.emad_chat_is_owner());

drop policy if exists emad_messages_read on public.emad_messages;
create policy emad_messages_read on public.emad_messages
for select to authenticated
using (private.emad_chat_can_access_conversation(conversation_id));

drop policy if exists emad_messages_send on public.emad_messages;
create policy emad_messages_send on public.emad_messages
for insert to authenticated
with check (
  sender_id=auth.uid()
  and private.emad_chat_can_access_conversation(conversation_id)
);

drop policy if exists emad_messages_edit_own on public.emad_messages;
create policy emad_messages_edit_own on public.emad_messages
for update to authenticated
using (sender_id=auth.uid() and private.emad_chat_can_access_conversation(conversation_id))
with check (sender_id=auth.uid() and private.emad_chat_can_access_conversation(conversation_id));

drop policy if exists emad_messages_delete_own_or_owner on public.emad_messages;
create policy emad_messages_delete_own_or_owner on public.emad_messages
for delete to authenticated
using ((sender_id=auth.uid() and private.emad_chat_can_access_conversation(conversation_id)) or private.emad_chat_is_owner());

drop policy if exists emad_receipts_read on public.emad_message_receipts;
create policy emad_receipts_read on public.emad_message_receipts
for select to authenticated
using (user_id=auth.uid() or exists (
  select 1 from public.emad_messages msg
  where msg.id=message_id and msg.sender_id=auth.uid()
));

drop policy if exists emad_receipts_update_self on public.emad_message_receipts;
create policy emad_receipts_update_self on public.emad_message_receipts
for update to authenticated
using (user_id=auth.uid())
with check (user_id=auth.uid());

drop policy if exists emad_receipts_insert_self on public.emad_message_receipts;
create policy emad_receipts_insert_self on public.emad_message_receipts
for insert to authenticated
with check (user_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('emad-chat-attachments','emad-chat-attachments',false,15728640,
  array['image/jpeg','image/png','image/webp','application/pdf',
        'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict(id) do update set public=false,file_size_limit=15728640,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists emad_chat_media_read on storage.objects;
create policy emad_chat_media_read on storage.objects
for select to authenticated
using (bucket_id='emad-chat-attachments'
  and name ~* '^[0-9a-f-]{36}/'
  and private.emad_chat_can_access_conversation(split_part(name,'/',1)::uuid));

drop policy if exists emad_chat_media_insert on storage.objects;
create policy emad_chat_media_insert on storage.objects
for insert to authenticated
with check (bucket_id='emad-chat-attachments'
  and name ~* '^[0-9a-f-]{36}/'
  and private.emad_chat_can_access_conversation(split_part(name,'/',1)::uuid));

drop policy if exists emad_chat_media_delete on storage.objects;
create policy emad_chat_media_delete on storage.objects
for delete to authenticated
using (bucket_id='emad-chat-attachments'
  and name ~* '^[0-9a-f-]{36}/'
  and private.emad_chat_can_access_conversation(split_part(name,'/',1)::uuid));

do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='emad_messages') then
      alter publication supabase_realtime add table public.emad_messages;
    end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='emad_conversations') then
      alter publication supabase_realtime add table public.emad_conversations;
    end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='emad_conversation_members') then
      alter publication supabase_realtime add table public.emad_conversation_members;
    end if;
  end if;
end $$;

-- Return only safe profile-card fields to people who share an Emad chat space.
create or replace function public.emad_chat_profile_cards(p_ids uuid[])
returns table(
  id uuid,
  full_name text,
  student_number bigint,
  grade text,
  group_name text,
  avatar_url text,
  is_verified boolean,
  role text
)
language sql stable security definer
set search_path = pg_catalog, public, auth, private
as $$
  select p.id,p.full_name,p.student_number,p.grade,p.group_name,p.avatar_url,p.is_verified,p.role
  from public.profiles p
  where auth.uid() is not null
    and p.id = any(coalesce(p_ids,'{}'::uuid[]))
    and (
      private.emad_chat_is_owner()
      or private.teacher_can_access_student(p.id)
      or exists (
        select 1
        from public.emad_conversation_members mine
        join public.emad_conversations c on c.id=mine.conversation_id and c.kind='grade_group'
        join public.emad_conversation_members theirs on theirs.conversation_id=c.id
        where mine.user_id=auth.uid() and mine.left_at is null
          and theirs.user_id=p.id and theirs.left_at is null
      )
      or exists (
        select 1
        from public.emad_conversation_members mine
        join public.emad_conversations c on c.id=mine.conversation_id and c.kind='support'
        join public.emad_conversation_members theirs on theirs.conversation_id=c.id
        where mine.user_id=auth.uid() and mine.left_at is null
          and theirs.user_id=p.id and theirs.left_at is null
      )
    );
$$;
revoke all on function public.emad_chat_profile_cards(uuid[]) from public;
grant execute on function public.emad_chat_profile_cards(uuid[]) to authenticated;

-- Tighten membership writes: users may join only their matching grade group
-- and cannot promote themselves or rewrite membership ownership.
drop policy if exists emad_members_join_grade_group on public.emad_conversation_members;
create policy emad_members_join_grade_group on public.emad_conversation_members
for insert to authenticated
with check (
  user_id=auth.uid() and left_at is null and exists (
    select 1 from public.emad_conversations c
    join public.profiles p on p.id=auth.uid()
    where c.id=conversation_id and c.kind='grade_group'
      and (
        (member_role='student' and p.role='student' and p.grade=c.grade)
        or (member_role='teacher' and p.role='teacher' and private.teacher_can_access_grade(c.grade))
      )
  )
);

drop policy if exists emad_members_owner_manage on public.emad_conversation_members;
drop policy if exists emad_members_owner_delete on public.emad_conversation_members;
create policy emad_members_owner_delete on public.emad_conversation_members
for delete to authenticated
using (private.emad_chat_is_owner());

revoke update on public.emad_conversation_members from authenticated;
grant update(last_read_at,is_pinned,pinned_at) on public.emad_conversation_members to authenticated;

revoke update on public.emad_messages from authenticated;
grant select,insert,delete on public.emad_messages to authenticated;

revoke update on public.emad_message_receipts from authenticated;
grant update(read_at) on public.emad_message_receipts to authenticated;

drop policy if exists emad_receipts_insert_self on public.emad_message_receipts;
create policy emad_receipts_insert_self on public.emad_message_receipts
for insert to authenticated
with check (
  user_id=auth.uid() and exists (
    select 1 from public.emad_messages msg
    where msg.id=message_id
      and private.emad_chat_can_access_conversation(msg.conversation_id)
  )
);

-- Welcome every newly created platform profile with an in-app account notification.
create or replace function private.emad_welcome_new_profile()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, auth, private
as $$
begin
  insert into public.emad_notifications(recipient_id,notification_type,title,body,action_url,metadata)
  values(
    new.id,
    'account',
    'أهلًا بك في أكاديمية مستر عماد',
    'حسابك أصبح جاهزًا. ابدأ من صفحتك الرئيسية واكتشف الكورسات والمحاضرات والجروبات المخصصة لصفك.',
    '/home',
    jsonb_build_object('kind','welcome','profile_id',new.id)
  );
  return new;
end;
$$;
drop trigger if exists emad_welcome_new_profile on public.profiles;
create trigger emad_welcome_new_profile
after insert on public.profiles
for each row execute function private.emad_welcome_new_profile();

-- Protect paid lecture videos: only the owner, assigned teacher, or an active
-- subscriber to the published lesson can mint signed playback URLs.
update storage.buckets
set public=false
where id='emad-lecture-videos';

drop policy if exists emad_lecture_videos_public_read on storage.objects;
drop policy if exists emad_lecture_videos_staff_read on storage.objects;
create policy emad_lecture_videos_staff_read on storage.objects
for select to authenticated
using (
  bucket_id='emad-lecture-videos'
  and (
    private.current_profile_role()='owner'
    or (
      private.current_profile_role()='teacher'
      and (
        ((storage.foldername(name))[1]='teacher' and (storage.foldername(name))[2]=auth.uid()::text)
        or exists (
          select 1 from public.lessons l
          join public.courses c on c.id=l.course_id
          where l.video_url=name and c.teacher_id=auth.uid()
        )
      )
    )
  )
);

drop policy if exists emad_lecture_videos_student_read on storage.objects;
create policy emad_lecture_videos_student_read on storage.objects
for select to authenticated
using (
  bucket_id='emad-lecture-videos'
  and private.current_profile_role()='student'
  and exists (
    select 1
    from public.lessons l
    join public.courses c on c.id=l.course_id
    join public.profiles p on p.id=auth.uid()
    join public.emad_student_subscriptions s
      on s.student_id=p.id and s.grade=p.grade and s.ends_at>now()
    where l.video_url=name
      and l.is_published=true
      and c.status='published'
      and c.grade=p.grade
      and p.role='student'
  )
);
