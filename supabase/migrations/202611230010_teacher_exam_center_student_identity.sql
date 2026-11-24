-- Isolate student exam sessions and expose only teacher-owned exam activity.
drop policy if exists attempts_insert_own on public.exam_attempts;
create policy attempts_insert_own on public.exam_attempts for insert to authenticated with check (
 student_id=(select auth.uid()) and submitted_at is null and score is null
 and exists(select 1 from public.profiles p join public.exams e on e.id=exam_attempts.exam_id join public.courses c on c.id=e.course_id
 where p.id=(select auth.uid()) and p.role='student' and e.is_published=true and c.status='published' and c.grade=p.grade
 and (e.opens_at is null or e.opens_at<=now()) and (e.closes_at is null or e.closes_at>now())
 and (exists(select 1 from public.enrollments en where en.student_id=p.id and en.course_id=c.id and en.status='active')
 or exists(select 1 from public.emad_student_subscriptions s where s.student_id=p.id and s.ends_at>now() and s.grade=p.grade))
));
drop policy if exists exam_attempts_teacher_read_own_courses on public.exam_attempts;
create policy exam_attempts_teacher_read_own_courses on public.exam_attempts for select to authenticated using (
 exists(select 1 from public.exams e join public.courses c on c.id=e.course_id where e.id=exam_attempts.exam_id and c.teacher_id=(select auth.uid()))
);
drop policy if exists exam_answers_teacher_read_own_courses on public.exam_answers;
create policy exam_answers_teacher_read_own_courses on public.exam_answers for select to authenticated using (
 exists(select 1 from public.exam_attempts a join public.exams e on e.id=a.exam_id join public.courses c on c.id=e.course_id where a.id=exam_answers.attempt_id and c.teacher_id=(select auth.uid()))
);
drop policy if exists exam_answer_keys_teacher_manage_own_courses on public.exam_answer_keys;
create policy exam_answer_keys_teacher_manage_own_courses on public.exam_answer_keys for all to authenticated
using(exists(select 1 from public.exam_questions q join public.exams e on e.id=q.exam_id join public.courses c on c.id=e.course_id where q.id=exam_answer_keys.question_id and c.teacher_id=(select auth.uid())))
with check(exists(select 1 from public.exam_questions q join public.exams e on e.id=q.exam_id join public.courses c on c.id=e.course_id where q.id=exam_answer_keys.question_id and c.teacher_id=(select auth.uid())));
drop policy if exists answers_insert_own_open_attempt on public.exam_answers;
create policy answers_insert_own_open_attempt on public.exam_answers for insert to authenticated with check (
 exists(select 1 from public.exam_attempts a join public.exams e on e.id=a.exam_id join public.courses c on c.id=e.course_id join public.profiles p on p.id=a.student_id
 where a.id=exam_answers.attempt_id and a.student_id=(select auth.uid()) and a.submitted_at is null and a.score is null
 and p.role='student' and p.grade=c.grade and e.is_published=true and c.status='published'
 and (e.opens_at is null or e.opens_at<=now()) and (e.closes_at is null or e.closes_at>now())
 and a.started_at+make_interval(mins=>e.duration_minutes)>now()
 and (exists(select 1 from public.enrollments en where en.student_id=p.id and en.course_id=c.id and en.status='active')
 or exists(select 1 from public.emad_student_subscriptions s where s.student_id=p.id and s.ends_at>now() and s.grade=p.grade)))
);
drop policy if exists answers_update_own_open_attempt on public.exam_answers;
create policy answers_update_own_open_attempt on public.exam_answers for update to authenticated
using(exists(select 1 from public.exam_attempts a join public.exams e on e.id=a.exam_id join public.courses c on c.id=e.course_id join public.profiles p on p.id=a.student_id
 where a.id=exam_answers.attempt_id and a.student_id=(select auth.uid()) and a.submitted_at is null and a.score is null
 and p.role='student' and p.grade=c.grade and e.is_published=true and c.status='published'
 and (e.opens_at is null or e.opens_at<=now()) and (e.closes_at is null or e.closes_at>now())
 and a.started_at+make_interval(mins=>e.duration_minutes)>now()))
with check(exists(select 1 from public.exam_attempts a join public.exams e on e.id=a.exam_id
 where a.id=exam_answers.attempt_id and a.student_id=(select auth.uid()) and a.submitted_at is null and a.score is null
 and a.started_at+make_interval(mins=>e.duration_minutes)>now()));

