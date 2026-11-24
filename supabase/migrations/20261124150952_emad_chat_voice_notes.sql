-- Voice-note messages for the Emad communication hub only.
alter table public.emad_messages
  drop constraint if exists emad_messages_message_type_check;
alter table public.emad_messages
  add constraint emad_messages_message_type_check
  check (message_type in ('text','image','file','audio','system'));

update storage.buckets
set public=false,
    file_size_limit=15728640,
    allowed_mime_types=array[
      'image/jpeg','image/png','image/webp',
      'audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav',
      'application/pdf',
      'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
where id='emad-chat-attachments';

create or replace function private.emad_chat_after_message()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, auth, private
as $$
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
           when new.message_type='audio' then 'أرسل رسالة صوتية'
           when new.message_type='file' then 'أرسل ملفًا جديدًا'
           else coalesce(nullif(left(trim(new.body),180),''),'أرسل مرفقًا جديدًا') end,
      case when conversation_kind='support' then '/messages' else '/groups' end,
      jsonb_build_object('conversation_id',new.conversation_id,'message_id',new.id));
  end loop;
  return new;
end;
$$;
