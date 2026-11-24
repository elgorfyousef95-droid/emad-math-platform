import React, { useCallback, useEffect, useRef, useState } from "react";
import { notify } from "./MessageProvider.jsx";
import { portalApi } from "../lib/portalAuth.js";
import { refreshStudentSession, studentApi } from "../lib/auth.js";
import "./LiveClassroomControls.css";

const statusLabels = {
  requested: "طلب جديد",
  approved: "تم قبول الطلب",
  rejected: "تم رفض الطلب",
  removed: "تم إيقاف المايك",
  cancelled: "أُلغي الطلب",
};

function formatTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

export function TeacherMicRequestConsole({ profile }) {
  const [sessions, setSessions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState({});
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastGrade, setBroadcastGrade] = useState("الصف الثالث الثانوي");
  const seenRequests = useRef(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setBusy(true);
    try {
      const live = await portalApi("teacher", "emad_teacher_live_sessions?select=id,title,grade,room_name,status,started_at,teacher_id&teacher_id=eq." + encodeURIComponent(profile.id) + "&status=eq.live&order=started_at.desc");
      const activeSessions = live || [];
      setSessions(activeSessions);
      if (!activeSessions.length) {
        setRequests([]);
        setStudents({});
        setError("");
        return;
      }
      const ids = activeSessions.map(item => item.id);
      const rows = await portalApi("teacher", "emad_live_mic_requests?select=id,session_id,student_id,status,mic_enabled,created_at,responded_at&session_id=in.(" + ids.join(",") + ")&order=created_at.desc");
      setRequests(rows || []);
      const currentIds = new Set((rows || []).map(item => item.id));
      if (seenRequests.current) {
        const incoming = (rows || []).filter(item => !seenRequests.current.has(item.id) && item.status === "requested");
        if (incoming.length) notify({ type: "warning", title: "طلب مايك جديد", message: "وصلك " + incoming.length + " طلب جديد من الطلاب." });
      }
      seenRequests.current = currentIds;
      const studentIds = [...new Set((rows || []).map(item => item.student_id))];
      if (studentIds.length) {
        const people = await portalApi("teacher", "profiles?select=id,full_name,student_number,avatar_url&id=in.(" + studentIds.join(",") + ")");
        setStudents(Object.fromEntries((people || []).map(person => [person.id, person])));
      } else {
        setStudents({});
      }
      setError("");
    } catch (e) {
      console.error("teacher_live_mic_load", e);
      setError("تعذر تحديث طلبات المايك. تحقق من الاتصال والصلاحيات.");
    } finally {
      if (!quiet) setBusy(false);
    }
  }, [profile.id]);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 4500);
    return () => window.clearInterval(timer);
  }, [load]);

  const requestBroadcastSetup = () => {
    notify({ type: "warning", title: "البث يحتاج تفعيل خدمة الفيديو", message: "تم تجهيز اختيار الصف وإدارة طلبات المايك، لكن لا يمكن فتح بث فيديو حقيقي قبل ربط LiveKit وإضافة مفاتيحه الآمنة على الخادم." });
  };

  const decide = async (request, status) => {
    setSaving(request.id);
    try {
      await portalApi("teacher", "emad_live_mic_requests?id=eq." + encodeURIComponent(request.id), {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status,
          mic_enabled: status === "approved",
          responded_at: new Date().toISOString(),
        }),
      });
      notify({
        type: "success",
        title: status === "approved" ? "تم اعتماد طلب المايك" : status === "rejected" ? "تم رفض الطلب" : "تم إيقاف طلب المايك",
        message: "تم حفظ قرارك وسيظهر للطالب عند تحديث حالة البث.",
      });
      await load(true);
    } catch (e) {
      console.error("teacher_live_mic_decision", e);
      notify({ type: "error", title: "تعذر حفظ القرار", message: "لم يتغير وضع طلب المايك. حاول مرة أخرى." });
    } finally {
      setSaving("");
    }
  };

  const waiting = requests.filter(item => item.status === "requested");
  const approved = requests.filter(item => item.status === "approved");
  return (
    <section className="live-control-workspace" dir="rtl">
      <header className="live-control-hero">
        <div>
          <span className="live-control-kicker">LIVE CLASSROOM CONTROL</span>
          <h2>مركز إدارة البث المباشر</h2>
          <p>تابع طلبات الطلاب، واعتمد أو ارفض طلب التحدث، وأوقف صلاحية المايك عند الحاجة.</p>
        </div>
        <div className="live-control-counter"><b>{waiting.length}</b><small>طلبات تنتظر قرارك</small></div>
      </header>
      <div className="live-control-launch-card">
        <div className="live-control-launch-copy"><span>TEACHER BROADCAST STUDIO</span><h3>إعداد حصة مباشرة جديدة</h3><p>المدرس فقط هو الذي يبدأ البث ويظهر بالصورة. الطلاب يشاهدون الحصة، ولا يفتح المايك لأي طالب إلا بعد موافقتك.</p></div>
        <div className="live-control-launch-fields">
          <label>عنوان الحصة<input value={broadcastTitle} onChange={event => setBroadcastTitle(event.target.value)} maxLength={140} placeholder="مثال: مراجعة قوانين نيوتن"/></label>
          <label>الصف المستهدف<select value={broadcastGrade} onChange={event => setBroadcastGrade(event.target.value)}><option>الصف الأول الثانوي</option><option>الصف الثاني الثانوي</option><option>الصف الثالث الثانوي</option></select></label>
          <button type="button" onClick={requestBroadcastSetup}>تجهيز بدء البث للصف المحدد</button>
        </div>
        <small className="live-control-provider-warning">حالة الربط: خدمة البث المرئي غير مضافة بعد. لن يتم نشر حصة وهمية للطلاب قبل تفعيل مزود البث الآمن.</small>
      </div>
      <div className="live-control-stats">
        <article><small>جلسات مباشرة</small><b>{sessions.length}</b></article>
        <article><small>طلبات جديدة</small><b>{waiting.length}</b></article>
        <article><small>طلبات مقبولة</small><b>{approved.length}</b></article>
        <article><small>آخر تحديث</small><b>{formatTime(new Date())}</b></article>
      </div>
      <div className="live-control-section-head">
        <div><span>MIC REQUESTS</span><h3>طلبات التحدث من الطلاب</h3></div>
        <button type="button" onClick={() => load()} disabled={busy}>تحديث الطلبات</button>
      </div>
      {error && <p className="live-control-error">{error}</p>}
      {busy ? <div className="live-control-empty">جارٍ تحميل حالة البث والطلبات...</div> :
        !sessions.length ? (
          <div className="live-control-empty live-control-provider-note">
            <span className="live-control-empty-icon">◉</span>
            <b>لا توجد حصة مباشرة نشطة الآن</b>
            <p>ستظهر طلبات المايك هنا تلقائيًا بمجرد تشغيل حصة مباشرة من استوديو البث.</p>
            <small>تشغيل الكاميرا والصوت والبث الفعلي يحتاج ربط مزود بث خاص وآمن بالمنصة. لن نعرض غرفة وهمية على أنها بث حقيقي.</small>
          </div>
        ) : (
          <div className="live-control-session-list">
            {sessions.map(session => {
              const roomRequests = requests.filter(item => item.session_id === session.id);
              return (
                <article className="live-control-session" key={session.id}>
                  <div className="live-control-session-heading">
                    <span className="live-control-live-dot">LIVE</span>
                    <div><b>{session.title}</b><small>{session.grade} · بدأت {formatTime(session.started_at)}</small></div>
                    <strong>{roomRequests.filter(item => item.status === "requested").length} طلب</strong>
                  </div>
                  {roomRequests.length ? <div className="live-control-request-list">
                    {roomRequests.map(request => {
                      const student = students[request.student_id];
                      return (
                        <div className="live-control-request" key={request.id}>
                          <span className="live-control-student-avatar">{student?.avatar_url ? <img src={student.avatar_url} alt="" /> : (student?.full_name || "ط").slice(0, 1)}</span>
                          <div className="live-control-student-copy">
                            <b>{student?.full_name || "طالب"}</b>
                            <small>{student?.student_number || "—"} · {formatTime(request.created_at)}</small>
                          </div>
                          <span className={"live-control-status " + request.status}>{statusLabels[request.status] || request.status}</span>
                          <div className="live-control-request-actions">
                            {request.status === "requested" ? <>
                              <button type="button" className="allow" disabled={saving === request.id} onClick={() => decide(request, "approved")}>السماح بالمايك</button>
                              <button type="button" className="deny" disabled={saving === request.id} onClick={() => decide(request, "rejected")}>رفض</button>
                            </> : request.status === "approved" ? (
                              <button type="button" className="deny" disabled={saving === request.id} onClick={() => decide(request, "removed")}>إيقاف المايك</button>
                            ) : <small>لا يوجد إجراء مطلوب</small>}
                          </div>
                        </div>
                      );
                    })}
                  </div> : <p className="live-control-no-requests">لا توجد طلبات مايك في هذه الحصة حتى الآن.</p>}
                </article>
              );
            })}
          </div>
        )
      }
      <p className="live-control-footnote">ملاحظة: قرارات السماح والرفض تُحفظ وتظهر للطالب. تشغيل مسار الصوت داخل البث نفسه لا يكتمل إلا بعد ربط مزود البث الآمن.</p>
    </section>
  );
}

