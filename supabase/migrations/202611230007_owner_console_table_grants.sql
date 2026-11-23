-- Grant the authenticated role the SQL operations used by the owner/teacher consoles.
-- RLS policies remain the authorization boundary for every row.
grant select, insert, update, delete on table
  public.courses,
  public.lessons,
  public.exams,
  public.exam_questions,
  public.exam_answer_keys,
  public.homework_assignments,
  public.homework_questions,
  public.homework_answer_keys,
  public.announcements,
  public.emad_student_subscriptions,
  public.emad_subscription_codes,
  public.payments,
  public.profiles,
  public.support_messages,
  public.exam_attempts,
  public.exam_answers,
  public.lesson_progress,
  public.attendance,
  public.enrollments,
  public.emad_notifications
to authenticated;

grant select, insert, update, delete on table storage.objects to authenticated;
