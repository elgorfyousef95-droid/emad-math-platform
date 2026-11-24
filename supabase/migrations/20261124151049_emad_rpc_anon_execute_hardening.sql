-- These RPCs are intended for signed-in platform users, never anonymous callers.
revoke execute on function public.emad_chat_profile_cards(uuid[]) from public, anon;
revoke execute on function public.emad_submit_homework(uuid) from public, anon;
grant execute on function public.emad_chat_profile_cards(uuid[]) to authenticated;
grant execute on function public.emad_submit_homework(uuid) to authenticated;