export function StudentLiveClassroom({ profile }) {
  const [sessions, setSessions] = useState([]);
  const [requests, setRequests] = useState({});
  const [busy, setBusy] = useState(true);
  const [sending, setSending] = useState("");
  const [error, setError] = useState("");
  const previousStatuses = useRef({});

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setBusy(true);
    try {
      await refreshStudentSession();
      const live = await studentApi("emad_teacher_live_sessions?select=id,title,grade,room_name,started_at,teacher_id&status=eq.live&grade=eq." + encodeURIComponent(profile.grade || "") + "&order=started_at.desc");
      const activeSessions = live || [];
      setSessions(activeSessions);
      if (!activeSessions.length) {
        setRequests({});
        setError("");
        return;
      }
      const ids = activeSessions.map(item => item.id);
      const rows = await studentApi("emad_live_mic_requests?select=id,session_id,status,mic_enabled,created_at,responded_at&student_id=eq." + encodeURIComponent(profile.id) + "&session_id=in.(" + ids.join(",") + ")");
      const nextRequests = Object.fromEntries((rows || []).map(item => [item.session_id, item]));
      for (const item of rows || []) {
        const before = previousStatuses.current[item.session_id];
        if (before && before !== item.status && ["approved", "rejected", "removed"].includes(item.status)) {
          notify({ type: item.status === "approved" ? "success" : "warning", title: statusLabels[item.status], message: item.status === "approved" ? "المدرس وافق على طلب المايك." : item.status === "removed" ? "المدرس أوقف صلاحية المايك." : "المدرس لم يوافق على طلب المايك حاليًا." });
        }
        previousStatuses.current[item.session_id] = item.status;
      }
      setRequests(nextRequests);
      setError("");
    } catch (e) {
      console.error("student_live_classroom_load", e);
      setError("تعذر تحميل البث المباشر. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
    } finally {
      if (!quiet) setBusy(false);
    }
  }, [profile.id, profile.grade]);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 4500);
    return () => window.clearInterval(timer);
  }, [load]);

  const requestMic = async session => {
    setSending(session.id);
    try {
      const existing = requests[session.id];
      if (existing && ["rejected", "cancelled", "removed"].includes(existing.status)) {
        await studentApi("emad_live_mic_requests?id=eq." + encodeURIComponent(existing.id), { method: "DELETE", headers: { Prefer: "return=minimal" } });
      }
      await studentApi("emad_live_mic_requests", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ session_id: session.id, student_id: profile.id, status: "requested", mic_enabled: false }),
      });
      notify({ type: "success", title: "تم إرسال طلب المايك", message: "استنى موافقة المدرس؛ هيوصلك تحديث بمجرد ما يرد." });
      await load(true);
    } catch (e) {
      console.error("student_live_mic_request", e);
      notify({ type: "error", title: "تعذر إرسال الطلب", message: "يمكن أن يكون لديك طلب سابق أو انتهت الحصة. حدّث الصفحة وحاول مرة أخرى." });
    } finally {
      setSending("");
    }
  };

  const cancelRequest = async request => {
    try {
      await studentApi("emad_live_mic_requests?id=eq." + encodeURIComponent(request.id), { method: "DELETE", headers: { Prefer: "return=minimal" } });
      await load(true);
      notify({ type: "info", title: "تم إلغاء طلب المايك", message: "يمكنك إرسال طلب جديد أثناء استمرار الحصة." });
    } catch {
      notify({ type: "error", title: "تعذر إلغاء الطلب", message: "حاول مرة أخرى." });
    }
  };

  return (
    <div className="student-live-workspace" dir="rtl">
      <header className="student-live-hero">
        <div><span>LIVE CLASSROOM · STUDENT SPACE</span><h2>حصصك المباشرة</h2><p>شاهد الحصة، واطلب التحدث بالمايك. المدرس هو اللي يوافق أو يرفض ويتحكم في صلاحية المايك.</p></div>
        <div className="student-live-identity"><b>{profile?.full_name || "الطالب"}</b><small>{profile?.grade || "الصف الدراسي"}</small></div>
      </header>
      {error && <p className="student-live-error">{error}</p>}
      {busy ? <div className="student-live-empty">جارٍ البحث عن الحصص المباشرة...</div> :
        sessions.length ? <div className="student-live-session-grid">
          {sessions.map(session => {
            const request = requests[session.id];
            return <article className="student-live-session-card" key={session.id}>
              <div className="student-live-card-top"><span>● LIVE NOW</span><small>{formatTime(session.started_at)}</small></div>
              <div className="student-live-session-art"><span>EMAD LIVE CLASS</span><b>{session.title}</b><small>{session.grade}</small></div>
              <div className="student-live-session-copy"><b>{session.title}</b><small>حصة مباشرة · {session.grade}</small>
                {!request && <button type="button" onClick={() => requestMic(session)} disabled={sending === session.id}>طلب المايك</button>}
                {request?.status === "requested" && <div className="student-live-request-state pending"><b>طلبك وصل للمدرس</b><small>بانتظار الموافقة</small><button type="button" onClick={() => cancelRequest(request)}>إلغاء الطلب</button></div>}
                {request?.status === "approved" && <div className="student-live-request-state approved"><b>المدرس وافق على طلبك</b><small>تم اعتماد الطلب. تفعيل الصوت داخل البث مرتبط بتوصيل خدمة البث الآمنة.</small></div>}
                {request?.status === "rejected" && <div className="student-live-request-state rejected"><b>المدرس رفض الطلب حاليًا</b><button type="button" onClick={() => requestMic(session)} disabled={sending === session.id}>طلب المايك مرة أخرى</button></div>}
                {request?.status === "removed" && <div className="student-live-request-state rejected"><b>المدرس أوقف صلاحية المايك</b><small>يمكنك متابعة الحصة كمشاهد.</small></div>}
              </div>
            </article>;
          })}
        </div> : <div className="student-live-empty"><span>◉</span><b>مفيش بث مباشر شغال دلوقتي</b><p>أول ما المدرس يبدأ حصة مباشرة للصف بتاعك، هتظهر هنا تلقائيًا مع إمكانية طلب المايك.</p></div>
      }
      <p className="student-live-footnote">حالة الحصة وطلبات المايك تتحدث تلقائيًا كل بضع ثوانٍ. الصوت والصورة يحتاجان إلى اكتمال ربط مزود البث قبل تشغيلهما.</p>
    </div>
  );
}
