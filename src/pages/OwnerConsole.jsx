import React, { useEffect, useMemo, useState } from "react";
import {
  portalApi,
  refreshPortalSession,
  logoutPortalSession,
  uploadPortalImage,
} from "../lib/portalAuth.js";

const GRADES = ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"];
const TABS = [
  ["overview", "نظرة عامة", "OVERVIEW"],
  ["accounts", "الحسابات", "ACCOUNTS"],
  ["courses", "الكورسات والمحاضرات", "COURSES"],
  ["exams", "الامتحانات", "EXAMS"],
  ["homework", "الواجبات", "HOMEWORK"],
  ["subscriptions", "الاشتراكات والأكواد", "SUBSCRIPTIONS"],
  ["payments", "المدفوعات", "PAYMENTS"],
  ["messages", "مراسلات الطلاب", "MESSAGES"],
];
const dateText = (value) => value ? new Date(value).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : "—";
const moneyText = (value) => Number(value || 0).toLocaleString("ar-EG") + " ج.م";
const statusText = (value) => ({ published: "منشور", draft: "مسودة", open: "مفتوح", closed: "مغلق", pending: "قيد الانتظار", paid: "مدفوع", failed: "فشل", refunded: "مسترد" }[value] || value || "—");

export default function OwnerConsole() {
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [examQuestions, setExamQuestions] = useState([]);
  const [homework, setHomework] = useState([]);
  const [homeworkQuestions, setHomeworkQuestions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [codes, setCodes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [section, setSection] = useState("overview");
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState("");
  const [busy, setBusy] = useState(true);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [selectedCourse, setSelectedCourse] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeGrade, setCodeGrade] = useState(GRADES[2]);
  const [manualStudent, setManualStudent] = useState("");
  const [manualGrade, setManualGrade] = useState(GRADES[2]);
  const [manualEnd, setManualEnd] = useState("");
  const [courseForm, setCourseForm] = useState({ title: "", subject: "رياضيات", grade: GRADES[2], description: "", price_egp: "0", teacher_id: "", cover_image_url: "" });
  const [editCourseForm, setEditCourseForm] = useState({ title: "", subject: "رياضيات", grade: GRADES[2], description: "", price_egp: "0", teacher_id: "" });
  const [examForm, setExamForm] = useState({ title: "", course_id: "", duration_minutes: "60", opens_at: "", closes_at: "", cover_image_url: "" });
  const [examQuestionForm, setExamQuestionForm] = useState({ prompt: "", question_type: "single_choice", choices: "", correct_answer: "", points: "1" });
  const [examDraftQuestions, setExamDraftQuestions] = useState([]);
  const [homeworkForm, setHomeworkForm] = useState({ title: "", description: "", grade: GRADES[2], group_name: "", due_at: "", cover_image_url: "", is_published: false });
  const [homeworkQuestionForm, setHomeworkQuestionForm] = useState({ prompt: "", question_type: "single_choice", choices: "", correct_answer: "", points: "1" });
  const [homeworkDraftQuestions, setHomeworkDraftQuestions] = useState([]);
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", content: "", video_url: "" });

  const read = async (path) => {
    try { return await portalApi("owner", path); }
    catch (e) { console.error("owner_read", path, e); throw new Error(path.split("?")[0] + ": " + (e.message || "تعذر التحميل")); }
  };

  const load = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const session = await refreshPortalSession("owner");
      if (!session?.access_token) throw new Error("not_authenticated");
      const specs = [
        ["profiles", "profiles?select=id,full_name,student_number,grade,group_name,role,is_verified,phone,parent_name,parent_phone,governorate,city,created_at&order=created_at.desc&limit=1000"],
        ["messages", "support_messages?select=id,user_id,subject,message,status,created_at,admin_reply,replied_at&order=created_at.desc&limit=500"],
        ["courses", "courses?select=id,teacher_id,title,description,subject,price_egp,status,grade,cover_image_url,created_at&order=created_at.desc&limit=500"],
        ["lessons", "lessons?select=id,course_id,title,description,content,video_url,sort_order,is_published,cover_image_url,created_at&order=created_at.desc&limit=1000"],
        ["exams", "exams?select=id,course_id,title,duration_minutes,is_published,opens_at,closes_at,cover_image_url,created_at&order=created_at.desc&limit=500"],
        ["examQuestions", "exam_questions?select=id,exam_id,question_type,prompt,points,sort_order&order=sort_order.asc&limit=5000"],
        ["homework", "homework_assignments?select=id,title,description,grade,group_name,due_at,is_published,cover_image_url,created_by,created_at&order=created_at.desc&limit=500"],
        ["homeworkQuestions", "homework_questions?select=id,assignment_id,question_type,prompt,points,position&order=position.asc&limit=5000"],
        ["subscriptions", "emad_student_subscriptions?select=id,student_id,grade,starts_at,ends_at,created_at&order=ends_at.desc&limit=1000"],
        ["codes", "emad_subscription_codes?select=id,grade,created_at,redeemed_by,redeemed_at,expires_at,code_hint&order=created_at.desc&limit=500"],
        ["payments", "payments?select=id,student_id,course_id,provider,provider_reference,amount_egp,status,verified_at,created_at&order=created_at.desc&limit=500"],
        ["attempts", "exam_attempts?select=id,exam_id,student_id,started_at,submitted_at,score,graded_at&order=started_at.desc&limit=1000"],
      ];
      const values = await Promise.all(specs.map(async ([key, path]) => [key, await read(path)]));
      const data = Object.fromEntries(values);
      const me = (data.profiles || []).find((x) => x.id === session.user?.id) || null;
      if (me?.role !== "owner") throw new Error("not_owner");
      setProfile(me);
      setUsers(data.profiles || []);
      setMessages(data.messages || []);
      setCourses(data.courses || []);
      setLessons(data.lessons || []);
      setExams(data.exams || []);
      setExamQuestions(data.examQuestions || []);
      setHomework(data.homework || []);
      setHomeworkQuestions(data.homeworkQuestions || []);
      setSubscriptions(data.subscriptions || []);
      setCodes(data.codes || []);
      setPayments(data.payments || []);
      setAttempts(data.attempts || []);
      if (!selectedCourse && data.courses?.[0]?.id) setSelectedCourse(data.courses[0].id);
    } catch (e) {
      setProfile(null);
      setError(e.message === "not_authenticated" ? "سجّل الدخول من بوابة المالك." : e.message === "not_owner" ? "هذا الحساب لا يمتلك صلاحية المالك." : "تعذر تحميل بعض بيانات لوحة التحكم. " + e.message);
    } finally { setBusy(false); }
  };

  useEffect(() => {
    const nodes = [document.documentElement, document.body, document.getElementById("root")].filter(Boolean);
    nodes.forEach((node) => node.classList.add("admin-scroll-mode"));
    load();
    return () => nodes.forEach((node) => node.classList.remove("admin-scroll-mode"));
  }, []);

  const studentUsers = useMemo(() => users.filter((x) => x.role === "student"), [users]);
  const teachers = useMemo(() => users.filter((x) => x.role === "teacher"), [users]);
  const selected = courses.find((x) => x.id === selectedCourse) || null;
  useEffect(() => {
    if (selected) setEditCourseForm({ title: selected.title || "", subject: selected.subject || "رياضيات", grade: selected.grade || GRADES[2], description: selected.description || "", price_egp: String(selected.price_egp ?? 0), teacher_id: selected.teacher_id || "" });
  }, [selectedCourse, courses]);
  const visibleUsers = users.filter((u) => [u.full_name, u.student_number, u.grade, u.group_name, u.phone, u.role].join(" ").toLowerCase().includes(filter.toLowerCase()));
  const activeSubscriptions = subscriptions.filter((x) => new Date(x.ends_at) > new Date());
  const pendingMessages = messages.filter((x) => x.status !== "closed");
  const studentName = (id) => users.find((x) => x.id === id)?.full_name || "حساب طالب";
  const studentNumber = (id) => users.find((x) => x.id === id)?.student_number || "—";

  const changeRole = async (user, role) => {
    if (user.id === profile.id || !window.confirm("تأكيد تغيير صلاحية " + (user.full_name || user.student_number) + " إلى " + role + "؟")) return;
    setSaving(user.id); setError(""); setNotice("");
    try {
      await portalApi("owner", "profiles?id=eq." + encodeURIComponent(user.id), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ role }) });
      setUsers((old) => old.map((x) => x.id === user.id ? { ...x, role } : x));
      setNotice("تم تحديث صلاحية الحساب.");
    } catch { setError("تعذر تغيير صلاحية الحساب."); }
    finally { setSaving(""); }
  };

  const uploadImage = async (file, kind) => {
    if (!file) return;
    setUploading(kind); setError(""); setNotice("");
    try {
      const url = await uploadPortalImage(file, "owner");
      if (kind === "course") setCourseForm((old) => ({ ...old, cover_image_url: url }));
      if (kind === "exam") setExamForm((old) => ({ ...old, cover_image_url: url }));
      if (kind === "homework") setHomeworkForm((old) => ({ ...old, cover_image_url: url }));
      setNotice("تم رفع الصورة وحفظ رابطها في نموذج المحتوى.");
    } catch (e) {
      setError(e.message === "image_too_large" ? "حجم الصورة أكبر من 5 ميجابايت." : e.message === "unsupported_image_type" ? "الصيغ المسموحة JPG وPNG وWEBP فقط." : "تعذر رفع الصورة. تحقق من إعداد مساحة الصور.");
    } finally { setUploading(""); }
  };

  const saveCourse = async (event) => {
    event.preventDefault();
    if (!courseForm.title.trim()) return;
    if (!courseForm.cover_image_url) return setError("ارفع صورة غلاف للكورس قبل إنشائه.");
    const teacherId = courseForm.teacher_id || teachers[0]?.id || profile.id;
    setSaving("course"); setError(""); setNotice("");
    try {
      const body = { title: courseForm.title.trim(), subject: courseForm.subject.trim() || "رياضيات", grade: courseForm.grade, description: courseForm.description.trim(), price_egp: Number(courseForm.price_egp) || 0, teacher_id: teacherId, cover_image_url: courseForm.cover_image_url || null };
      const rows = await portalApi("owner", "courses", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(body) });
      const created = Array.isArray(rows) ? rows[0] : rows;
      if (!created?.id) throw new Error("course_not_created");
      setCourses((old) => [created, ...old]); setSelectedCourse(created.id);
      setCourseForm({ title: "", subject: "رياضيات", grade: GRADES[2], description: "", price_egp: "0", teacher_id: "", cover_image_url: "" });
      setNotice("تم إنشاء الكورس كمسودة. راجع الصورة والتفاصيل قبل النشر.");
    } catch (e) { setError("لم يتم إنشاء الكورس. " + (e.message || "")); }
    finally { setSaving(""); }
  };

  const createLesson = async (event) => {
    event.preventDefault();
    if (!selectedCourse || !lessonForm.title.trim()) return;
    setSaving("lesson"); setError(""); setNotice("");
    try {
      const order = lessons.filter((x) => x.course_id === selectedCourse).length + 1;
      const rows = await portalApi("owner", "lessons", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({
        course_id: selectedCourse, title: lessonForm.title.trim(), description: lessonForm.description.trim(),
        content: lessonForm.content.trim(), video_url: lessonForm.video_url.trim() || null, sort_order: order,
        is_published: false,
      }) });
      const created = Array.isArray(rows) ? rows[0] : rows;
      if (!created?.id) throw new Error("lesson_not_created");
      setLessons((old) => [...old, created]);
      setLessonForm({ title: "", description: "", content: "", video_url: "" });
      setNotice("تمت إضافة المحاضرة كمسودة.");
    } catch (e) { setError("تعذر إضافة المحاضرة. " + (e.message || "")); }
    finally { setSaving(""); }
  };

  const toggleLesson = async (lesson) => {
    setSaving(lesson.id); setError(""); setNotice("");
    try {
      const next = !lesson.is_published;
      await portalApi("owner", "lessons?id=eq." + encodeURIComponent(lesson.id), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ is_published: next }) });
      setLessons((old) => old.map((x) => x.id === lesson.id ? { ...x, is_published: next } : x));
      setNotice(next ? "تم نشر المحاضرة." : "تم إخفاء المحاضرة.");
    } catch { setError("تعذر تحديث حالة المحاضرة."); }
    finally { setSaving(""); }
  };

  const updateMediaImage = async (file, table, item) => {
    if (!file || !item?.id) return;
    setUploading(item.id); setError(""); setNotice("");
    try {
      const url = await uploadPortalImage(file, "owner");
      await portalApi("owner", table + "?id=eq." + encodeURIComponent(item.id), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ cover_image_url: url }) });
      const setter = table === "courses" ? setCourses : table === "exams" ? setExams : setHomework;
      setter((old) => old.map((x) => x.id === item.id ? { ...x, cover_image_url: url } : x));
      setNotice("تم تحديث صورة العنصر.");
    } catch { setError("تعذر تحديث الصورة. تحقق من مساحة التخزين وصلاحيات المالك."); }
    finally { setUploading(""); }
  };

  const updateCourse = async (course, patch) => {
    setSaving(course.id); setError(""); setNotice("");
    try {
      await portalApi("owner", "courses?id=eq." + encodeURIComponent(course.id), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) });
      setCourses((old) => old.map((x) => x.id === course.id ? { ...x, ...patch } : x));
      setNotice("تم حفظ تعديلات الكورس.");
    } catch { setError("تعذر تحديث الكورس."); }
    finally { setSaving(""); }
  };

  const saveCourseEdits = async (event) => {
    event.preventDefault();
    if (!selected) return;
    await updateCourse(selected, {
      title: editCourseForm.title.trim(),
      subject: editCourseForm.subject.trim() || "رياضيات",
      grade: editCourseForm.grade,
      description: editCourseForm.description.trim(),
      price_egp: Number(editCourseForm.price_egp) || 0,
      teacher_id: editCourseForm.teacher_id || selected.teacher_id,
    });
  };

  const addExamQuestion = () => {
    const q = examQuestionForm;
    const choices = q.question_type === "single_choice" ? q.choices.split("\n").map(x=>x.trim()).filter(Boolean) : q.question_type === "true_false" ? ["صحيح","خطأ"] : [];
    if (q.prompt.trim().length < 4) return setError("اكتب نص السؤال بشكل واضح.");
    if (q.question_type === "single_choice" && choices.length < 2) return setError("أضف اختيارين على الأقل للسؤال.");
    if (["single_choice","true_false"].includes(q.question_type) && !q.correct_answer.trim()) return setError("حدد الإجابة الصحيحة.");
    setExamDraftQuestions(old=>[...old,{...q,id:crypto.randomUUID(),choices,points:Number(q.points)||1}]);
    setExamQuestionForm({prompt:"",question_type:"single_choice",choices:"",correct_answer:"",points:"1"});
    setError("");
  };

  const addHomeworkQuestion = () => {
    const q = homeworkQuestionForm;
    const choices = q.question_type === "single_choice" ? q.choices.split("\n").map(x=>x.trim()).filter(Boolean) : q.question_type === "true_false" ? ["صحيح","خطأ"] : [];
    if (q.prompt.trim().length < 4) return setError("اكتب نص السؤال بشكل واضح.");
    if (q.question_type === "single_choice" && choices.length < 2) return setError("أضف اختيارين على الأقل للسؤال.");
    if (["single_choice","true_false"].includes(q.question_type) && !q.correct_answer.trim()) return setError("حدد الإجابة الصحيحة.");
    setHomeworkDraftQuestions(old=>[...old,{...q,id:crypto.randomUUID(),choices,points:Number(q.points)||1}]);
    setHomeworkQuestionForm({prompt:"",question_type:"single_choice",choices:"",correct_answer:"",points:"1"});
    setError("");
  };

  const createExam = async (event) => {
    event.preventDefault();
    if (!examForm.title.trim() || !examForm.course_id) return;
    if (!examForm.cover_image_url) return setError("ارفع صورة للامتحان قبل إنشائه.");
    if (!examDraftQuestions.length) return setError("أضف سؤالًا واحدًا على الأقل قبل إنشاء الامتحان.");
    setSaving("exam"); setError(""); setNotice("");
    try {
      const body = { title: examForm.title.trim(), course_id: examForm.course_id, duration_minutes: Number(examForm.duration_minutes) || 60, is_published: false, opens_at: examForm.opens_at ? new Date(examForm.opens_at).toISOString() : null, closes_at: examForm.closes_at ? new Date(examForm.closes_at).toISOString() : null, cover_image_url: examForm.cover_image_url || null };
      const rows = await portalApi("owner", "exams", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(body) });
      const created = Array.isArray(rows) ? rows[0] : rows;
      if (!created?.id) throw new Error("exam_not_created");
      const savedQuestions = [];
      for (let i=0;i<examDraftQuestions.length;i++) {
        const q=examDraftQuestions[i];
        const inserted=await portalApi("owner","exam_questions",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({exam_id:created.id,question_type:q.question_type,prompt:q.prompt,choices:q.choices,points:q.points,sort_order:i+1})});
        const saved=Array.isArray(inserted)?inserted[0]:inserted;
        if(!saved?.id)throw new Error("exam_question_not_created");
        savedQuestions.push(saved);
        if(["single_choice","true_false"].includes(q.question_type)) {
          await portalApi("owner","exam_answer_keys",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({question_id:saved.id,correct_answer:q.correct_answer})});
        }
      }
      setExams((old) => [created, ...old]);
      setExamQuestions(old=>[...old,...savedQuestions]);
      setExamForm({ title: "", course_id: "", duration_minutes: "60", opens_at: "", closes_at: "", cover_image_url: "" });
      setExamDraftQuestions([]);
      setNotice("تم إنشاء الامتحان وحفظ "+savedQuestions.length+" سؤال. راجعه ثم انشره.");
    } catch (e) { setError("تعذر إنشاء الامتحان. " + (e.message || "")); }
    finally { setSaving(""); }
  };

  const toggleExam = async (exam) => {
    if (!exam.is_published && examQuestions.filter(q=>q.exam_id===exam.id).length===0) return setError("لا يمكن نشر امتحان بدون أسئلة.");
    if (!window.confirm(exam.is_published ? "إيقاف نشر الامتحان؟" : "نشر الامتحان للطلاب؟")) return;
    setSaving(exam.id); setError(""); setNotice("");
    try {
      const next = !exam.is_published;
      await portalApi("owner", "exams?id=eq." + encodeURIComponent(exam.id), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ is_published: next }) });
      setExams((old) => old.map((x) => x.id === exam.id ? { ...x, is_published: next } : x));
      setNotice(next ? "تم نشر الامتحان." : "تم إيقاف نشر الامتحان.");
    } catch { setError("تعذر تغيير حالة الامتحان."); }
    finally { setSaving(""); }
  };

  const createHomework = async (event) => {
    event.preventDefault();
    if (!homeworkForm.title.trim()) return;
    if (!homeworkForm.cover_image_url) return setError("ارفع صورة للواجب قبل إنشائه.");
    if (!homeworkDraftQuestions.length) return setError("أضف سؤالًا واحدًا على الأقل قبل إنشاء الواجب.");
    setSaving("homework"); setError(""); setNotice("");
    try {
      const rows = await portalApi("owner", "homework_assignments", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({
        title: homeworkForm.title.trim(), description: homeworkForm.description.trim(), grade: homeworkForm.grade,
        group_name: homeworkForm.group_name.trim() || null, due_at: homeworkForm.due_at ? new Date(homeworkForm.due_at).toISOString() : null,
        is_published: false, cover_image_url: homeworkForm.cover_image_url || null, created_by: profile.id,
      }) });
      const created = Array.isArray(rows) ? rows[0] : rows;
      if (!created?.id) throw new Error("homework_not_created");
      const savedQuestions=[];
      for(let i=0;i<homeworkDraftQuestions.length;i++){
        const q=homeworkDraftQuestions[i];
        const inserted=await portalApi("owner","homework_questions",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({assignment_id:created.id,position:i+1,question_type:q.question_type,prompt:q.prompt,choices:q.choices,points:q.points})});
        const saved=Array.isArray(inserted)?inserted[0]:inserted;
        if(!saved?.id)throw new Error("homework_question_not_created");
        savedQuestions.push(saved);
        if(["single_choice","true_false"].includes(q.question_type))await portalApi("owner","homework_answer_keys",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({question_id:saved.id,correct_answer:q.correct_answer})});
      }
      setHomework((old) => [created, ...old]);
      setHomeworkQuestions(old=>[...old,...savedQuestions]);
      setHomeworkForm({ title: "", description: "", grade: GRADES[2], group_name: "", due_at: "", cover_image_url: "", is_published: false });
      setHomeworkDraftQuestions([]);
      setNotice("تم إنشاء الواجب وحفظ "+savedQuestions.length+" سؤال كمسودة.");
    } catch (e) { setError("تعذر إنشاء الواجب. " + (e.message || "")); }
    finally { setSaving(""); }
  };

  const toggleHomework = async (item) => {
    if (!item.is_published && homeworkQuestions.filter(q=>q.assignment_id===item.id).length===0) return setError("لا يمكن نشر واجب بدون أسئلة.");
    if (!window.confirm(item.is_published ? "إيقاف نشر الواجب؟" : "نشر الواجب؟")) return;
    setSaving(item.id); setError(""); setNotice("");
    try {
      const next = !item.is_published;
      await portalApi("owner", "homework_assignments?id=eq." + encodeURIComponent(item.id), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ is_published: next, updated_at: new Date().toISOString() }) });
      setHomework((old) => old.map((x) => x.id === item.id ? { ...x, is_published: next } : x));
      setNotice(next ? "تم نشر الواجب." : "تم إيقاف نشر الواجب.");
    } catch { setError("تعذر تغيير حالة الواجب."); }
    finally { setSaving(""); }
  };

  const generateCode = async () => {
    setSaving("code"); setGeneratedCode(""); setError(""); setNotice("");
    try {
      const result = await portalApi("owner", "rpc/emad_issue_subscription_code", { method: "POST", body: JSON.stringify({ p_grade: codeGrade }) });
      const code = typeof result === "string" ? result : String(result || "").replace(/^"|"$/g, "");
      if (!code || code === "[object Object]") throw new Error("code_not_returned");
      setGeneratedCode(code);
      setNotice("تم إنشاء كود جديد. انسخه الآن؛ لن يمكن استرجاعه كاملًا بعد إغلاق الرسالة.");
      await loadCodes();
    } catch (e) { setError("تعذر إصدار كود الاشتراك. " + (e.message || "")); }
    finally { setSaving(""); }
  };

  const loadCodes = async () => {
    try {
      const rows = await portalApi("owner", "emad_subscription_codes?select=id,grade,created_at,redeemed_by,redeemed_at,expires_at,code_hint&order=created_at.desc&limit=500");
      setCodes(rows || []);
    } catch (e) { setError("تعذر تحديث سجل الأكواد."); }
  };

  const activateSubscription = async (event) => {
    event.preventDefault();
    if (!manualStudent) return setError("اختر الطالب أولًا.");
    setSaving("subscription"); setError(""); setNotice("");
    try {
      const previous = subscriptions.filter((x) => x.student_id === manualStudent && new Date(x.ends_at) > new Date()).sort((a,b) => new Date(b.ends_at)-new Date(a.ends_at))[0];
      const start = previous ? new Date(previous.ends_at) : new Date();
      const end = manualEnd ? new Date(manualEnd) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (!(end > start)) throw new Error("invalid_subscription_dates");
      const rows = await portalApi("owner", "emad_student_subscriptions", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ student_id: manualStudent, grade: manualGrade, starts_at: start.toISOString(), ends_at: end.toISOString() }) });
      const created = Array.isArray(rows) ? rows[0] : rows;
      if (!created?.id) throw new Error("subscription_not_created");
      setSubscriptions((old) => [created, ...old]);
      setManualStudent(""); setManualEnd("");
      setNotice("تم تفعيل / تجديد الاشتراك للطالب.");
    } catch (e) { setError(e.message === "invalid_subscription_dates" ? "تاريخ الانتهاء يجب أن يكون بعد تاريخ بداية الاشتراك." : "تعذر تفعيل الاشتراك. " + (e.message || "")); }
    finally { setSaving(""); }
  };

  const replyToMessage = async (message) => {
    const reply = (replyDrafts[message.id] || "").trim();
    if (!reply) return;
    setSaving(message.id); setError(""); setNotice("");
    try {
      const now = new Date().toISOString();
      await portalApi("owner", "support_messages?id=eq." + encodeURIComponent(message.id), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ admin_reply: reply, replied_by: profile.id, replied_at: now, status: "closed" }) });
      setMessages((old) => old.map((x) => x.id === message.id ? { ...x, admin_reply: reply, replied_at: now, status: "closed" } : x));
      setReplyDrafts((old) => ({ ...old, [message.id]: "" }));
      setNotice("تم إرسال الرد وإغلاق الرسالة.");
    } catch { setError("تعذر إرسال الرد."); }
    finally { setSaving(""); }
  };

  if (busy) return <main className="owner-shell"><div className="owner-loading">جارٍ تأمين وفتح مركز تحكم المالك...</div></main>;
  if (!profile || profile.role !== "owner") return <div className="owner-shell"><div className="owner-denied"><span>OWNER ACCESS</span><h1>دخول بوابة المالك</h1><p>{error || "هذه الصفحة مخصصة للمالك فقط."}</p><button onClick={() => window.location.reload()}>إعادة المحاولة</button><button onClick={() => { logoutPortalSession("owner"); window.location.reload(); }}>تسجيل الدخول بحساب آخر</button></div></div>;

  return <main className="owner-shell owner-control-center" dir="rtl">
    <header className="owner-header owner-hero">
      <div><span>EMAD EL SANAFIRY · MASTER CONTROL</span><h1>مركز التحكم الرئيسي</h1><p>إدارة الطلاب والمدرسين والمحتوى والاشتراكات والتواصل من مكان واحد.</p></div>
      <div className="owner-header-actions"><b>{profile.full_name}</b><button onClick={load}>تحديث شامل</button><button onClick={() => { window.location.href = "/"; }}>المنصة الطلابية</button><button onClick={() => { logoutPortalSession("owner"); window.location.reload(); }}>تسجيل الخروج</button></div>
    </header>
    {error && <p className="owner-error" role="alert">{error}</p>}
    {notice && <p className="owner-notice" role="status">{notice}</p>}
    <section className="owner-stats owner-stats-wide">
      <article><small>إجمالي الحسابات</small><strong>{users.length}</strong><span>{studentUsers.length} طالب</span></article>
      <article><small>المدرسون</small><strong>{teachers.length}</strong><span>حسابات مدرسين</span></article>
      <article><small>الكورسات</small><strong>{courses.length}</strong><span>{courses.filter(x=>x.status==="published").length} منشور</span></article>
      <article><small>الامتحانات</small><strong>{exams.length}</strong><span>{exams.filter(x=>x.is_published).length} منشور</span></article>
      <article><small>اشتراكات فعالة</small><strong>{activeSubscriptions.length}</strong><span>من إجمالي {subscriptions.length}</span></article>
      <article><small>رسائل تنتظر الرد</small><strong>{pendingMessages.length}</strong><span>{messages.length} رسالة</span></article>
    </section>
    <nav className="owner-tabs owner-tabs-rich" aria-label="أقسام مركز التحكم">
      {TABS.map(([id,label,sub]) => <button key={id} className={section===id?"active":""} onClick={()=>{setSection(id);setError("");setNotice("");}}><small>{sub}</small><span>{label}</span>{id==="messages"&&pendingMessages.length>0?<b>{pendingMessages.length}</b>:null}</button>)}
    </nav>

    {section==="overview" && <section className="owner-panel owner-overview-panel">
      <div className="owner-panel-heading"><div><span>PLATFORM OVERVIEW</span><h2>ملخص المنصة</h2></div><button onClick={load}>تحديث الأرقام</button></div>
      <div className="owner-quick-grid">
        {TABS.filter(x=>x[0]!=="overview").map(([id,label,sub])=><button key={id} onClick={()=>setSection(id)}><small>{sub}</small><b>{label}</b><span>{({accounts:users.length,courses:courses.length,exams:exams.length,homework:homework.length,subscriptions:subscriptions.length,payments:payments.length,messages:messages.length})[id] ?? 0}</span></button>)}
      </div>
      <div className="owner-overview-columns">
        <section><h3>آخر الكورسات</h3>{courses.slice(0,5).map(x=><button className="owner-mini-row" key={x.id} onClick={()=>{setSelectedCourse(x.id);setSection("courses");}}>{x.cover_image_url?<img src={x.cover_image_url} alt=""/>:<span className="owner-mini-placeholder">C</span>}<span><b>{x.title}</b><small>{x.grade} · {statusText(x.status)}</small></span></button>)}{!courses.length&&<p className="owner-note">لا توجد كورسات بعد.</p>}</section>
        <section><h3>آخر الرسائل</h3>{messages.slice(0,5).map(x=><article className="owner-mini-row" key={x.id}><span className="owner-mini-placeholder">M</span><span><b>{x.subject}</b><small>{studentName(x.user_id)} · {statusText(x.status)}</small></span></article>)}{!messages.length&&<p className="owner-note">لا توجد رسائل.</p>}</section>
      </div>
    </section>}

    {section==="accounts" && <section className="owner-panel">
      <div className="owner-panel-heading"><div><span>ACCOUNT DIRECTORY</span><h2>الحسابات والطلاب والصلاحيات</h2></div><small>{visibleUsers.length} من {users.length} حساب</small></div>
      <input className="owner-search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="ابحث بالاسم أو رقم الطالب أو الصف أو الهاتف..."/>
      <div className="owner-table-wrap"><table className="owner-table owner-wide-table"><thead><tr><th>الاسم</th><th>رقم الحساب</th><th>الصف / المجموعة</th><th>التواصل</th><th>ولي الأمر</th><th>الصلاحية</th><th>تغيير الصلاحية</th></tr></thead><tbody>
        {visibleUsers.map(user=><tr key={user.id}><td>{user.full_name||"—"}</td><td dir="ltr">{user.student_number||"بوابة إدارية"}</td><td>{user.grade||"—"}<small>{user.group_name||""}</small></td><td dir="ltr">{user.phone||"—"}<small>{[user.governorate,user.city].filter(Boolean).join(" / ")}</small></td><td>{user.parent_name||"—"}<small dir="ltr">{user.parent_phone||""}</small></td><td><span className={"owner-role role-"+user.role}>{({owner:"مالك",teacher:"مدرس",admin:"مدير",student:"طالب"})[user.role]||user.role}</span></td><td><select value={user.role} disabled={saving===user.id||user.id===profile.id||!user.student_number} onChange={e=>changeRole(user,e.target.value)}><option value="student">طالب</option><option value="teacher">مدرس</option><option value="admin">مدير</option><option value="owner">مالك</option></select></td></tr>)}
      </tbody></table></div>
      <p className="owner-note">حساب المالك الحالي محمي من تغيير دوره من داخل الجدول. تغيير الدور لا يحذف حساب الطالب أو بياناته.</p>
    </section>}

    {section==="courses" && <section className="owner-panel">
      <div className="owner-panel-heading"><div><span>COURSE MANAGEMENT</span><h2>إدارة الكورسات والمحاضرات</h2></div><small>{courses.length} كورس · {lessons.length} محاضرة</small></div>
      <div className="owner-management-grid">
        <div className="owner-form-card">
          <h3>إنشاء كورس جديد</h3>
          <form className="owner-form" onSubmit={saveCourse}>
            <label>اسم الكورس<input required value={courseForm.title} onChange={e=>setCourseForm({...courseForm,title:e.target.value})} placeholder="مثال: مراجعة الفصل الأول"/></label>
            <div className="owner-form-two"><label>الصف<select value={courseForm.grade} onChange={e=>setCourseForm({...courseForm,grade:e.target.value})}>{GRADES.map(x=><option key={x}>{x}</option>)}</select></label><label>المادة<input value={courseForm.subject} onChange={e=>setCourseForm({...courseForm,subject:e.target.value})}/></label></div>
            <label>المدرس المسؤول<select value={courseForm.teacher_id} onChange={e=>setCourseForm({...courseForm,teacher_id:e.target.value})}><option value="">اختيار أول مدرس متاح / المالك</option>{teachers.map(x=><option key={x.id} value={x.id}>{x.full_name||"مدرس"} · {x.role}</option>)}</select></label>
            <label>السعر بالجنيه<input type="number" min="0" step="1" value={courseForm.price_egp} onChange={e=>setCourseForm({...courseForm,price_egp:e.target.value})}/></label>
            <label>وصف الكورس<textarea rows="3" value={courseForm.description} onChange={e=>setCourseForm({...courseForm,description:e.target.value})} placeholder="اكتب محتوى الكورس وأهدافه..."/></label>
            <label>صورة غلاف الكورس<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>uploadImage(e.target.files?.[0],"course")}/></label>
            {uploading==="course"&&<small className="owner-upload-state">جارٍ رفع الصورة...</small>}
            {courseForm.cover_image_url&&<img className="owner-image-preview" src={courseForm.cover_image_url} alt="معاينة غلاف الكورس"/>}
            <button className="owner-primary-button" disabled={saving==="course"||uploading==="course"}>{saving==="course"?"جارٍ الحفظ...":"إنشاء الكورس كمسودة"}</button>
          </form>
        </div>
        <div className="owner-library-card">
          <h3>مكتبة الكورسات</h3>
          <div className="owner-media-grid">{courses.map(course=><article className={"owner-media-card "+(selectedCourse===course.id?"selected":"")} key={course.id}>
            <button className="owner-media-open" onClick={()=>setSelectedCourse(course.id)} aria-label={"عرض تفاصيل "+course.title}>
              {course.cover_image_url?<img src={course.cover_image_url} alt={"غلاف "+course.title}/>:<span className="owner-media-fallback">COURSE</span>}
              <span className="owner-media-copy"><b>{course.title}</b><small>{course.grade} · {course.subject}</small></span>
            </button>
            <div className="owner-media-actions"><span className={course.status==="published"?"published":"draft"}>{statusText(course.status)}</span><button disabled={saving===course.id} onClick={()=>updateCourse(course,{status:course.status==="published"?"draft":"published"})}>{course.status==="published"?"إيقاف النشر":"نشر"}</button></div>
          </article>)}</div>
          {!courses.length&&<p className="owner-note">لم تتم إضافة كورسات بعد. ابدأ من نموذج إنشاء الكورس.</p>}
          {selected&&<div className="owner-selected-detail"><h3>تفاصيل الكورس المحدد</h3>{selected.cover_image_url?<img className="owner-detail-cover" src={selected.cover_image_url} alt={selected.title}/>:null}<b>{selected.title}</b><p>{selected.description||"لا يوجد وصف."}</p><small>{selected.grade} · {selected.subject} · {moneyText(selected.price_egp)}</small><div className="owner-detail-meta"><span>المدرس: {studentName(selected.teacher_id)}</span><span>{lessons.filter(x=>x.course_id===selected.id).length} محاضرة</span></div>
            <form className="owner-form owner-edit-course-form" onSubmit={saveCourseEdits}><h4>تعديل بيانات الكورس</h4><label>اسم الكورس<input required value={editCourseForm.title} onChange={e=>setEditCourseForm({...editCourseForm,title:e.target.value})}/></label><div className="owner-form-two"><label>الصف<select value={editCourseForm.grade} onChange={e=>setEditCourseForm({...editCourseForm,grade:e.target.value})}>{GRADES.map(x=><option key={x}>{x}</option>)}</select></label><label>المادة<input value={editCourseForm.subject} onChange={e=>setEditCourseForm({...editCourseForm,subject:e.target.value})}/></label></div><label>المدرس المسؤول<select value={editCourseForm.teacher_id} onChange={e=>setEditCourseForm({...editCourseForm,teacher_id:e.target.value})}>{teachers.map(x=><option key={x.id} value={x.id}>{x.full_name||"مدرس"}</option>)}<option value={profile.id}>المالك</option></select></label><label>السعر<input type="number" min="0" value={editCourseForm.price_egp} onChange={e=>setEditCourseForm({...editCourseForm,price_egp:e.target.value})}/></label><label>الوصف<textarea rows="3" value={editCourseForm.description} onChange={e=>setEditCourseForm({...editCourseForm,description:e.target.value})}/></label><button className="owner-primary-button" disabled={saving===selected.id}>حفظ تعديلات الكورس</button></form>
            <label className="owner-inline-upload">تحديث صورة الكورس<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>updateMediaImage(e.target.files?.[0],"courses",selected)}/></label>
            <div className="owner-lesson-manager"><h3>إدارة محاضرات الكورس</h3>
              {lessons.filter(x=>x.course_id===selected.id).map((lesson,index)=><article key={lesson.id}><span>{String(index+1).padStart(2,"0")}</span><div><b>{lesson.title}</b><small>{lesson.description||"بدون وصف"}</small></div><i className={lesson.is_published?"published":"draft"}>{lesson.is_published?"منشورة":"مسودة"}</i><button disabled={saving===lesson.id} onClick={()=>toggleLesson(lesson)}>{lesson.is_published?"إخفاء":"نشر"}</button></article>)}
              <form className="owner-form" onSubmit={createLesson}><label>عنوان المحاضرة<input required value={lessonForm.title} onChange={e=>setLessonForm({...lessonForm,title:e.target.value})}/></label><label>وصف المحاضرة<input value={lessonForm.description} onChange={e=>setLessonForm({...lessonForm,description:e.target.value})}/></label><label>رابط الفيديو<input dir="ltr" value={lessonForm.video_url} onChange={e=>setLessonForm({...lessonForm,video_url:e.target.value})} placeholder="https://..."/></label><label>محتوى المحاضرة<textarea rows="4" value={lessonForm.content} onChange={e=>setLessonForm({...lessonForm,content:e.target.value})}/></label><button className="owner-primary-button" disabled={saving==="lesson"}>{saving==="lesson"?"جارٍ الحفظ...":"إضافة المحاضرة كمسودة"}</button></form>
            </div></div>}
        </div>
      </div>
    </section>}

    {section==="exams" && <section className="owner-panel">
      <div className="owner-panel-heading"><div><span>EXAM STUDIO</span><h2>إدارة الامتحانات</h2></div><small>{exams.length} امتحان</small></div>
      <div className="owner-management-grid">
        <div className="owner-form-card"><h3>إنشاء امتحان</h3><form className="owner-form" onSubmit={createExam}>
          <label>عنوان الامتحان<input required value={examForm.title} onChange={e=>setExamForm({...examForm,title:e.target.value})} placeholder="امتحان الفصل الأول"/></label>
          <label>الكورس المرتبط<select required value={examForm.course_id} onChange={e=>setExamForm({...examForm,course_id:e.target.value})}><option value="">اختر الكورس</option>{courses.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
          <label>مدة الامتحان بالدقائق<input type="number" min="1" max="600" value={examForm.duration_minutes} onChange={e=>setExamForm({...examForm,duration_minutes:e.target.value})}/></label>
          <div className="owner-form-two"><label>يفتح في<input type="datetime-local" value={examForm.opens_at} onChange={e=>setExamForm({...examForm,opens_at:e.target.value})}/></label><label>يغلق في<input type="datetime-local" value={examForm.closes_at} onChange={e=>setExamForm({...examForm,closes_at:e.target.value})}/></label></div>
          <label>صورة الامتحان<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>uploadImage(e.target.files?.[0],"exam")}/></label>
          {uploading==="exam"&&<small className="owner-upload-state">جارٍ رفع الصورة...</small>}
          {examForm.cover_image_url&&<img className="owner-image-preview" src={examForm.cover_image_url} alt="معاينة صورة الامتحان"/>}
          <div className="owner-question-builder"><h4>بناء أسئلة الامتحان</h4>
            <label>نوع السؤال<select value={examQuestionForm.question_type} onChange={e=>setExamQuestionForm({...examQuestionForm,question_type:e.target.value})}><option value="single_choice">اختيار من متعدد</option><option value="true_false">صح أو خطأ</option><option value="short_answer">إجابة قصيرة</option><option value="essay">سؤال مقالي / مسألة</option></select></label>
            <label>نص السؤال<textarea rows="3" value={examQuestionForm.prompt} onChange={e=>setExamQuestionForm({...examQuestionForm,prompt:e.target.value})}/></label>
            {examQuestionForm.question_type==="single_choice"&&<label>الاختيارات (كل اختيار في سطر)<textarea rows="3" value={examQuestionForm.choices} onChange={e=>setExamQuestionForm({...examQuestionForm,choices:e.target.value})}/></label>}
            {["single_choice","true_false"].includes(examQuestionForm.question_type)&&<label>الإجابة الصحيحة<input value={examQuestionForm.correct_answer} onChange={e=>setExamQuestionForm({...examQuestionForm,correct_answer:e.target.value})} placeholder="اكتب الاختيار كما هو أو صحيح / خطأ"/></label>}
            <label>الدرجة<input type="number" min="0.5" step="0.5" value={examQuestionForm.points} onChange={e=>setExamQuestionForm({...examQuestionForm,points:e.target.value})}/></label>
            <button type="button" className="owner-secondary-button" onClick={addExamQuestion}>إضافة السؤال</button>
            {examDraftQuestions.map((q,i)=><div className="owner-draft-question" key={q.id}><span>{i+1}. {q.prompt}</span><small>{q.points} درجة</small><button type="button" onClick={()=>setExamDraftQuestions(old=>old.filter(x=>x.id!==q.id))}>حذف</button></div>)}
            <small>عدد الأسئلة المضافة: {examDraftQuestions.length}</small>
          </div>
          <button className="owner-primary-button" disabled={saving==="exam"||uploading==="exam"||!courses.length||!examDraftQuestions.length}>{saving==="exam"?"جارٍ الحفظ...":"حفظ الامتحان وأسئلته كمسودة"}</button>
        </form></div>
        <div className="owner-library-card"><h3>الامتحانات الحالية</h3><div className="owner-media-grid">{exams.map(exam=><article className="owner-media-card" key={exam.id}>
          {exam.cover_image_url?<img src={exam.cover_image_url} alt={"صورة "+exam.title}/>:<span className="owner-media-fallback">EXAM</span>}
          <span className="owner-media-copy"><b>{exam.title}</b><small>{courses.find(x=>x.id===exam.course_id)?.title||"كورس غير معروف"} · {exam.duration_minutes} دقيقة</small></span>
          <div className="owner-media-actions"><span className={exam.is_published?"published":"draft"}>{exam.is_published?"منشور":"مسودة"}</span><button disabled={saving===exam.id} onClick={()=>toggleExam(exam)}>{exam.is_published?"إيقاف النشر":"نشر"}</button><label className="owner-file-mini">تغيير الصورة<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>updateMediaImage(e.target.files?.[0],"exams",exam)}/></label></div>
        </article>)}</div>{!exams.length&&<p className="owner-note">لا توجد امتحانات حتى الآن.</p>}</div>
      </div>
      <p className="owner-warning">تنبيه: إنشاء الامتحان وصورته متاحان، لكن يجب إضافة الأسئلة ومفتاح الإجابة ومراجعتها قبل النشر. محرر الأسئلة وتصحيح المحاولات ضمن مرحلة بناء الامتحانات التالية.</p>
    </section>}

    {section==="homework" && <section className="owner-panel">
      <div className="owner-panel-heading"><div><span>HOMEWORK MANAGEMENT</span><h2>إدارة الواجبات والتدريبات</h2></div><small>{homework.length} واجب</small></div>
      <div className="owner-management-grid">
        <div className="owner-form-card"><h3>إنشاء واجب جديد</h3><form className="owner-form" onSubmit={createHomework}>
          <label>عنوان الواجب<input required value={homeworkForm.title} onChange={e=>setHomeworkForm({...homeworkForm,title:e.target.value})}/></label>
          <label>الصف<select value={homeworkForm.grade} onChange={e=>setHomeworkForm({...homeworkForm,grade:e.target.value})}>{GRADES.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>المجموعة (اختياري)<input value={homeworkForm.group_name} onChange={e=>setHomeworkForm({...homeworkForm,group_name:e.target.value})}/></label>
          <label>موعد التسليم<input type="datetime-local" value={homeworkForm.due_at} onChange={e=>setHomeworkForm({...homeworkForm,due_at:e.target.value})}/></label>
          <label>التعليمات<textarea rows="3" value={homeworkForm.description} onChange={e=>setHomeworkForm({...homeworkForm,description:e.target.value})}/></label>
          <label>صورة الواجب<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>uploadImage(e.target.files?.[0],"homework")}/></label>
          {uploading==="homework"&&<small className="owner-upload-state">جارٍ رفع الصورة...</small>}
          {homeworkForm.cover_image_url&&<img className="owner-image-preview" src={homeworkForm.cover_image_url} alt="معاينة صورة الواجب"/>}
          <div className="owner-question-builder"><h4>بناء أسئلة الواجب</h4>
            <label>نوع السؤال<select value={homeworkQuestionForm.question_type} onChange={e=>setHomeworkQuestionForm({...homeworkQuestionForm,question_type:e.target.value})}><option value="single_choice">اختيار من متعدد</option><option value="true_false">صح أو خطأ</option><option value="short_answer">إجابة قصيرة</option><option value="essay">سؤال مقالي / مسألة</option></select></label>
            <label>نص السؤال<textarea rows="3" value={homeworkQuestionForm.prompt} onChange={e=>setHomeworkQuestionForm({...homeworkQuestionForm,prompt:e.target.value})}/></label>
            {homeworkQuestionForm.question_type==="single_choice"&&<label>الاختيارات (كل اختيار في سطر)<textarea rows="3" value={homeworkQuestionForm.choices} onChange={e=>setHomeworkQuestionForm({...homeworkQuestionForm,choices:e.target.value})}/></label>}
            {["single_choice","true_false"].includes(homeworkQuestionForm.question_type)&&<label>الإجابة الصحيحة<input value={homeworkQuestionForm.correct_answer} onChange={e=>setHomeworkQuestionForm({...homeworkQuestionForm,correct_answer:e.target.value})} placeholder="اكتب الاختيار كما هو أو صحيح / خطأ"/></label>}
            <label>الدرجة<input type="number" min="0.5" step="0.5" value={homeworkQuestionForm.points} onChange={e=>setHomeworkQuestionForm({...homeworkQuestionForm,points:e.target.value})}/></label>
            <button type="button" className="owner-secondary-button" onClick={addHomeworkQuestion}>إضافة السؤال</button>
            {homeworkDraftQuestions.map((q,i)=><div className="owner-draft-question" key={q.id}><span>{i+1}. {q.prompt}</span><small>{q.points} درجة</small><button type="button" onClick={()=>setHomeworkDraftQuestions(old=>old.filter(x=>x.id!==q.id))}>حذف</button></div>)}
            <small>عدد الأسئلة المضافة: {homeworkDraftQuestions.length}</small>
          </div>
          <button className="owner-primary-button" disabled={saving==="homework"||uploading==="homework"||!homeworkDraftQuestions.length}>{saving==="homework"?"جارٍ الحفظ...":"حفظ الواجب وأسئلته كمسودة"}</button>
        </form></div>
        <div className="owner-library-card"><h3>الواجبات الحالية</h3><div className="owner-media-grid">{homework.map(item=><article className="owner-media-card" key={item.id}>
          {item.cover_image_url?<img src={item.cover_image_url} alt={"صورة "+item.title}/>:<span className="owner-media-fallback">TASK</span>}
          <span className="owner-media-copy"><b>{item.title}</b><small>{item.grade} · {item.group_name||"كل المجموعات"}</small></span>
          <div className="owner-media-actions"><span className={item.is_published?"published":"draft"}>{statusText(item.is_published?"published":"draft")}</span><button disabled={saving===item.id} onClick={()=>toggleHomework(item)}>{item.is_published?"إيقاف النشر":"نشر"}</button><label className="owner-file-mini">تغيير الصورة<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>updateMediaImage(e.target.files?.[0],"homework_assignments",item)}/></label></div>
        </article>)}</div>{!homework.length&&<p className="owner-note">لا توجد واجبات حتى الآن.</p>}</div>
      </div>
      <p className="owner-warning">الواجب الجديد يُحفظ كمسودة. أضف الأسئلة ومفتاح الإجابة من محرر الواجبات قبل نشره للطلاب؛ لن أنشر واجبًا فارغًا تلقائيًا.</p>
    </section>}

    {section==="subscriptions" && <section className="owner-panel">
      <div className="owner-panel-heading"><div><span>MEMBERSHIP CONTROL</span><h2>إدارة الاشتراكات والأكواد</h2></div><small>{activeSubscriptions.length} اشتراك فعال</small></div>
      <div className="owner-management-grid">
        <div className="owner-form-card"><h3>إصدار كود اشتراك</h3><label>الصف الدراسي<select value={codeGrade} onChange={e=>setCodeGrade(e.target.value)}>{GRADES.map(x=><option key={x}>{x}</option>)}</select></label><button className="owner-primary-button" disabled={saving==="code"} onClick={generateCode}>{saving==="code"?"جارٍ إصدار الكود...":"إنشاء كود جديد"}</button>
          {generatedCode&&<div className="owner-generated-code"><small>الكود الكامل — انسخه الآن</small><strong dir="ltr">{generatedCode}</strong><button onClick={()=>navigator.clipboard?.writeText(generatedCode)}>نسخ الكود</button></div>}
          <div className="owner-divider"/>
          <h3>تفعيل أو تجديد يدوي لطالب</h3><form className="owner-form" onSubmit={activateSubscription}>
            <label>الطالب<select required value={manualStudent} onChange={e=>{setManualStudent(e.target.value);const picked=studentUsers.find(x=>x.id===e.target.value);if(picked?.grade)setManualGrade(picked.grade);}}><option value="">اختر الطالب</option>{studentUsers.map(x=><option key={x.id} value={x.id}>{x.full_name} · {x.student_number||"—"}</option>)}</select></label>
            <label>الصف<select value={manualGrade} onChange={e=>setManualGrade(e.target.value)}>{GRADES.map(x=><option key={x}>{x}</option>)}</select></label>
            <label>تاريخ الانتهاء (اختياري)<input type="datetime-local" value={manualEnd} onChange={e=>setManualEnd(e.target.value)}/></label>
            <button className="owner-primary-button" disabled={saving==="subscription"}>{saving==="subscription"?"جارٍ التفعيل...":"تفعيل / تجديد الاشتراك"}</button>
          </form>
        </div>
        <div className="owner-library-card"><h3>سجل الأكواد</h3><div className="owner-table-wrap"><table className="owner-table"><thead><tr><th>الصف</th><th>آخر 4 رموز</th><th>الحالة</th><th>تاريخ الإنشاء</th><th>استخدم بواسطة</th></tr></thead><tbody>{codes.map(code=><tr key={code.id}><td>{code.grade}</td><td dir="ltr">••••{code.code_hint||"—"}</td><td>{code.redeemed_at?"مستخدم":code.expires_at&&new Date(code.expires_at)<new Date()?"منتهي":"متاح"}</td><td>{dateText(code.created_at)}</td><td>{code.redeemed_by?studentName(code.redeemed_by):"—"}</td></tr>)}</tbody></table></div><button className="owner-secondary-button" onClick={loadCodes}>تحديث سجل الأكواد</button></div>
      </div>
      <div className="owner-panel-subsection"><h3>اشتراكات الطلاب</h3><div className="owner-table-wrap"><table className="owner-table"><thead><tr><th>الطالب</th><th>رقم الطالب</th><th>الصف</th><th>البداية</th><th>الانتهاء</th><th>الحالة</th></tr></thead><tbody>{subscriptions.map(s=><tr key={s.id}><td>{studentName(s.student_id)}</td><td>{studentNumber(s.student_id)}</td><td>{s.grade}</td><td>{dateText(s.starts_at)}</td><td>{dateText(s.ends_at)}</td><td>{new Date(s.ends_at)>new Date()?"فعال":"منتهي"}</td></tr>)}</tbody></table></div></div>
      <p className="owner-warning">الكود الكامل يظهر مرة واحدة عند إنشائه فقط؛ قاعدة البيانات تحتفظ ببصمته وآخر أربعة رموز، ولا تخزن الكود كنص مكشوف.</p>
    </section>}

    {section==="payments" && <section className="owner-panel">
      <div className="owner-panel-heading"><div><span>PAYMENT RECORDS</span><h2>سجل المدفوعات</h2></div><small>{payments.length} عملية مسجلة</small></div>
      <div className="owner-stats owner-payment-stats"><article><small>إجمالي السجلات المدفوعة</small><strong>{payments.filter(x=>x.status==="paid").length}</strong></article><article><small>مبالغ مسجلة كمدفوعة</small><strong>{moneyText(payments.filter(x=>x.status==="paid").reduce((n,x)=>n+Number(x.amount_egp||0),0))}</strong></article><article><small>قيد الانتظار</small><strong>{payments.filter(x=>x.status==="pending").length}</strong></article></div>
      <div className="owner-table-wrap"><table className="owner-table owner-wide-table"><thead><tr><th>الطالب</th><th>رقم الطالب</th><th>الكورس</th><th>المبلغ</th><th>وسيلة الدفع</th><th>المرجع</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>{payments.map(p=><tr key={p.id}><td>{studentName(p.student_id)}</td><td>{studentNumber(p.student_id)}</td><td>{courses.find(c=>c.id===p.course_id)?.title||"—"}</td><td>{moneyText(p.amount_egp)}</td><td>{p.provider}</td><td dir="ltr">{p.provider_reference||"—"}</td><td>{statusText(p.status)}</td><td>{dateText(p.created_at)}</td></tr>)}</tbody></table></div>
      {!payments.length&&<p className="owner-note">لا توجد مدفوعات مسجلة حتى الآن.</p>}
      <p className="owner-warning">هذه صفحة سجل المدفوعات الموجود في قاعدة البيانات فقط. تأكيد الدفع الإلكتروني الآلي لن يكون متاحًا حتى ربط مزود دفع حقيقي والتحقق من إشعاراته الآمنة (Webhook).</p>
    </section>}

    {section==="messages" && <section className="owner-panel owner-inbox">
      <div className="owner-panel-heading"><div><span>STUDENT COMMUNICATION</span><h2>مراسلات الطلاب</h2></div><small>{messages.length} رسالة · {pendingMessages.length} بدون رد</small></div>
      <div className="teacher-message-list">{messages.map(message=><article className="teacher-message-card" key={message.id}>
        <div className="teacher-message-head"><div><b>{message.subject||"رسالة طالب"}</b><small>{studentName(message.user_id)} · {studentNumber(message.user_id)} · {dateText(message.created_at)}</small></div><span className={message.status==="closed"?"closed":"open"}>{message.status==="closed"?"تم الرد":"بانتظار الرد"}</span></div>
        <p>{message.message}</p>
        {message.admin_reply&&<div className="teacher-existing-reply"><b>آخر رد</b><p>{message.admin_reply}</p></div>}
        <textarea value={replyDrafts[message.id]||""} onChange={e=>setReplyDrafts(old=>({...old,[message.id]:e.target.value}))} placeholder="اكتب ردك للطالب..."/>
        <button disabled={saving===message.id||!(replyDrafts[message.id]||"").trim()} onClick={()=>replyToMessage(message)}>{saving===message.id?"جارٍ الإرسال...":"إرسال الرد وإغلاق الرسالة"}</button>
      </article>)}{!messages.length&&<div className="teacher-empty large">لا توجد مراسلات حاليًا.</div>}</div>
    </section>}
    <footer className="owner-footer"><span>EMAD EL SANAFIRY · OWNER CONTROL CENTER</span><span>جلسة مالك مستقلة · بيانات مباشرة من قاعدة البيانات</span></footer>
  </main>;
}