create or replace function public.submit_exam_attempt(p_attempt_id uuid) returns jsonb language plpgsql security definer set search_path=''
as $function$
declare v_user uuid:=auth.uid(); v_exam_id uuid; v_course_id uuid; v_submitted timestamptz; v_open timestamptz; v_close timestamptz; v_published boolean; v_score numeric; v_total numeric; v_unkeyed bigint; v_grade text;
begin
 if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
 select a.exam_id,a.submitted_at,e.course_id,e.opens_at,e.closes_at,e.is_published,c.grade into v_exam_id,v_submitted,v_course_id,v_open,v_close,v_published,v_grade
 from public.exam_attempts a join public.exams e on e.id=a.exam_id join public.courses c on c.id=e.course_id
 where a.id=p_attempt_id and a.student_id=v_user for update of a;
 if not found then raise exception 'attempt_not_found_or_forbidden' using errcode='42501'; end if;
 if v_submitted is not null then raise exception 'attempt_already_submitted'; end if;
 if not v_published or (v_open is not null and v_open>now()) or (v_close is not null and v_close<=now()) then raise exception 'exam_not_open'; end if;
 if not exists(select 1 from public.profiles p where p.id=v_user and p.role='student' and p.grade=v_grade) then raise exception 'student_profile_required' using errcode='42501'; end if;
 if not exists(select 1 from public.enrollments en where en.student_id=v_user and en.course_id=v_course_id and en.status='active')
 and not exists(select 1 from public.profiles p join public.emad_student_subscriptions s on s.student_id=p.id where p.id=v_user and p.role='student' and p.grade=v_grade and s.ends_at>now() and s.grade=p.grade)
 then raise exception 'active_subscription_required' using errcode='42501'; end if;
 select count(*) into v_unkeyed from public.exam_questions q left join public.exam_answer_keys k on k.question_id=q.id where q.exam_id=v_exam_id and k.question_id is null;
 select coalesce(sum(q.points),0),coalesce(sum(case when k.question_id is not null and ans.answer=k.correct_answer then q.points else 0 end),0) into v_total,v_score
 from public.exam_questions q left join public.exam_answer_keys k on k.question_id=q.id left join public.exam_answers ans on ans.question_id=q.id and ans.attempt_id=p_attempt_id where q.exam_id=v_exam_id;
 update public.exam_answers ans set awarded_points=case when k.question_id is not null and ans.answer=k.correct_answer then q.points else 0 end
 from public.exam_questions q left join public.exam_answer_keys k on k.question_id=q.id where ans.question_id=q.id and ans.attempt_id=p_attempt_id and q.exam_id=v_exam_id;
 update public.exam_attempts set submitted_at=now(),score=v_score,graded_at=case when v_unkeyed=0 then now() else null end where id=p_attempt_id;
 return jsonb_build_object('submitted',true,'score',v_score,'max_score',v_total,'manual_grading_required',v_unkeyed>0);
end;$function$;

create or replace function public.teacher_grade_exam_attempt(p_attempt_id uuid,p_score numeric) returns jsonb language plpgsql security definer set search_path=''
as $function$
declare v_teacher uuid:=auth.uid(); v_max numeric; v_submitted timestamptz;
begin
 if v_teacher is null or (select private.current_profile_role())<>'teacher' then raise exception 'teacher_access_required' using errcode='42501'; end if;
 select coalesce(sum(q.points),0),a.submitted_at into v_max,v_submitted from public.exam_attempts a join public.exams e on e.id=a.exam_id join public.courses c on c.id=e.course_id left join public.exam_questions q on q.exam_id=e.id where a.id=p_attempt_id and c.teacher_id=v_teacher group by a.id,a.submitted_at;
 if not found then raise exception 'attempt_not_found_or_forbidden' using errcode='42501'; end if;
 if v_submitted is null then raise exception 'attempt_not_submitted'; end if;
 if p_score is null or p_score<0 or p_score>v_max then raise exception 'invalid_score'; end if;
 update public.exam_attempts set score=p_score,graded_at=now() where id=p_attempt_id;
 return jsonb_build_object('graded',true,'score',p_score,'max_score',v_max);
end;$function$;
revoke all on function public.teacher_grade_exam_attempt(uuid,numeric) from public,anon;
grant execute on function public.teacher_grade_exam_attempt(uuid,numeric) to authenticated;
