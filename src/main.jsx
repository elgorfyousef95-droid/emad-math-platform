import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import "./home.css";
import "./responsive.css";
import SplashScreen from "./pages/SplashScreen.jsx";
import AuthScreen from "./pages/AuthScreen.jsx";
import StudentExperience from "./pages/StudentExperience.jsx";
import MessageProvider, { notify } from "./components/MessageProvider.jsx";
import { refreshStudentSession, clearStudentSession, loadStudentWorkspace, studentApi, redeemStudentSubscription, markStudentNotificationRead, issueStudentSubscriptionCode } from "./lib/auth.js";
import { portalLogin, setupPortalAccounts, refreshPortalSession, portalApi, logoutPortalSession, uploadPortalImage, uploadPortalVideo, deletePortalVideo } from "./lib/portalAuth.js";
import OwnerConsole from "./pages/OwnerConsole.jsx";
import ExamRunner from "./components/ExamRunner.jsx";
import ChatWorkspace from "./components/ChatWorkspace.jsx";
import { TeacherMicRequestConsole, StudentLiveClassroom } from "./components/LiveClassroomControls.jsx";
import { getLectureVideoUrl, getLectureEmbedUrl } from "./lib/lectureMedia.js";
import "./pages/PlatformExperienceRefresh.css";

const gradeNames=["الصف الأول الثانوي","الصف الثاني الثانوي","الصف الثالث الثانوي"];
const navByGrade={
 "الصف الأول الثانوي":[["home","الرئيسية","home"],["courses","الكورسات","book"],["lessons","المحاضرات","play"],["exams","الامتحانات","exam"],["homework","الواجبات","task"],["files","المذكرات","file"],["results","درجاتي","chart"]],
 "الصف الثاني الثانوي":[["home","الرئيسية","home"],["courses","الكورسات","book"],["lessons","المحاضرات","play"],["exams","الامتحانات","exam"],["homework","التدريبات","task"],["files","المذكرات","file"],["results","النتائج","chart"]],
 "الصف الثالث الثانوي":[["home","الرئيسية","home"],["courses","مراجعات المنهج","book"],["lessons","المحاضرات","play"],["exams","امتحانات الثانوية","exam"],["homework","واجبات ومراجعات","task"],["files","المذكرات والملخصات","file"],["results","تحليل المستوى","chart"]]
};
const moreNav=[["schedule","جدول الحصص","calendar"],["live","المحاضرات المباشرة","live"],["messages","الدعم الفني","support"],["ai","المساعد الذكي","spark"],["subscriptions","الاشتراكات والأكواد","ticket"],["profile","الملف الشخصي","user"],["settings","الإعدادات","settings"],["groups","الجروبات الدراسية","users"]];
const pageTitles={home:"الرئيسية",courses:"المحتوى التعليمي",lessons:"المحاضرات",exams:"الامتحانات",homework:"الواجبات",files:"المذكرات والملفات",results:"النتائج",schedule:"جدول الحصص",live:"المحاضرات المباشرة",messages:"الدعم الفني",ai:"المساعد الذكي",subscriptions:"الاشتراكات والأكواد",profile:"الملف الشخصي",settings:"الإعدادات",groups:"الجروبات الدراسية",admin:"إدارة المنصة"};
function Icon({name,size=19}){
 const paths={
 home:<><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
 book:<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20M8 7h8"/></>,
 play:<><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="m10 8 6 4-6 4z"/></>,
 exam:<><path d="M7 3h8l4 4v14H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/><path d="M15 3v5h5M8 12h7M8 16h7"/></>,
 task:<><path d="m5 12 4 4L19 6"/><path d="M20 12v7H4V5h11"/></>,
 file:<><path d="M5 3h9l5 5v13H5z"/><path d="M14 3v6h5M8 13h8M8 17h8"/></>,
 chart:<><path d="M4 20V4M4 20h17"/><path d="m7 15 4-4 3 2 6-7"/></>,
 calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h3"/></>,
 live:<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M21 12h-2"/></>,
 support:<><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H6a2 2 0 0 1-2-2zM20 13h-3v6h1a2 2 0 0 0 2-2zM17 20c-1 1-2.5 1-5 1"/></>,
 spark:<><path d="m12 2 2.2 6.2L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.8z"/></>,
 ticket:<><path d="M4 7a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4h16v-4a2 2 0 0 1 0-4V5H4z"/><path d="M13 8v2M13 14v2"/></>,
 user:<><circle cx="12" cy="8" r="3.5"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
 users:<><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
 settings:<><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2Z"/></>,
 bell:<><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
 chevron:<path d="m9 18 6-6-6-6"/>,
 lock:<><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
 logout:<><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>,
 close:<><path d="m6 6 12 12M18 6 6 18"/></>,
 arrow:<><path d="M5 12h14M13 6l6 6-6 6"/></>,
 crown:<><path d="m3 8 5 4 4-7 4 7 5-4-2 12H5z"/></>
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.spark}</svg>;
}
function PortalAccess({portal,onSuccess}){
 const [mode,setMode]=useState("login"),[password,setPassword]=useState(""),[bootstrapToken,setBootstrapToken]=useState(""),[ownerPassword,setOwnerPassword]=useState(""),[teacherPassword,setTeacherPassword]=useState(""),[teacherName,setTeacherName]=useState("مستر عماد السنافيري"),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const isOwner=portal==="owner";
 const title=isOwner?"بوابة المالك":"بوابة مستر عماد";
 const explain=isOwner?"دخول خاص بصاحب المنصة، مستقل عن حسابات الطلاب.":"مساحة المدرس المستقلة لإدارة المحتوى التعليمي.";
 const login=async()=>{
  if(password.length<12)return setError("كلمة المرور لازم تكون 12 حرفًا على الأقل.");
  setBusy(true);setError("");
  try{await portalLogin(portal,password);await onSuccess();}
  catch(e){setError(e.message==="invalid_login"?"كلمة المرور غير صحيحة.":e.message==="portal_profile_not_ready"?"حساب البوابة غير مكتمل الإعداد.":"تعذر تسجيل الدخول. حاول مرة أخرى.");}
  finally{setBusy(false);}
 };
 const setup=async()=>{
  if(ownerPassword.length<12||teacherPassword.length<12)return setError("كل كلمة مرور لازم تكون 12 حرفًا على الأقل.");
  if(ownerPassword===teacherPassword)return setError("استخدم كلمتي مرور مختلفتين للبوابتين.");
  setBusy(true);setError("");
  try{
   await setupPortalAccounts(bootstrapToken,ownerPassword,teacherPassword,teacherName);
   await portalLogin("owner",ownerPassword);
   await onSuccess();
  }catch(e){
   const messages={bootstrap_invalid:"رمز الإعداد غير صحيح أو انتهت صلاحيته أو تم استخدامه من قبل.",invalid_portal_setup_data:"تأكد أن كلمتي المرور مختلفتان وكل واحدة 12 حرفًا على الأقل.",portal_user_lookup_failed:"تعذر التحقق من حسابات البوابات. حاول مرة أخرى.",portal_account_create_failed:"تعذر إنشاء حساب إحدى البوابتين. أعد المحاولة باستخدام نفس بيانات الإعداد.",portal_account_update_failed:"تعذر تحديث كلمة مرور إحدى البوابات.",portal_profile_create_failed:"تم إنشاء حساب الدخول لكن تعذر تجهيز ملف البوابة.",bootstrap_consume_failed:"تعذر تأكيد اكتمال الإعداد. تواصل مع الدعم."};
   setError(messages[e.message]||"تعذر إعداد البوابتين. راجع رمز الإعداد والبيانات وحاول مرة أخرى.");
  }finally{setBusy(false);}
 };
 return <main className="portal-access-shell" dir="rtl"><section className="portal-access-card">
  <span className="portal-access-kicker">EMAD EL SANAFIRY · SECURE PORTAL</span>
  <div className="portal-access-mark">{isOwner?"OWNER":"TEACHER"}</div>
  <h1>{title}</h1><p>{explain}</p>
  {mode==="login"?<>
   <label>كلمة المرور</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="اكتب كلمة المرور" autoComplete="current-password" onKeyDown={e=>e.key==="Enter"&&login()}/>
   <button className="portal-access-submit" disabled={busy} onClick={login}>{busy?"جارٍ التحقق...":"تسجيل الدخول"}</button>
   {isOwner&&<button className="portal-access-switch" onClick={()=>{setMode("setup");setError("");}}>إعداد حسابات البوابتين لأول مرة</button>}
  </>:<>
   <div className="portal-setup-note">إعداد مستقل لأول مرة: لا يحتاج إلى حساب طالب أو جلسة طالب. أدخل رمز الإعداد الخاص، ثم عيّن كلمة مرور مستقلة لكل بوابة.</div>
   <label>رمز إعداد البوابتين</label><input type="password" value={bootstrapToken} onChange={e=>setBootstrapToken(e.target.value)} placeholder="أدخل رمز الإعداد" autoComplete="off"/>
   <label>كلمة مرور بوابة المالك</label><input type="password" value={ownerPassword} onChange={e=>setOwnerPassword(e.target.value)} placeholder="12 حرفًا على الأقل" autoComplete="new-password"/>
   <label>كلمة مرور بوابة مستر عماد</label><input type="password" value={teacherPassword} onChange={e=>setTeacherPassword(e.target.value)} placeholder="كلمة مرور مختلفة" autoComplete="new-password"/>
   <label>اسم المدرس الظاهر</label><input value={teacherName} onChange={e=>setTeacherName(e.target.value)} maxLength={100}/>
   <button className="portal-access-submit" disabled={busy} onClick={setup}>{busy?"جارٍ إعداد الحسابات...":"إنشاء البوابتين وتأمينهما"}</button>
   <button className="portal-access-switch" onClick={()=>{setMode("login");setError("");}}>العودة لتسجيل الدخول</button>
  </>}
  {error&&<div className="portal-access-error">{error}</div>}
  <button className="portal-access-back" onClick={()=>window.location.href="/"}>العودة إلى المنصة الطلابية</button>
 </section></main>;
}


function TeacherLiveStudio({profile}){
 return <TeacherMicRequestConsole profile={profile}/>;
}

function TeacherConsole(){
 const [profile,setProfile]=useState(null),[courses,setCourses]=useState([]),[lessons,setLessons]=useState([]),[students,setStudents]=useState([]),[messages,setMessages]=useState([]),[section,setSection]=useState("overview"),[replyDrafts,setReplyDrafts]=useState({}),[selected,setSelected]=useState(""),[busy,setBusy]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[studentFilter,setStudentFilter]=useState("");
 const [courseForm,setCourseForm]=useState({title:"",subject:"رياضيات",grade:"الصف الثالث الثانوي",description:"",cover_image_url:""});
 const [lessonForm,setLessonForm]=useState({title:"",description:"",content:"",video_url:"",cover_image_url:"",duration_minutes:"0",duration_seconds:"0"});
 const [lessonVideoPreviewUrl,setLessonVideoPreviewUrl]=useState("");
 const [editingLessonId,setEditingLessonId]=useState(""),[uploadingVideo,setUploadingVideo]=useState(false);
 const [uploadProgress,setUploadProgress]=useState(0);
 const load=async()=>{
  setBusy(true);setError("");
  try{
   const session=await refreshPortalSession("teacher");
   if(!session?.access_token)throw new Error("not_authenticated");
   const rows=await portalApi("teacher", "profiles?select=id,full_name,student_number,role&id=eq."+encodeURIComponent(session.user?.id));
   const me=(rows||[])[0]||null;
   setProfile(me);
   if(me?.role!=="teacher")throw new Error("not_teacher");
   const list=await portalApi("teacher", "courses?select=id,title,description,subject,grade,status,cover_image_url,created_at&teacher_id=eq."+encodeURIComponent(me.id)+"&order=created_at.desc");
   setCourses(list||[]);
   const courseGrades=[...new Set((list||[]).map(course=>course.grade).filter(Boolean))];
   const gradeFilter=courseGrades.map(grade=>encodeURIComponent('"'+grade+'"')).join(",");
   const studentPath="profiles?select=id,full_name,student_number,grade,group_name,phone,parent_name,parent_phone,governorate,city,avatar_url,created_at&role=eq.student"+(courseGrades.length?"&grade=in.("+gradeFilter+")":"&limit=0");
   const studentRows=courseGrades.length?await portalApi("teacher",studentPath):[];
   const studentIds=(studentRows||[]).map(student=>student.id);
   const messageRows=studentIds.length?await portalApi("teacher","support_messages?select=id,user_id,subject,message,status,created_at,admin_reply,replied_at&user_id=in.("+studentIds.join(",")+")&order=created_at.desc&limit=200"):[];
   setStudents(studentRows||[]);setMessages(messageRows||[]);
   const first=(list||[]).find(x=>x.id===selected)?.id||(list||[])[0]?.id||"";
   setSelected(first);
  }catch(e){
   setError(e.message==="not_authenticated"?"سجّل الدخول بحساب المدرس من المنصة أولًا.":e.message==="not_teacher"?"هذا الرابط مخصص لحساب المدرس المعتمد فقط.":"تعذر تحميل بيانات لوحة المدرس. راجع صلاحية الحساب واتصال المنصة.");
  }finally{setBusy(false);}
 };
 useEffect(()=>{load();},[]);
 useEffect(()=>{const nodes=[document.documentElement,document.body,document.getElementById("root")].filter(Boolean);nodes.forEach(node=>node.classList.add("admin-scroll-mode"));return()=>nodes.forEach(node=>node.classList.remove("admin-scroll-mode"));},[]);
 useEffect(()=>{
  let active=true;
  const fetchLessons=async()=>{
   if(!selected){setLessons([]);return;}
   try{const rows=await portalApi("teacher", "lessons?select=id,course_id,title,description,content,video_url,duration_minutes,duration_seconds,sort_order,is_published,cover_image_url,created_at&course_id=eq."+encodeURIComponent(selected)+"&order=sort_order.asc,created_at.asc");if(active)setLessons(rows||[]);}
   catch{if(active)setError("تعذر تحميل الفيديوهات لهذا الكورس.");}
  };
  fetchLessons();return()=>{active=false;};
 },[selected]);
 const createCourse=async(e)=>{
  e.preventDefault();if(!courseForm.cover_image_url)return setError("ارفع صورة غلاف للكورس قبل إنشائه.");setSaving(true);setError("");setNotice("");
  try{
   const rows=await portalApi("teacher", "courses",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({...courseForm,price_egp:0,teacher_id:profile.id,status:"draft"})});
   const created=Array.isArray(rows)?rows[0]:rows;
   if(!created?.id)throw new Error("create_failed");
   setCourses(old=>[created,...old]);setSelected(created.id);setCourseForm({title:"",subject:"رياضيات",grade:"الصف الثالث الثانوي",description:"",cover_image_url:""});setNotice("تم إنشاء الكورس كمسودة. راجعه ثم انشره.");
  }catch{setError("لم يتم إنشاء الكورس. تأكد من البيانات وصلاحيات المدرس.");}
  finally{setSaving(false);}
 };
 const uploadCourseCover=async(file)=>{
  if(!file)return;setError("");setNotice("");
  try{const url=await uploadPortalImage(file,"teacher");setCourseForm(old=>({...old,cover_image_url:url}));setNotice("تم رفع صورة غلاف الكورس.");}
  catch(e){setError(e.message==="image_too_large"?"حجم الصورة أكبر من 5 ميجابايت.":"تعذر رفع الصورة. تحقق من صيغة الصورة وصلاحيات التخزين.");}
 };
 const uploadLessonCover=async(file)=>{
  if(!file)return;setError("");setNotice("");
  try{const url=await uploadPortalImage(file,"teacher");setLessonForm(old=>({...old,cover_image_url:url}));setNotice("تم رفع صورة الفيديو.");}
  catch(e){setError(e.message==="image_too_large"?"حجم الصورة أكبر من 5 ميجابايت.":"تعذر رفع صورة الفيديو.");}
 };
 const uploadLessonVideo=async(file)=>{if(!file)return;setUploadProgress(0);setUploadingVideo(true);setSaving(true);setError("");setNotice("");try{const path=await uploadPortalVideo(file,"teacher",(percent)=>setUploadProgress(percent));setLessonForm(old=>({...old,video_url:path,duration_minutes:"0",duration_seconds:"0"}));setLessonVideoPreviewUrl("");setNotice("تم رفع الفيديو وحفظ مساره. جارٍ تجهيز المعاينة...");try{const previewUrl=await getLectureVideoUrl(path,"teacher");setLessonVideoPreviewUrl(previewUrl);const measured=await new Promise(resolve=>{const probe=document.createElement("video");probe.preload="metadata";probe.onloadedmetadata=()=>{const value=Number.isFinite(probe.duration)?Math.round(probe.duration):0;probe.removeAttribute("src");probe.load();resolve(value);};probe.onerror=()=>resolve(0);probe.src=previewUrl;});if(measured>0)setLessonForm(old=>({...old,duration_seconds:String(measured),duration_minutes:String(Math.ceil(measured/60))}));setNotice(measured>0?"تم رفع الفيديو واستخراج مدته تلقائيًا. احفظ الفيديو كمسودة ثم انشرها بعد المراجعة.":"تم رفع الفيديو. تعذر قراءة المدة تلقائيًا من الملف الحالي.");}catch(previewError){console.error("teacher_video_preview",previewError);setNotice("تم رفع الفيديو بنجاح وحُفظ مساره. تعذرت المعاينة الآن، لكن يمكنك حفظ الفيديو وإعادة المحاولة.");}}catch(e){console.error("teacher_video_upload",e);setError(e.message==="video_too_large"?"حجم الفيديو أكبر من 1 جيجابايت.":e.message==="unsupported_video_type"?"الصيغ المسموحة MP4 وWEBM وMOV.":"فشل رفع الفيديو نفسه. راجع الاتصال وصلاحية التخزين ثم حاول مرة أخرى.");}finally{setSaving(false);setUploadingVideo(false);}};
 const createLesson=async(e)=>{
  e.preventDefault();if(!selected)return;if(!lessonForm.cover_image_url)return setError("ارفع صورة للفيديو قبل حفظه.");setSaving(true);setError("");setNotice("");
  try{
   const payload={...lessonForm,course_id:selected,sort_order:editingLessonId?(lessons.find(x=>x.id===editingLessonId)?.sort_order||1):lessons.length+1,duration_seconds:Number(lessonForm.duration_seconds)||null,duration_minutes:Number(lessonForm.duration_minutes)||null};
   if(editingLessonId){
    const rows=await portalApi("teacher","lessons?id=eq."+encodeURIComponent(editingLessonId),{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify(payload)});
    const updated=Array.isArray(rows)?rows[0]:rows;
    setLessons(old=>old.map(x=>x.id===editingLessonId?{...x,...payload,...(updated||{})}:x));setNotice("تم حفظ تعديلات الفيديو.");
   }else{
    const rows=await portalApi("teacher","lessons",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({...payload,is_published:false})});
    const created=Array.isArray(rows)?rows[0]:rows;if(!created?.id)throw new Error("create_failed");
    setLessons(old=>[...old,created]);setNotice("تم حفظ الفيديو كمسودة.");
   }
   setLessonForm({title:"",description:"",content:"",video_url:"",cover_image_url:"",duration_minutes:"0",duration_seconds:"0"});setLessonVideoPreviewUrl("");setEditingLessonId("");
  }catch(e){setError("لم يتم حفظ الفيديو. "+(e.message||"تحقق من صلاحية الكورس والبيانات."));}
  finally{setSaving(false);}
 };
 const editLesson=async(lesson)=>{
  setEditingLessonId(lesson.id);
  setLessonForm({title:lesson.title||"",description:lesson.description||"",content:lesson.content||"",video_url:lesson.video_url||"",cover_image_url:lesson.cover_image_url||"",duration_minutes:String(lesson.duration_minutes||0),duration_seconds:String(lesson.duration_seconds||0)});
  setLessonVideoPreviewUrl("");
  if(lesson.video_url){try{const url=await getLectureVideoUrl(lesson.video_url,"teacher");setLessonVideoPreviewUrl(url);}catch{setNotice("تم فتح بيانات الفيديو، لكن تعذر تجهيز معاينة الفيديو.");}}
  setNotice("أنت تعدّل الفيديو المحددة. احفظ التعديلات عند الانتهاء.");
 };
 const toggleCourse=async(course)=>{
  const status=course.status==="published"?"draft":"published";setSaving(true);setError("");setNotice("");
  try{await portalApi("teacher", "courses?id=eq."+encodeURIComponent(course.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status})});setCourses(old=>old.map(x=>x.id===course.id?{...x,status}:x));setNotice(status==="published"?"تم نشر الكورس.":"تم إرجاع الكورس إلى المسودات.");}
  catch{setError("تعذر تحديث حالة الكورس.");}finally{setSaving(false);}
 };
 const toggleLesson=async(lesson)=>{
  const is_published=!lesson.is_published;setSaving(true);setError("");setNotice("");
  try{await portalApi("teacher", "lessons?id=eq."+encodeURIComponent(lesson.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({is_published})});setLessons(old=>old.map(x=>x.id===lesson.id?{...x,is_published}:x));setNotice(is_published?"تم نشر الفيديو.":"تم إخفاء الفيديو.");}
  catch{setError("تعذر تحديث الفيديو.");}finally{setSaving(false);}
 };
 const deleteLesson=async(lesson)=>{
  if(!window.confirm("حذف الفيديو «"+lesson.title+"» نهائيًا؟"))return;
  setSaving(true);setError("");setNotice("");
  try{
   await portalApi("teacher","lessons?id=eq."+encodeURIComponent(lesson.id),{method:"DELETE",headers:{Prefer:"return=minimal"}});
   try{await deletePortalVideo(lesson.video_url,"teacher");}catch(mediaError){console.warn("lecture_media_cleanup",mediaError);}
   setLessons(old=>old.filter(x=>x.id!==lesson.id));setNotice("تم حذف الفيديو.");
  }catch(e){setError("تعذر حذف الفيديو. "+(e.message||""));}
  finally{setSaving(false);}
 };
 const current=courses.find(x=>x.id===selected);
 const replyToMessage=async(message)=>{
  const reply=(replyDrafts[message.id]||"").trim();
  if(!reply)return;
  setSaving(true);setError("");setNotice("");
  try{
   await portalApi("teacher", "support_messages?id=eq."+encodeURIComponent(message.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({admin_reply:reply,replied_by:profile.id,replied_at:new Date().toISOString(),status:"closed"})});
   setMessages(old=>old.map(x=>x.id===message.id?{...x,admin_reply:reply,replied_by:profile.id,replied_at:new Date().toISOString(),status:"closed"}:x));
   setReplyDrafts(old=>({...old,[message.id]:""}));setNotice("تم إرسال الرد وحفظه في سجل الرسالة.");
  }catch{setError("تعذر إرسال الرد. تحقق من صلاحية الرسالة.");}
  finally{setSaving(false);}
 };
 if(busy)return <main className="owner-shell"><div className="owner-loading">جارٍ التحقق من صلاحية المدرس...</div></main>;
 if(!profile||profile.role!=="teacher")return <PortalAccess portal="teacher" onSuccess={load}/>;
 return <main className="teacher-shell" dir="rtl">
  <header className="teacher-header"><div><span>EMAD EL SANAFIRY · TEACHER STUDIO</span><h1>مساحة المدرس</h1><p>إدارة الكورسات والفيديوهات ومتابعة الطلاب والتواصل والبث المباشر.</p></div><div className="teacher-header-actions"><b>{profile.full_name}</b><button onClick={()=>window.location.href="/"}>المنصة الطلابية</button><button onClick={()=>{logoutPortalSession("teacher");window.location.reload();}}>تسجيل الخروج</button></div></header>
  {error&&<p className="teacher-alert error" role="status">{error}</p>}{notice&&<p className="teacher-alert success" role="status">{notice}</p>}
  <section className="teacher-stats"><article><small>كورساتك</small><strong>{courses.length}</strong></article><article><small>كورسات منشورة</small><strong>{courses.filter(x=>x.status==="published").length}</strong></article><article><small>إجمالي الفيديوهات</small><strong>{lessons.length}</strong></article><article><small>فيديوهات منشورة</small><strong>{lessons.filter(x=>x.is_published).length}</strong></article></section>
  <div className="teacher-studio-body">
   <aside className="teacher-studio-sidebar">
    <div className="teacher-side-heading"><span>TEACHER STUDIO</span><b>مساحة مستر عماد</b><small>إدارة الفيديوهات والبث المباشر</small></div>
    <nav className="teacher-tabs" aria-label="أقسام بوابة المدرس">
     <button className={section==="overview"?"active":""} onClick={()=>setSection("overview")}><span>⌂</span> لوحة المتابعة</button>
     <button className={section==="courses"?"active":""} onClick={()=>setSection("courses")}><span>▤</span> الكورسات</button>
     <button className={section==="lessons"?"active":""} onClick={()=>setSection("lessons")}><span>▶</span> المحاضرات</button>
     <button className={section==="students"?"active":""} onClick={()=>setSection("students")}><span>♙</span> الطلاب <b>{students.length}</b></button>
     <button className={section==="live"?"active":""} onClick={()=>setSection("live")}><span>●</span> البث المباشر</button>
     <button className={section==="groups"?"active":""} onClick={()=>setSection("groups")}><span>◎</span> الجروبات</button>
     <button className={section==="messages"?"active":""} onClick={()=>setSection("messages")}><span>✉</span> محادثات الطلاب</button>
    </nav>
    <div className="teacher-side-note"><b>اتصال مباشر</b><span>البيانات محفوظة على قاعدة المنصة الحالية.</span></div>
   </aside>
   <div className="teacher-studio-content">
  {section==="overview"&&<section className="teacher-panel teacher-overview-panel" dir="rtl">
   <div className="teacher-panel-heading"><div><span>TEACHER CONTROL CENTER</span><h2>ملخص إدارة المدرس</h2></div><small>أهلاً {profile.full_name||"مستر عماد"}</small></div>
   <div className="teacher-overview-intro"><div><b>كل أدوات إدارة المادة في مكان واحد</b><p>إدارة الكورسات والفيديوهات والبث المباشر ومتابعة الطلاب من مكان واحد.</p></div><button onClick={load}>تحديث بيانات اللوحة</button></div>
   <div className="teacher-overview-actions">
    <button onClick={()=>setSection("courses")}><span>01</span><b>إدارة الكورسات</b><small>إنشاء الكورسات وتعديلها ونشرها</small><strong>{courses.length} كورس</strong></button>
    <button onClick={()=>setSection("lessons")}><span>02</span><b>إدارة المحاضرات</b><small>إضافة الفيديوهات داخل الكورسات وتنظيم الدروس</small><strong>{lessons.length} فيديو</strong></button>
    <button onClick={()=>setSection("students")}><span>03</span><b>متابعة الطلاب</b><small>عرض الطلاب المرتبطين بكورساتك</small><strong>{students.length} طالب</strong></button>
    <button onClick={()=>setSection("live")}><span>03</span><b>البث المباشر</b><small>ابدأ حصة مباشرة وتواصل مع الطلاب</small><strong>فتح استوديو البث</strong></button>
    <button onClick={()=>setSection("groups")}><span>04</span><b>جروبات الصفوف</b><small>التواصل مع مجموعات الطلاب</small><strong>فتح مركز التواصل</strong></button>
    <button onClick={()=>setSection("messages")}><span>05</span><b>مراسلات الطلاب</b><small>متابعة استفسارات الطلاب والرد عليها</small><strong>{messages.filter(x=>x.status!=="closed").length} بانتظار الرد</strong></button>
   </div>
   <div className="teacher-overview-bottom">
    <article><h3>محتوى يحتاج متابعة</h3><p>كورسات غير منشورة: <b>{courses.filter(x=>x.status!=="published").length}</b></p><p>فيديوهات غير منشورة: <b>{lessons.filter(x=>!x.is_published).length}</b></p></article>
    <article><h3>تذكير بالصلاحيات</h3><p>هذه اللوحة مخصصة لإدارة كورساتك وطلاب الصفوف المرتبطة بها. إعدادات المالك والحسابات والاشتراكات العامة تظل في لوحة المالك.</p></article>
   </div>
  </section>}
  {(section==="courses"||section==="lessons")&&<div className={"teacher-layout teacher-layout-"+section}>
   <section className="teacher-panel"><div className="teacher-panel-heading"><div><span>COURSE LIBRARY</span><h2>كورساتي</h2></div><small>{courses.length} كورس</small></div>
    {courses.length?<div className="teacher-course-list">{courses.map(course=><button key={course.id} className={selected===course.id?"teacher-course active":"teacher-course"} onClick={()=>setSelected(course.id)}>{course.cover_image_url?<img className="teacher-course-thumb" src={course.cover_image_url} alt=""/>:<span className="teacher-course-thumb teacher-course-thumb-empty">C</span>}<span><b>{course.title}</b><small>{course.grade||"صف غير محدد"} · {course.subject||"رياضيات"}</small></span><i className={course.status==="published"?"published":"draft"}>{course.status==="published"?"منشور":"مسودة"}</i></button>)}</div>:<div className="teacher-empty">لم تنشئ كورسات بعد. ابدأ بإنشاء أول كورس.</div>}
    <form className="teacher-form" onSubmit={createCourse}><h3>إنشاء كورس جديد</h3><input required value={courseForm.title} onChange={e=>setCourseForm({...courseForm,title:e.target.value})} placeholder="اسم الكورس"/><div className="teacher-form-grid"><select value={courseForm.grade} onChange={e=>setCourseForm({...courseForm,grade:e.target.value})}><option>الصف الأول الثانوي</option><option>الصف الثاني الثانوي</option><option>الصف الثالث الثانوي</option></select><input value={courseForm.subject} onChange={e=>setCourseForm({...courseForm,subject:e.target.value})} placeholder="المادة"/></div><textarea value={courseForm.description} onChange={e=>setCourseForm({...courseForm,description:e.target.value})} placeholder="وصف الكورس"/><label className="teacher-image-label">صورة غلاف الكورس<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>uploadCourseCover(e.target.files?.[0])}/></label>{courseForm.cover_image_url&&<img className="teacher-course-preview" src={courseForm.cover_image_url} alt="معاينة غلاف الكورس"/>}<button disabled={saving||!courseForm.cover_image_url}>إنشاء كمسودة</button></form>
   </section>
   <section className="teacher-panel teacher-lessons-panel">{section==="lessons"&&<label className="teacher-lesson-course-picker">اختيار الكورس<select value={selected} onChange={e=>setSelected(e.target.value)}>{courses.map(course=><option key={course.id} value={course.id}>{course.title}</option>)}</select></label>}<div className="teacher-panel-heading"><div><span>LECTURE MANAGEMENT</span><h2>{current?current.title:"اختر كورسًا"}</h2></div>{current?<i className={current.status==="published"?"published":"draft"}>{current.status==="published"?"منشور":"مسودة"}</i>:null}</div>
    {current?<>{current.cover_image_url&&<img className="teacher-course-detail-image" src={current.cover_image_url} alt={current.title}/>}<div className="teacher-course-actions"><p>{current.description||"لا يوجد وصف للكورس."}</p><button disabled={saving} onClick={()=>toggleCourse(current)}>{current.status==="published"?"إيقاف النشر":"نشر الكورس"}</button></div>
     <div className="teacher-lesson-list">{lessons.map((lesson,index)=><article key={lesson.id}>{lesson.cover_image_url?<img className="teacher-lesson-thumb" src={lesson.cover_image_url} alt=""/>:<span className="teacher-lesson-number">{String(index+1).padStart(2,"0")}</span>}<div><b>{lesson.title}</b><small>{lesson.description||"بدون وصف"}</small></div><i className={lesson.is_published?"published":"draft"}>{lesson.is_published?"منشورة":"مسودة"}</i><div className="teacher-lesson-actions"><button disabled={saving} onClick={()=>editLesson(lesson)}>تعديل</button><button disabled={saving} onClick={()=>toggleLesson(lesson)}>{lesson.is_published?"إخفاء":"نشر"}</button><button className="teacher-danger-button" disabled={saving} onClick={()=>deleteLesson(lesson)}>حذف</button></div></article>)}{!lessons.length?<div className="teacher-empty">لا توجد فيديوهات في هذا الكورس بعد.</div>:null}</div>
     <form className="teacher-form" onSubmit={createLesson}><h3>{editingLessonId?"تعديل الفيديو":"إضافة فيديو"}</h3><input required value={lessonForm.title} onChange={e=>setLessonForm({...lessonForm,title:e.target.value})} placeholder="عنوان الفيديو"/><input value={lessonForm.description} onChange={e=>setLessonForm({...lessonForm,description:e.target.value})} placeholder="وصف مختصر"/><div className="teacher-video-selected">{lessonForm.video_url?(Number(lessonForm.duration_seconds)>0?"مدة الفيديو المستخرجة تلقائيًا: "+Math.floor(Number(lessonForm.duration_seconds)/60)+" دقيقة و"+(Number(lessonForm.duration_seconds)%60)+" ثانية":"تم اختيار الفيديو — ستظهر مدته بعد تجهيز المعاينة"):"مدة الفيديو تُستخرج تلقائيًا بعد رفعه"}</div><label className="teacher-video-label"><span>اختيار الفيديو من الهاتف أو الجهاز</span><small>افتح المعرض أو الملفات واختر الفيديو مباشرة — MP4 أو WEBM أو MOV، حتى 1GB · رفع متقطع قابل للاستكمال</small><input type="file" accept="video/mp4,video/webm,video/quicktime" disabled={uploadingVideo} onChange={e=>uploadLessonVideo(e.target.files?.[0])}/></label>{uploadingVideo&&<div className="lecture-upload-progress" role="status"><div><span>رفع الفيديو</span><b>{uploadProgress}%</b></div><progress max="100" value={uploadProgress}/><small>لو الاتصال انقطع، اختر نفس الملف مرة أخرى لاستكمال الرفع.</small></div>}{lessonForm.video_url&&(lessonVideoPreviewUrl?(getLectureEmbedUrl(lessonVideoPreviewUrl)?<iframe className="lecture-video-embed" src={getLectureEmbedUrl(lessonVideoPreviewUrl)} title="معاينة فيديو الفيديو" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>:<video className="teacher-video-preview" src={lessonVideoPreviewUrl} controls playsInline preload="metadata"/>):<div className="course-player-error">تم رفع الفيديو وحفظ مساره. المعاينة الخاصة لم تجهز بعد؛ احفظ الفيديو ثم أعد المحاولة.</div>)}<textarea value={lessonForm.content} onChange={e=>setLessonForm({...lessonForm,content:e.target.value})} placeholder="وصف الفيديو أو ملاحظات الشرح"/><label className="teacher-image-label">صورة الفيديو<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>uploadLessonCover(e.target.files?.[0])}/></label>{lessonForm.cover_image_url&&<img className="teacher-course-preview" src={lessonForm.cover_image_url} alt="معاينة صورة الفيديو"/>}<button disabled={saving||!lessonForm.cover_image_url}>{saving?"جارٍ الحفظ...":editingLessonId?"حفظ التعديلات":"حفظ الفيديو كمسودة"}</button>{editingLessonId&&<button type="button" onClick={()=>{setEditingLessonId("");setLessonForm({title:"",description:"",content:"",video_url:"",cover_image_url:"",duration_minutes:"0",duration_seconds:"0"});setLessonVideoPreviewUrl("");}}>إلغاء التعديل</button>}</form>
    </>:<div className="teacher-empty large">أنشئ كورسًا جديدًا أو اختر كورسًا من القائمة لبدء إضافة الفيديوهات.</div>}
   </section>
  </div>}
  {section==="live"&&<TeacherLiveStudio profile={profile}/>}
  {section==="groups"&&<ChatWorkspace profile={profile} mode="teacher" portal="teacher"/>}
  {section==="live"&&<TeacherLiveStudio profile={profile}/>}
  {section==="students"&&<section className="teacher-panel teacher-directory" dir="rtl">
   <div className="teacher-panel-heading"><div><span>STUDENT FOLLOW-UP</span><h2>إدارة ومتابعة الطلاب</h2></div><small>{students.length} طالب</small></div>
   <input className="teacher-student-search" value={studentFilter} onChange={e=>setStudentFilter(e.target.value)} placeholder="ابحث باسم الطالب أو رقم الحساب أو المجموعة..."/>
   <p className="teacher-directory-note">تظهر هنا حسابات الطلاب في الصفوف المرتبطة بالكورسات التي تديرها فقط.</p>
   <div className="teacher-student-grid">{students.filter(s=>[s.full_name,s.student_number,s.grade,s.group_name,s.phone].join(" ").toLowerCase().includes(studentFilter.toLowerCase())).map(student=><article className="teacher-student-card" key={student.id}>
    <div className="teacher-student-top"><span className="teacher-student-avatar">{student.avatar_url?<img src={student.avatar_url} alt=""/>:(student.full_name||"ط").slice(0,1)}</span><div><b>{student.full_name||"طالب"}</b><small>رقم الطالب: {student.student_number||"—"}</small></div></div>
    <dl><div><dt>الصف</dt><dd>{student.grade||"—"}</dd></div><div><dt>المجموعة</dt><dd>{student.group_name||"—"}</dd></div><div><dt>الهاتف</dt><dd dir="ltr">{student.phone||"—"}</dd></div><div><dt>ولي الأمر</dt><dd>{student.parent_name||"—"}</dd></div><div><dt>هاتف ولي الأمر</dt><dd dir="ltr">{student.parent_phone||"—"}</dd></div><div><dt>المحافظة / المدينة</dt><dd>{[student.governorate,student.city].filter(Boolean).join(" / ")||"—"}</dd></div></dl>
   </article>)}{!students.length&&<div className="teacher-empty large">لا يوجد طلاب ظاهرون حتى الآن في الصفوف المرتبطة بكورساتك.</div>}</div>
  </section>}
  {section==="messages"&&<ChatWorkspace profile={profile} mode="teacher_support" portal="teacher"/>}
   </div>
  </div>
  <p className="teacher-footnote">صلاحيات هذه البوابة محدودة بحساب المدرس وكورسات المدرس نفسه. لا تتيح إدارة حساب المالك أو إعدادات المنصة العليا.</p>
 </main>;
}

function App(){
 const [page,setPage]=useState("splash"),[profile,setProfile]=useState(null),[subscription,setSubscription]=useState(null),[notifications,setNotifications]=useState([]),[moreOpen,setMoreOpen]=useState(false),[accountOpen,setAccountOpen]=useState(false),[mobileNav,setMobileNav]=useState(false),[loading,setLoading]=useState(false);
 const pageRef=useRef(page);
 useEffect(()=>{pageRef.current=page;},[page]);
 useEffect(()=>{const marker="emad-platform";const current={marker,page:"splash"};try{window.history.replaceState({marker,guard:true},"",window.location.href);window.history.pushState(current,"",window.location.href);}catch{}const onPopState=event=>{const state=event.state;const validPages=["splash","login","signup","home","courses","lessons","exams","homework","files","results","schedule","live","messages","ai","subscriptions","profile","settings","groups","admin","notifications"];if(state?.marker===marker&&!state.guard&&validPages.includes(state.page)){pageRef.current=state.page;setPage(state.page);setMoreOpen(false);setAccountOpen(false);setMobileNav(false);return;}try{window.history.pushState({marker,page:pageRef.current},"",window.location.href);}catch{setPage(pageRef.current);}};window.addEventListener("popstate",onPopState);return()=>window.removeEventListener("popstate",onPopState);},[]);
 const loadWorkspace=async()=>{setLoading(true);try{const w=await loadStudentWorkspace();setProfile(w.profile);setSubscription(w.subscription);setNotifications(w.notifications);return w;}catch(e){console.error("workspace_load",e);setProfile(null);setSubscription(null);setNotifications([]);throw e;}finally{setLoading(false);}};
 const completeSplash=async()=>{try{const session=await refreshStudentSession();if(session?.access_token){await loadWorkspace();go("home");}else{setProfile(null);setSubscription(null);setNotifications([]);go("login");}}catch{clearStudentSession();setProfile(null);setSubscription(null);setNotifications([]);go("login");}};
 useEffect(()=>{if(page==="home"&& !profile)loadWorkspace();},[page]);
 useEffect(()=>{const closeMenus=event=>{const target=event.target;if(!target.closest(".platform-navigation")&&!target.closest(".platform-mobile-menu"))setMobileNav(false);if(!target.closest(".platform-nav-more"))setMoreOpen(false);if(!target.closest(".platform-account-menu"))setAccountOpen(false);};document.addEventListener("pointerdown",closeMenus);return()=>document.removeEventListener("pointerdown",closeMenus);},[]);
 const grade=profile?.grade||"";
 const nav=navByGrade[grade]||navByGrade["الصف الأول الثانوي"];
 const unread=notifications.filter(n=>!n.read_at).length;
 const go=next=>{const validPages=["splash","login","signup","home","courses","lessons","exams","homework","files","results","schedule","live","messages","ai","subscriptions","profile","settings","groups","admin","notifications"];if(!validPages.includes(next)||next===pageRef.current)return;try{const state={marker:"emad-platform",page:next};if(["splash","login","signup"].includes(pageRef.current))window.history.replaceState(state,"",window.location.href);else window.history.pushState(state,"",window.location.href);}catch{}pageRef.current=next;setPage(next);setMoreOpen(false);setAccountOpen(false);setMobileNav(false);};
 const logout=()=>{clearStudentSession();setProfile(null);setSubscription(null);setNotifications([]);go("login");};
 if(window.location.pathname.replace(/\/$/,"")==="/owner")return <OwnerConsole/>;
 if(window.location.pathname.replace(/\/$/,"")==="/teacher")return <TeacherConsole/>;
 if(page==="splash")return <SplashScreen onComplete={completeSplash}/>;
 if(page==="login"||page==="signup")return <div className="auth-entry-reveal"><AuthScreen mode={page} onModeChange={go} onSuccess={async()=>{try{await loadWorkspace();go("home");}catch(error){clearStudentSession();go("login");throw error;}}}/></div>;
 const needsSubscription=["courses","lessons","exams","homework","files","results","schedule","live","ai"].includes(page);
 const activeSubscription=subscription&&new Date(subscription.ends_at)>new Date();
 const isLocked=needsSubscription&&!activeSubscription;
 return <StudentExperience page={page} profile={profile} grade={grade} unread={unread} go={go} logout={logout}>
   {page==="home"?<HomePage profile={profile} subscription={activeSubscription?subscription:null} go={go} grade={grade} unread={unread}/>:null}
   {page==="subscriptions"?<SubscriptionsPage subscription={subscription} onActivated={async()=>{await loadWorkspace();notify({type:"success",title:"تم تفعيل الاشتراك",message:"تم تفعيل اشتراكك الشهري بنجاح."});}}/>:null}
   {page==="profile"?<ProfilePage profile={profile} subscription={subscription} notifications={notifications} grade={grade} go={go} loading={loading}/>:null}
   {page==="settings"?<SettingsPage profile={profile}/>:null}
   {page==="admin"&&profile?.role==="admin"?<AdminPage/>:null}
   {page==="notifications"?<NotificationsPage notifications={notifications} onRead={async n=>{try{await markStudentNotificationRead(n.id);setNotifications(old=>old.map(x=>x.id===n.id?{...x,read_at:new Date().toISOString()}:x));}catch{notify({type:"error",title:"تعذر تحديث الإشعار",message:"حاول مرة أخرى."});}}} go={go}/>:null}
   {isLocked?<LockedPage go={go} grade={grade}/>:null}
   {!isLocked&&["courses","lessons","exams"].includes(page)?<LearningPage page={page} grade={grade} profile={profile}/>:null}
   {!isLocked&&["homework","files","results","schedule","live","ai","groups"].includes(page)?<SectionPage page={page} go={go} profile={profile}/>:null}
   {page==="messages"?<SectionPage page={page} go={go} profile={profile}/>:null}
   {page==="admin"&&profile?.role!=="admin"?<SectionPage page={page} go={go}/>:null}
  </StudentExperience>;
}
const pageArtwork={
 book:"https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1500&q=85",
 play:"https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1500&q=85",
 exam:"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1500&q=85",
 task:"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1500&q=85",
 file:"https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1500&q=85",
 chart:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1500&q=85",
 calendar:"https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1500&q=85",
 live:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1500&q=85",
 spark:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1500&q=85",
 users:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1500&q=85",
 support:"https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1500&q=85",
 settings:"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1500&q=85",
 lock:"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1500&q=85",
 ticket:"https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1500&q=85",
 user:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1500&q=85",
 bell:"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1500&q=85"
};
function PageBanner({eyebrow,title,description,art="book"}){return <section className="platform-page-banner" style={{"--page-artwork":`url("${pageArtwork[art]||pageArtwork.book}")`}}><div><span className="platform-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><div className="platform-banner-art"><Icon name={art} size={76}/></div></section>}
function HomePage({profile,subscription,go,grade,unread}){
 const [announcements,setAnnouncements]=useState([]);
 const firstName=profile?.full_name?.trim()?.split(/\s+/)[0]||"طالبنا";
 useEffect(()=>{let alive=true;studentApi("announcements?select=id,title,body,cover_image_url,published_at&published_at=not.is.null&order=published_at.desc&limit=5").then(rows=>{if(alive)setAnnouncements(rows||[]);}).catch(()=>{if(alive)setAnnouncements([]);});return()=>{alive=false;};},[]);
 const active=!!subscription;
 const services=[
  {id:"courses",n:"01",title:"المسارات التعليمية",desc:"افهم المنهج من الأساس إلى مستوى الامتحان.",image:"https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=85",tag:"تعلم"},
  {id:"lessons",n:"02",title:"المحاضرات",desc:"ارجع للشرح وراجع كل فكرة في وقتك.",image:"https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1000&q=85",tag:"شاهد"},
  {id:"exams",n:"03",title:"الامتحانات",desc:"اختبر فهمك واستعد بثقة.",image:"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1000&q=85",tag:"اختبر"},
  {id:"homework",n:"04",title:"التدريبات والواجبات",desc:"حوّل كل درس إلى مهارة بالتطبيق.",image:"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=85",tag:"تدرّب"}
 ];
 const quick=[["schedule","جدول الحصص","calendar"],["files","المذكرات والملفات","file"],["results","نتائجي","chart"],["groups","الجروبات الدراسية","users"],["ai","المساعد الذكي","spark"],["messages","الدعم الفني","support"]];
 return <div className="se-dashboard">
  <section className="sd-hero">
   <div className="sd-hero-image"/>
   <div className="sd-hero-overlay"/>
   <div className="sd-hero-copy">
    <span className="sd-kicker"><i/> EMAD EL SANAFIRY · MATHEMATICS ACADEMY</span>
    <p className="sd-welcome">أهلاً بيك يا {firstName}</p>
    <h1>افهم الفكرة.<br/><em>امتلك الحل.</em></h1>
    <p className="sd-description">كل خطوة في رحلتك التعليمية ليها مكان هنا. تعلّم بتركيز، تدرب بذكاء، وتابع تقدمك خطوة بخطوة.</p>
    <div className="sd-hero-actions"><button onClick={()=>go(active?"courses":"subscriptions")}>{active?"ابدأ المذاكرة":"فعّل اشتراكك"} <Icon name="arrow" size={17}/></button><button className="sd-outline" onClick={()=>go("schedule")}><Icon name="calendar" size={16}/> جدولك الدراسي</button></div>
    <div className="sd-hero-meta"><span><Icon name="book" size={15}/>{grade||"الصف الدراسي غير محدد"}</span><span className={active?"sd-status active":"sd-status"}><i/>{active?"اشتراك نشط":"بانتظار تفعيل الاشتراك"}</span></div>
   </div>
   <div className="sd-teacher">
    <div className="sd-orbit sd-orbit-one"/><div className="sd-orbit sd-orbit-two"/>
    <div className="sd-equation sd-equation-one">∑ f(x)</div><div className="sd-equation sd-equation-two">x² + y²</div>
    <div className="sd-teacher-photo"><img src="https://raw.githubusercontent.com/elgorfyousef95-droid/emad-math-platform/redesign/homepage-foundation-2026/IMG-20261121-WA0004.jpg" alt="مستر عماد السنافيري" loading="eager" referrerPolicy="no-referrer"/></div>
    <div className="sd-teacher-label"><small>YOUR MATHEMATICS TEACHER</small><b>مستر عماد السنافيري</b></div>
   </div>
   <div className="sd-hero-bottom"><span>01 / STUDENT SPACE</span><span>LEARN · PRACTICE · ACHIEVE</span></div>
  </section>
  {announcements.length>0&&<section className="sd-announcements"><div className="sd-section-heading"><div><span className="sd-section-kicker">LATEST UPDATES</span><h2>آخر أخبار المنصة</h2></div><span>{announcements.length} إعلانات</span></div><div className="sd-announcement-grid">{announcements.map(item=><article key={item.id}>{item.cover_image_url?<img src={item.cover_image_url} alt=""/>:<span className="sd-announcement-fallback">إعلان</span>}<div><b>{item.title}</b><p>{item.body}</p><small>{new Date(item.published_at).toLocaleDateString("ar-EG")}</small></div></article>)}</div></section>}
  <section className="sd-welcome-row">
   <div><span className="sd-section-kicker">YOUR LEARNING SPACE</span><h2>ابدأ من هنا، وخلّي كل يوم يفرق.</h2><p>اختار الخطوة اللي محتاجها دلوقتي.</p></div>
   <div className="sd-profile-chip"><span className="sd-profile-avatar">{profile?.avatar_url?<img src={profile.avatar_url} alt=""/>:<Icon name="user" size={20}/>}</span><div><small>رقم الطالب</small><b>{profile?.student_number||"—"}</b></div><button onClick={()=>go("profile")}>ملفي <Icon name="arrow" size={14}/></button></div>
  </section>
  <section className="sd-services">
   {services.map((s,i)=><button className="sd-service-card" key={s.id} onClick={()=>go(s.id)} style={{"--sd-card-image":'url("'+s.image+'")'}}><span className="sd-card-image"/><span className="sd-card-shade"/><span className="sd-card-top"><i>{s.n}</i><b>{s.tag}</b></span><span className="sd-card-copy"><b>{s.title}</b><small>{s.desc}</small><em>استكشف القسم <Icon name="arrow" size={15}/></em></span></button>)}
  </section>
  <section className="sd-quick-section">
   <div className="sd-section-heading"><div><span className="sd-section-kicker">MORE TO EXPLORE</span><h2>كل أدواتك في مكان واحد</h2></div><span>مساحتك الدراسية</span></div>
   <div className="sd-quick-grid">{quick.map(([id,label,icon],i)=><button key={id} onClick={()=>go(id)}><span className={"sd-quick-icon q"+i}><Icon name={icon} size={21}/></span><b>{label}</b><Icon name="arrow" size={15}/></button>)}</div>
  </section>
  <section className="sd-bottom-strip"><div><span>YOUR NEXT STEP</span><b>{active?"ابدأ بأول درس في خطتك":"فعّل اشتراكك للوصول إلى المحتوى التعليمي"}</b></div><button onClick={()=>go(active?"courses":"subscriptions")}>{active?"تصفح الكورسات":"الاشتراكات"} <Icon name="arrow" size={16}/></button></section>
 </div>;
}
function LockedPage({go,grade}){return <div className="platform-page"><PageBanner eyebrow="MEMBERSHIP REQUIRED" title="المحتوى التعليمي متاح للمشتركين" description="فعّل اشتراكك الشهري بكود مخصص لصفك الدراسي لفتح المحاضرات والامتحانات وباقي الخدمات." art="lock"/><section className="platform-lock-panel"><span className="platform-lock-icon"><Icon name="lock" size={30}/></span><h2>فعّل اشتراكك للمتابعة</h2><p>الاشتراك مرتبط بحسابك وبـ {grade||"صفك الدراسي"}، ولا يمكن فتح المحتوى قبل تفعيل كود صالح.</p><button className="platform-gold-button" onClick={()=>go("subscriptions")}>الانتقال للاشتراكات<Icon name="arrow"/></button></section></div>}
function SubscriptionsPage({subscription,onActivated}){
 const [code,setCode]=useState(""),[busy,setBusy]=useState(false);
 const activate=async()=>{if(!code.trim())return notify({type:"warning",title:"كود الاشتراك مطلوب",message:"اكتب الكود الذي حصلت عليه أولاً."});setBusy(true);try{await redeemStudentSubscription(code.trim());setCode("");await onActivated();}catch(e){const map={subscription_code_invalid_or_used:"الكود غير صحيح أو تم استخدامه من قبل أو لا يخص صفك الدراسي.",not_authenticated:"انتهت جلسة الدخول. سجّل الدخول مرة أخرى.",student_profile_not_found:"تعذر العثور على بيانات الطالب."};notify({type:"error",title:"تعذر تفعيل الاشتراك",message:map[e.message]||"حدث خطأ أثناء التفعيل. راجع الكود وحاول مرة أخرى."});}finally{setBusy(false);}};
 return <div className="platform-page"><PageBanner eyebrow="SUBSCRIPTION CENTER" title="الاشتراكات والأكواد" description="إدارة اشتراكك الشهري وتفعيل كود مستقل عن بيانات تسجيل الدخول." art="ticket"/><div className="platform-subscription-layout"><section className="platform-panel platform-redeem-panel"><span className="platform-eyebrow">MONTHLY ACCESS</span><h2>تفعيل الاشتراك الشهري</h2><p>اكتب كود الاشتراك المخصص لصفك. يتم تفعيل الكود مرة واحدة فقط ويبدأ الشهر من وقت التفعيل.</p><label htmlFor="student-sub-code">كود الاشتراك</label><input id="student-sub-code" value={code} onChange={e=>setCode(e.target.value.replace(/[^A-Z0-9-]/gi,"").toUpperCase())} placeholder="EMAD-XXXX-XXXX" dir="ltr" inputMode="text" autoComplete="off"/><button className="platform-gold-button" onClick={activate} disabled={busy}>{busy?"جارٍ التحقق...":"تفعيل الاشتراك"}<Icon name="arrow"/></button></section><aside className="platform-panel platform-sub-status"><h3>حالة اشتراكك</h3>{subscription&&new Date(subscription.ends_at)>new Date()?<><span className="platform-active-pill">اشتراك نشط</span><b>ينتهي في</b><strong>{new Date(subscription.ends_at).toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"})}</strong><small>الصف المرتبط: {subscription.grade}</small></>:<><span className="platform-inactive-pill">لا يوجد اشتراك نشط</span><p>بعد تفعيل الكود ستظهر هنا مدة الاشتراك وتاريخ انتهائه.</p></>}<div className="platform-sub-rules"><b>قواعد الأكواد</b><span>• كود الاشتراك منفصل عن كود أو رقم تسجيل الدخول.</span><span>• كل كود يستخدم مرة واحدة فقط.</span><span>• مدة الاشتراك شهر واحد وتحدد حسب الصف الدراسي.</span></div></aside></div></div>;
}
function ProfilePage({profile,subscription,notifications=[],grade,go,loading}){
 const active=subscription&&new Date(subscription.ends_at)>new Date();
 const unread=notifications.filter(n=>!n.read_at).length;
 const links=[["courses","الكورسات","book","محتواك الدراسي"],["lessons","المحاضرات","play","دروس المنهج"],["exams","الامتحانات","exam","اختباراتك"],["homework","الواجبات","task","التدريبات المطلوبة"],["files","المذكرات","file","ملفاتك التعليمية"],["results","النتائج","chart","متابعة مستواك"],["schedule","الجدول","calendar","مواعيد الحصص"],["live","البث المباشر","live","المحاضرات المباشرة"],["groups","الجروبات","users","مجموعتك الدراسية"],["ai","المساعد الذكي","spark","مساعد الرياضيات"],["subscriptions","الاشتراكات","ticket","إدارة اشتراكك"],["notifications","الإشعارات","bell","التنبيهات والتحديثات"]];
 const expiry=subscription?.ends_at?new Date(subscription.ends_at).toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}):"لا يوجد اشتراك نشط";
 return <div className="platform-page profile-v2">
  <section className="profile-v2-heading"><div><span>STUDENT CONTROL CENTER</span><h1>ملفك الدراسي</h1><p>كل تفاصيل حسابك وروابط رحلتك التعليمية في مكان واحد.</p></div><button onClick={()=>go("settings")}><Icon name="settings" size={17}/> إعدادات الحساب</button></section>
  <section className="profile-v2-identity">
   <div className="profile-v2-cover"><span>EMAD EL SANAFIRY · STUDENT PROFILE</span></div>
   <div className="profile-v2-main">
    {profile?.avatar_url?<img className="profile-v2-avatar" src={profile.avatar_url} alt="صورة الطالب"/>:<div className="profile-v2-avatar profile-v2-avatar-empty"><Icon name="user" size={38}/></div>}
    <div className="profile-v2-name"><small>أهلاً بيك في حسابك</small><h2>{loading?"جارٍ التحميل...":profile?.full_name||"حساب الطالب"}</h2><span>{grade||"الصف الدراسي غير محدد"}{profile?.group_name?" · "+profile.group_name:""}</span></div>
    <div className="profile-v2-status"><i className={active?"online":""}/><b>{active?"اشتراك نشط":"الاشتراك غير مفعل"}</b><small>{profile?.is_verified?"الحساب موثق":"الحساب غير موثق"}</small></div>
   </div>
   <div className="profile-v2-facts">
    <div><small>رقم الطالب</small><b>{profile?.student_number||"—"}</b></div>
    <div><small>الصف الدراسي</small><b>{grade||"غير محدد"}</b></div>
    <div><small>المجموعة</small><b>{profile?.group_name||"غير محددة"}</b></div>
    <div><small>انتهاء الاشتراك</small><b>{expiry}</b></div>
   </div>
  </section>
  <section className="profile-v2-overview">
   <article><span className="profile-v2-metric-icon"><Icon name="book" size={19}/></span><div><small>الصف الدراسي</small><b>{grade||"غير محدد"}</b><em>المحتوى المخصص لصفك</em></div></article>
   <article><span className="profile-v2-metric-icon cyan"><Icon name="ticket" size={19}/></span><div><small>حالة الاشتراك</small><b>{active?"نشط":"غير مفعل"}</b><em>{active?"حتى "+expiry:"فعّل اشتراكك للوصول للمحتوى"}</em></div></article>
   <article><span className="profile-v2-metric-icon violet"><Icon name="bell" size={19}/></span><div><small>إشعارات غير مقروءة</small><b>{unread}</b><em>تحديثات حسابك</em></div></article>
  </section>
  <section className="profile-v2-links-section"><div className="profile-v2-section-title"><div><span>YOUR LEARNING CONNECTIONS</span><h2>كل خدماتك مرتبطة بملفك</h2><p>انتقل مباشرة لأي جزء من المنصة، وبيانات الحساب والصف الدراسي تفضل مرتبطة بالخدمات.</p></div></div>
   <div className="profile-v2-link-grid">{links.map(([id,title,ico,desc])=><button key={id} onClick={()=>go(id)}><span><Icon name={ico} size={19}/></span><b>{title}</b><small>{desc}</small><i><Icon name="arrow" size={14}/></i></button>)}</div>
  </section>
  <section className="profile-v2-footer-actions"><button onClick={()=>go("messages")}><Icon name="support" size={18}/> التواصل مع الدعم الفني</button><button onClick={()=>go("subscriptions")}><Icon name="ticket" size={18}/> تفاصيل الاشتراك</button><button onClick={()=>go("settings")}><Icon name="lock" size={18}/> الأمان وإعدادات الحساب</button></section>
 </div>;
}
function SettingsPage({profile}){return <div className="platform-page"><PageBanner eyebrow="ACCOUNT SETTINGS" title="إعدادات الحساب" description="إعدادات حساب الطالب وتجربته التعليمية." art="settings"/><div className="platform-settings-grid">{[["الملف الشخصي","بيانات الحساب وصورة الطالب","user"],["الأمان وتسجيل الدخول","بيانات الدخول والجلسات","lock"],["الإشعارات","تنبيهات المنصة والواجبات والامتحانات","bell"],["الاشتراك","حالة الاشتراك وتاريخ الانتهاء","ticket"]].map(([t,d,i])=><article key={t}><Icon name={i} size={22}/><b>{t}</b><p>{d}</p></article>)}</div><p className="platform-settings-note">الحساب الحالي: {profile?.full_name||"طالب"}</p></div>}
function NotificationsPage({notifications,onRead,go}){return <div className="platform-page"><PageBanner eyebrow="NOTIFICATION CENTER" title="الإشعارات" description="تابع كل التنبيهات المرتبطة بحسابك التعليمي." art="bell"/><div className="platform-notification-list">{notifications.length?notifications.map(n=><article key={n.id} className={n.read_at?"is-read":""}><span className="platform-notification-icon"><Icon name="bell"/></span><div><b>{n.title}</b><p>{n.body}</p><small>{new Date(n.created_at).toLocaleString("ar-EG")}</small></div><div className="platform-notification-actions">{!n.read_at&&<button onClick={()=>onRead(n)}>تحديد كمقروء</button>}{n.action_url&&<button onClick={()=>go(n.action_url)}>فتح</button>}</div></article>):<div className="platform-empty-state"><Icon name="bell" size={34}/><b>لا توجد إشعارات حتى الآن</b><span>ستظهر هنا تنبيهات الحساب والواجبات والامتحانات.</span></div>}</div></div>}
function LearningPage({page,grade,profile}){
 const [items,setItems]=useState([]),[busy,setBusy]=useState(true),[selected,setSelected]=useState(null),[examOpen,setExamOpen]=useState(false),[lessonVideoUrl,setLessonVideoUrl]=useState(""),[lessonVideoError,setLessonVideoError]=useState(""),[courseLessons,setCourseLessons]=useState([]),[courseLessonsBusy,setCourseLessonsBusy]=useState(false),[selectedCourseLesson,setSelectedCourseLesson]=useState(null),[courseLessonVideoUrl,setCourseLessonVideoUrl]=useState(""),[courseLessonVideoError,setCourseLessonVideoError]=useState("");
 const configs={
  courses:{title:"الكورسات والوحدات",desc:"المحتوى التعليمي المنشور والمخصص لصفك.",table:"courses",select:"id,title,description,subject,grade,cover_image_url,created_at",filter:"status=eq.published",art:"book"},
  lessons:{title:"المحاضرات",desc:"المحاضرات والدروس المرتبطة بالكورسات المتاحة.",table:"lessons",select:"id,title,description,video_url,duration_minutes,duration_seconds,sort_order,course_id,cover_image_url,created_at",filter:"is_published=eq.true",art:"play"},
  exams:{title:"الامتحانات",desc:"الاختبارات المنشورة لقياس مستواك.",table:"exams",select:"id,title,duration_minutes,opens_at,closes_at,course_id,cover_image_url,created_at,courses(title,subject,grade)",filter:"is_published=eq.true",art:"exam"}
 };
 const cfg=configs[page];
 useEffect(()=>{let alive=true;setBusy(true);setSelected(null);const query=cfg.table+"?select="+cfg.select+"&"+cfg.filter+"&order=created_at.desc";studentApi(query).then(rows=>{if(alive)setItems(rows||[]);}).catch(e=>{console.error("learning_load",e);if(alive)setItems([]);}).finally(()=>{if(alive)setBusy(false);});return()=>{alive=false;};},[page]);
 useEffect(()=>{
  let alive=true;
  setLessonVideoUrl("");setLessonVideoError("");
  if(page!=="lessons"||!selected?.video_url)return;
  getLectureVideoUrl(selected.video_url,"student").then(url=>{if(alive)setLessonVideoUrl(url);}).catch(error=>{console.error("lecture_video_access",error);if(alive)setLessonVideoError("تعذر فتح الفيديو. تأكد من أن اشتراكك نشط وأن المحاضرة منشورة.");});
  return()=>{alive=false;};
 },[page,selected?.id,selected?.video_url]);
 useEffect(()=>{
  let alive=true;
  setCourseLessons([]);setSelectedCourseLesson(null);setCourseLessonVideoUrl("");setCourseLessonVideoError("");
  if(page!=="courses"||!selected?.id)return;
  setCourseLessonsBusy(true);
  studentApi("lessons?select=id,title,description,video_url,duration_minutes,duration_seconds,sort_order,cover_image_url&course_id=eq."+encodeURIComponent(selected.id)+"&is_published=eq.true&order=sort_order.asc")
   .then(rows=>{if(alive)setCourseLessons(rows||[]);})
   .catch(error=>{console.error("course_lessons_load",error);if(alive)setCourseLessons([]);})
   .finally(()=>{if(alive)setCourseLessonsBusy(false);});
  return()=>{alive=false;};
 },[page,selected?.id]);
 useEffect(()=>{
  let alive=true;
  setCourseLessonVideoUrl("");setCourseLessonVideoError("");
  if(page!=="courses"||!selectedCourseLesson?.video_url)return;
  getLectureVideoUrl(selectedCourseLesson.video_url,"student")
   .then(url=>{if(alive)setCourseLessonVideoUrl(url);})
   .catch(error=>{console.error("course_lecture_video_access",error);if(alive)setCourseLessonVideoError("تعذر تشغيل المحاضرة. تأكد من أن اشتراكك نشط وأن المحاضرة منشورة.");});
  return()=>{alive=false;};
 },[page,selectedCourseLesson?.id,selectedCourseLesson?.video_url]);

 const retryLessonVideo=async()=>{
  if(!selected?.video_url)return;
  setLessonVideoError("");
  try{setLessonVideoUrl(await getLectureVideoUrl(selected.video_url,"student"));}
  catch(error){console.error("lecture_video_retry",error);setLessonVideoError("تعذر الحصول على رابط تشغيل آمن. تأكد من الاشتراك ونشر المحاضرة.");}
 };
 const retryCourseLessonVideo=async()=>{
  if(!selectedCourseLesson?.video_url)return;
  setCourseLessonVideoError("");
  try{setCourseLessonVideoUrl(await getLectureVideoUrl(selectedCourseLesson.video_url,"student"));}
  catch(error){console.error("course_lecture_video_retry",error);setCourseLessonVideoError("تعذر الحصول على رابط تشغيل آمن. تأكد من الاشتراك ونشر المحاضرة.");}
 };

 return <div className={"platform-page learning-page learning-page-"+page}><PageBanner eyebrow={"GRADE CONTENT / "+(grade||"STUDENT").toUpperCase()} title={cfg.title} description={cfg.desc} art={cfg.art}/><div className="platform-content-list-heading"><h2>{cfg.title}</h2><span>{items.length} عنصر</span></div>{busy?<div className="platform-empty-state">جارٍ تحميل المحتوى من قاعدة البيانات...</div>:items.length?<div className="learning-media-grid">{items.map(item=><button type="button" className="learning-media-card" key={item.id} onClick={()=>setSelected(item)}>
  {item.cover_image_url?<img src={item.cover_image_url} alt={"صورة "+item.title}/>:<span className="learning-media-placeholder"><Icon name={cfg.art} size={32}/></span>}
  <span className="learning-media-card-copy"><b>{item.title}</b><small>{item.description||item.subject||item.courses?.title||"محتوى تعليمي"}</small>{item.duration_minutes&&<em>المدة: {item.duration_minutes} دقيقة</em>}</span>
  <span className="learning-media-open">عرض التفاصيل</span>
 </button>)}</div>:<div className="platform-empty-state"><Icon name={cfg.art} size={34}/><b>لا يوجد محتوى منشور حاليًا</b><span>عند إضافة محتوى لصفك سيظهر هنا مباشرة.</span></div>}
 {selected&&<div className="learning-detail-backdrop" role="presentation" onClick={()=>setSelected(null)}><section className="learning-detail-modal" role="dialog" aria-modal="true" aria-label={selected.title} onClick={e=>e.stopPropagation()}>
  <button type="button" className="learning-detail-close" onClick={()=>setSelected(null)}>إغلاق</button>
  {selected.cover_image_url?<img className="learning-detail-image" src={selected.cover_image_url} alt={selected.title}/>:<div className="learning-detail-placeholder"><Icon name={cfg.art} size={38}/></div>}
  <span className="platform-eyebrow">{cfg.title}</span><h2>{selected.title}</h2>
  <p>{selected.description||"تفاصيل المحتوى التعليمي."}</p>
  {page==="courses"&&<><div className="learning-detail-meta"><span>المادة: {selected.subject||"رياضيات"}</span><span>الصف: {selected.grade||grade}</span></div><section className="course-lesson-browser"><div className="course-lesson-browser-head"><div><b>محاضرات الكورس</b><small>افتح أي محاضرة وشاهدها من داخل الكورس</small></div><span>{courseLessons.length} محاضرة</span></div>{courseLessonsBusy?<p className="course-lesson-empty">جارٍ تجهيز قائمة المحاضرات...</p>:courseLessons.length?<div className="course-lesson-items">{courseLessons.map((lesson,index)=><button type="button" key={lesson.id} className={selectedCourseLesson?.id===lesson.id?"course-lesson-item active":"course-lesson-item"} onClick={()=>setSelectedCourseLesson(lesson)}>{lesson.cover_image_url?<img src={lesson.cover_image_url} alt=""/>:<span className="course-lesson-index">{String(index+1).padStart(2,"0")}</span>}<span><b>{lesson.title}</b><small>{lesson.description||"محاضرة تعليمية"} · {lesson.duration_seconds?Math.floor(lesson.duration_seconds/60)+" دقيقة "+(lesson.duration_seconds%60)+" ثانية":lesson.duration_minutes?lesson.duration_minutes+" دقيقة":"المدة من الفيديو"}</small></span><i>تشغيل</i></button>)}</div>:<p className="course-lesson-empty">لم تُنشر محاضرات في هذا الكورس بعد.</p>}{selectedCourseLesson&&<div className="course-selected-player"><div><b>{selectedCourseLesson.title}</b><small>مشغل المحاضرة داخل الكورس</small></div>{courseLessonVideoUrl?(getLectureEmbedUrl(courseLessonVideoUrl)?<iframe className="lecture-video-embed" src={getLectureEmbedUrl(courseLessonVideoUrl)} title={selectedCourseLesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy"/>:<video key={courseLessonVideoUrl} src={courseLessonVideoUrl} poster={selectedCourseLesson.cover_image_url||undefined} controls playsInline preload="metadata" onError={()=>{setCourseLessonVideoError("تعذر تشغيل ملف الفيديو. لو الملف بصيغة MOV أو بترميز غير مدعوم، حوّله إلى MP4 بترميز H.264.");setCourseLessonVideoUrl("");}}/>):<div className="course-player-error"><p>{courseLessonVideoError||(selectedCourseLesson.video_url?"جارٍ تجهيز الفيديو للتشغيل...":"لم يتم ربط فيديو بهذه المحاضرة بعد.")}</p>{selectedCourseLesson.video_url&&<button type="button" onClick={retryCourseLessonVideo}>إعادة محاولة التشغيل</button>}</div>}</div>}</section></>}
  {page==="exams"&&<><div className="learning-detail-meta"><span>الكورس: {selected.courses?.title||"—"}</span><span>المدة: {selected.duration_minutes} دقيقة</span><span>موعد الفتح: {selected.opens_at?new Date(selected.opens_at).toLocaleString("ar-EG"):"متاح حسب الجدول"}</span><span>موعد الإغلاق: {selected.closes_at?new Date(selected.closes_at).toLocaleString("ar-EG"):"—"}</span></div><button className="learning-start-exam" onClick={()=>setExamOpen(true)}>ابدأ الامتحان الآن</button></>}
  {page==="lessons"&&<><div className="learning-detail-meta"><span>ترتيب المحاضرة: {selected.sort_order||"—"}</span><span>المدة: {selected.duration_seconds?Math.floor(selected.duration_seconds/60)+" دقيقة "+(selected.duration_seconds%60)+" ثانية":selected.duration_minutes?selected.duration_minutes+" دقيقة":"تُقرأ من الفيديو"}</span></div>{selected.video_url&&<div className="learning-video-player"><div className="learning-video-player-heading"><b>صفحة مشاهدة المحاضرة</b><span>مشغل آمن داخل المنصة · {selected.duration_minutes||"—"} دقيقة</span></div>{lessonVideoUrl?(getLectureEmbedUrl(lessonVideoUrl)?<iframe className="lecture-video-embed" src={getLectureEmbedUrl(lessonVideoUrl)} title={selected.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy"/>:<video key={lessonVideoUrl} src={lessonVideoUrl} poster={selected.cover_image_url||undefined} controls playsInline preload="metadata" onError={()=>{setLessonVideoError("تعذر تشغيل ملف الفيديو. استخدم MP4 بترميز H.264 أو WEBM مدعومًا.");setLessonVideoUrl("");}}/>):<div className="course-player-error"><small>{lessonVideoError||"جارٍ تجهيز رابط تشغيل آمن للمحاضرة..."}</small>{selected.video_url&&<button type="button" onClick={retryLessonVideo}>إعادة محاولة التشغيل</button>}</div>}</div>}</>}
 </section></div>}
 {examOpen&&selected&&page==="exams"&&<ExamRunner exam={selected} profile={profile} studentApi={studentApi} onClose={()=>setExamOpen(false)}/>}
 </div>;
}

function HomeworkPage({profile}){
 const [items,setItems]=useState([]),[submissions,setSubmissions]=useState([]),[busy,setBusy]=useState(true),[active,setActive]=useState(null),[questions,setQuestions]=useState([]),[answers,setAnswers]=useState({}),[submission,setSubmission]=useState(null),[saving,setSaving]=useState(false),[loadingQuestions,setLoadingQuestions]=useState(false);
 const load=async()=>{setBusy(true);try{const [a,s]=await Promise.all([studentApi("homework_assignments?select=id,title,description,grade,group_name,due_at,cover_image_url,created_at&is_published=eq.true&order=created_at.desc"),studentApi("homework_submissions?select=id,assignment_id,answers,status,objective_score,manual_score,feedback,submitted_at&order=created_at.desc")]);setItems(a||[]);setSubmissions(s||[]);}catch(e){console.error("homework_load",e);notify({type:"error",title:"تعذر تحميل الواجبات",message:"راجع اتصالك بالإنترنت وحاول مرة أخرى."});}finally{setBusy(false);}};
 useEffect(()=>{load();},[]);
 const open=async item=>{setActive(item);setLoadingQuestions(true);setQuestions([]);setSubmission(null);setAnswers({});try{const [qs,ss]=await Promise.all([studentApi("homework_questions?select=id,position,question_type,prompt,choices,points&assignment_id=eq."+item.id+"&order=position.asc"),studentApi("homework_submissions?select=id,assignment_id,answers,status,objective_score,manual_score,feedback,submitted_at&assignment_id=eq."+item.id+"&limit=1")]);const sub=ss?.[0]||null;setQuestions(qs||[]);setSubmission(sub);setAnswers(sub?.answers||{});}catch(e){console.error("homework_open",e);notify({type:"error",title:"تعذر فتح الواجب",message:"لم نتمكن من تحميل الأسئلة."});setActive(null);}finally{setLoadingQuestions(false);}};
 const save=async()=>{if(!active||!profile?.id)return;setSaving(true);try{let saved=submission;if(!saved){const rows=await studentApi("homework_submissions?on_conflict=assignment_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify({assignment_id:active.id,student_id:profile.id,answers,status:"draft"})});saved=rows?.[0];}else{const rows=await studentApi("homework_submissions?id=eq."+saved.id,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({answers,updated_at:new Date().toISOString()})});saved=rows?.[0]||{...saved,answers};}setSubmission(saved);notify({type:"success",title:"تم حفظ إجاباتك",message:"تقدر ترجع تكمل الحل قبل موعد التسليم."});}catch(e){console.error("homework_save",e);notify({type:"error",title:"تعذر حفظ الإجابات",message:"تأكد من الاتصال وحاول مرة أخرى."});}finally{setSaving(false);}};
 const submit=async()=>{if(!active)return;const missing=questions.filter(q=>!String(answers[q.id]??"").trim());if(missing.length){notify({type:"warning",title:"لسه فيه أسئلة من غير إجابة",message:"جاوب على كل الأسئلة قبل التسليم."});return;}setSaving(true);try{let saved=submission;if(!saved){const rows=await studentApi("homework_submissions?on_conflict=assignment_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify({assignment_id:active.id,student_id:profile.id,answers,status:"draft"})});saved=rows?.[0];}else{await studentApi("homework_submissions?id=eq."+saved.id,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({answers})});}const result=await studentApi("rpc/emad_submit_homework",{method:"POST",body:JSON.stringify({p_submission_id:saved.id})});notify({type:"success",title:"تم تسليم الواجب بنجاح",message:result?.objective_max>0?"درجتك الموضوعية: "+result.objective_score+" من "+result.objective_max:"تم استلام إجاباتك وهي في انتظار التصحيح."});setActive(null);await load();}catch(e){console.error("homework_submit",e);notify({type:"error",title:"تعذر تسليم الواجب",message:e.message==="deadline_passed"?"انتهى موعد تسليم هذا الواجب.":"حصلت مشكلة أثناء التسليم؛ إجاباتك لم تُعتمد بعد."});}finally{setSaving(false);}};
 const done=submissions.filter(s=>s.status==="submitted").length;
 if(active)return <div className="platform-page homework-page"><PageBanner eyebrow="YOUR HOMEWORK / SOLVE" title={active.title} description={active.description||"حل الأسئلة وسلّم إجاباتك من داخل المنصة."} art="task"/><div className="hw-work-toolbar"><button className="hw-back" onClick={()=>setActive(null)}>العودة للواجبات</button><span>{questions.length} سؤال</span>{active.due_at&&<span>آخر موعد: {new Date(active.due_at).toLocaleString("ar-EG")}</span>}</div>{loadingQuestions?<div className="platform-empty-state">جارٍ تحميل الأسئلة...</div>:submission?.status==="submitted"?<section className="hw-submitted"><b>تم تسليم هذا الواجب بالفعل</b><p>تاريخ التسليم: {submission.submitted_at?new Date(submission.submitted_at).toLocaleString("ar-EG"):"—"}</p>{submission.objective_score!==null&&<strong>الدرجة الموضوعية: {submission.objective_score}</strong>}{submission.manual_score!==null&&<strong>الدرجة النهائية: {submission.manual_score}</strong>}{submission.feedback&&<p>ملاحظات المدرس: {submission.feedback}</p>}</section>:<><div className="hw-question-list">{questions.map((q,i)=><article className="hw-question" key={q.id}><header><span>السؤال {i+1}</span><small>{q.points} درجة</small></header><h3>{q.prompt}</h3>{q.question_type==="single_choice"?<div className="hw-options">{(Array.isArray(q.choices)?q.choices:[]).map((choice,j)=><label key={j} className={answers[q.id]===String(choice)?"selected":""}><input type="radio" name={"q-"+q.id} value={choice} checked={answers[q.id]===String(choice)} onChange={()=>setAnswers(old=>({...old,[q.id]:String(choice)}))}/><span>{choice}</span></label>)}</div>:q.question_type==="true_false"?<div className="hw-options two">{["صحيح","خطأ"].map(choice=><label key={choice} className={answers[q.id]===choice?"selected":""}><input type="radio" name={"q-"+q.id} value={choice} checked={answers[q.id]===choice} onChange={()=>setAnswers(old=>({...old,[q.id]:choice}))}/><span>{choice}</span></label>)}</div>:<textarea rows={q.question_type==="essay"?6:3} value={answers[q.id]||""} onChange={e=>setAnswers(old=>({...old,[q.id]:e.target.value}))} placeholder="اكتب إجابتك هنا..."/>}</article>)}</div><div className="hw-submit-bar"><button onClick={save} disabled={saving}>{saving?"جارٍ الحفظ...":"حفظ ومتابعة لاحقًا"}</button><button className="platform-gold-button" onClick={submit} disabled={saving}>{saving?"جارٍ التسليم...":"تسليم الواجب نهائيًا"}<Icon name="arrow"/></button></div></>}</div>;
 return <div className="platform-page homework-page"><PageBanner eyebrow="HOMEWORK & PRACTICE" title="الواجبات والتدريبات" description="حل واجباتك داخل المنصة، احفظ إجاباتك، وسلّمها للمدرس وتابع نتيجتك." art="task"/><div className="hw-summary"><article><b>{items.length}</b><span>واجب متاح</span></article><article><b>{done}</b><span>تم تسليمه</span></article><article><b>{items.length-done}</b><span>لم يُسلّم بعد</span></article></div>{busy?<div className="platform-empty-state">جارٍ تحميل واجبات صفك ومجموعتك...</div>:items.length?<div className="hw-assignment-grid">{items.map(item=>{const sub=submissions.find(s=>s.assignment_id===item.id);const expired=item.due_at&&new Date(item.due_at)<new Date();return <article key={item.id} className="hw-assignment-card">{item.cover_image_url?<img className="hw-assignment-cover" src={item.cover_image_url} alt={"صورة "+item.title}/>:<span className="hw-assignment-mark"><Icon name="task" size={23}/></span>}<div className="hw-card-meta"><span>{item.grade}</span><span>{sub?.status==="submitted"?"تم التسليم":expired?"انتهى الموعد":"متاح للحل"}</span></div><h2>{item.title}</h2><p>{item.description||"واجب تدريبي لقياس فهمك وتطبيقك."}</p>{item.due_at&&<small>آخر موعد: {new Date(item.due_at).toLocaleString("ar-EG")}</small>}{sub?.status==="submitted"?<div className="hw-card-result">تم التسليم{sub.objective_score!==null?" · "+sub.objective_score+" درجة":""}</div>:<button onClick={()=>open(item)} disabled={!!expired}> {sub?"استكمال الحل":"ابدأ الحل"} <Icon name="arrow"/></button>}</article>;})}</div>:<div className="platform-empty-state"><Icon name="task" size={36}/><b>مفيش واجبات منشورة لصفك حاليًا</b><span>أول ما المدرس ينشر واجب للصف أو المجموعة بتاعتك هيظهر هنا.</span></div>}</div>;
}

function LiveSessionsPage({profile}){
 return <div className="platform-page student-live-page"><StudentLiveClassroom profile={profile}/></div>;
}

function SectionPage({page,go,profile}){
 if(page==="homework")return <HomeworkPage profile={profile}/>;
 if(page==="messages")return <ChatWorkspace profile={profile} mode="support" portal="student"/>;
 if(page==="groups")return <ChatWorkspace profile={profile} mode="groups" portal="student"/>;
 if(page==="live")return <LiveSessionsPage profile={profile}/>;
 if(page==="results")return <StudentResults/>;
 const data={homework:["الواجبات والتدريبات","تابع التكليفات والتدريبات المطلوبة منك.","task"],files:["المذكرات والملفات","مكتبة المذكرات والملخصات وأوراق العمل.","file"],schedule:["جدول الحصص","مواعيد المحاضرات والامتحانات في جدول منظم.","calendar"],live:["المحاضرات المباشرة","تابع مواعيد البث المباشر والمحاضرات التفاعلية.","live"],ai:["المساعد الذكي","مساعد رياضيات مخصص لصفك الدراسي.","spark"],groups:["الجروبات الدراسية","مساحات تواصل منظمة لطلاب نفس الصف والمجموعة، مع إشراف وإعلانات ومناقشات تعليمية.","users"],admin:["إدارة المنصة","إدارة المحتوى والطلاب والاشتراكات والصلاحيات.","settings"]}[page]||["القسم","","book"];
 const unavailable={homework:"لا يوجد حتى الآن جدول واجبات مرتبط بحسابك في قاعدة البيانات.",files:"مكتبة الملفات لم يتم تجهيز جدولها ورفع ملفاتها بعد.",schedule:"جدول الحصص يحتاج إلى ربط مواعيد الحصص الفعلية من الإدارة.",ai:"المساعد الذكي يحتاج إلى ربط خدمة الذكاء الاصطناعي ومصادر المنهج.",groups:"خدمة الجروبات الدراسية لم يتم تجهيزها بعد."};
 return <div className="platform-page"><PageBanner eyebrow="STUDENT SERVICES" title={data[0]} description={data[1]} art={data[2]}/><div className="platform-empty-state"><Icon name={data[2]} size={36}/><b>مساحة {data[0]}</b><span>{unavailable[page]||"هذا القسم قيد التجهيز."}</span></div></div>;
}

function SupportCenter({profile}){
 const [subject,setSubject]=useState(""),[message,setMessage]=useState(""),[items,setItems]=useState([]),[busy,setBusy]=useState(true),[sending,setSending]=useState(false);
 const load=async()=>{setBusy(true);try{const rows=await studentApi("support_messages?select=id,subject,message,status,created_at&order=created_at.desc&limit=20");setItems(rows||[]);}catch(error){console.error("support_load",error);setItems([]);}finally{setBusy(false);}};
 useEffect(()=>{load();},[]);
 const submit=async()=>{if(!profile?.id)return notify({type:"error",title:"بيانات الحساب غير جاهزة",message:"أعد تحميل الصفحة وحاول مرة أخرى."});if(subject.trim().length<4||message.trim().length<10)return notify({type:"warning",title:"أكمل تفاصيل الطلب",message:"اكتب عنوانًا واضحًا ورسالة لا تقل عن 10 أحرف."});setSending(true);try{await studentApi("support_messages",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({user_id:profile.id,subject:subject.trim(),message:message.trim()})});setSubject("");setMessage("");await load();notify({type:"success",title:"تم إرسال طلبك",message:"تم حفظ طلب الدعم في حسابك."});}catch(error){console.error("support_submit",error);notify({type:"error",title:"تعذر إرسال الطلب",message:"لم يتم حفظ الطلب. حاول مرة أخرى بعد قليل."});}finally{setSending(false);}};
 const statusLabel={open:"مفتوح",pending:"قيد المتابعة",in_progress:"جارٍ العمل عليه",resolved:"تم الحل",closed:"مغلق"};
 return <div className="platform-page"><PageBanner eyebrow="STUDENT SUPPORT CENTER" title="الدعم الفني وخدمة الطلاب" description="أرسل استفسارك وتابع طلبات الدعم المحفوظة على حسابك." art="support"/><div className="platform-subscription-layout"><section className="platform-panel platform-redeem-panel"><span className="platform-eyebrow">NEW SUPPORT REQUEST</span><h2>إرسال طلب جديد</h2><label htmlFor="support-subject">عنوان الطلب</label><input id="support-subject" value={subject} onChange={e=>setSubject(e.target.value)} maxLength={120} placeholder="مثال: مشكلة في فتح محاضرة"/><label htmlFor="support-message">تفاصيل المشكلة أو الاستفسار</label><textarea id="support-message" value={message} onChange={e=>setMessage(e.target.value)} rows={5} maxLength={2000} placeholder="اشرح لنا المشكلة بالتفصيل..."/><button className="platform-gold-button" onClick={submit} disabled={sending}>{sending?"جارٍ إرسال الطلب...":"إرسال إلى خدمة العملاء"}<Icon name="arrow"/></button></section><aside className="platform-panel platform-sub-status"><h3>طلباتك السابقة</h3>{busy?<p>جارٍ تحميل طلباتك...</p>:items.length?items.map(item=><article className="platform-support-ticket" key={item.id}><b>{item.subject}</b><p>{item.message}</p><span>{statusLabel[item.status]||"تم استلام الطلب"} · {new Date(item.created_at).toLocaleDateString("ar-EG")}</span></article>):<p>لا توجد طلبات دعم مسجلة على حسابك حتى الآن.</p>}</aside></div></div>;
}

function StudentResults(){
 const [items,setItems]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState(false);
 useEffect(()=>{let active=true;studentApi("exam_attempts?select=id,started_at,submitted_at,score,graded_at,exams(title,duration_minutes,courses(title))&order=started_at.desc&limit=50").then(rows=>{if(active)setItems(rows||[]);}).catch(err=>{console.error("results_load",err);if(active)setError(true);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[]);
 const completed=items.filter(x=>x.submitted_at),graded=completed.filter(x=>x.score!==null&&x.score!==undefined),average=graded.length?graded.reduce((sum,x)=>sum+Number(x.score),0)/graded.length:null;
 return <div className="platform-page"><PageBanner eyebrow="ACADEMIC PERFORMANCE" title="النتائج وتحليل المستوى" description="درجات محاولاتك المسجلة ونتائج الامتحانات بعد التصحيح." art="chart"/><div className="profile-v2-overview"><article><span className="profile-v2-metric-icon"><Icon name="exam" size={19}/></span><div><small>المحاولات المسجلة</small><b>{busy?"—":items.length}</b><em>من حسابك</em></div></article><article><span className="profile-v2-metric-icon cyan"><Icon name="check" size={19}/></span><div><small>امتحانات تم تسليمها</small><b>{busy?"—":completed.length}</b><em>محاولات مكتملة</em></div></article><article><span className="profile-v2-metric-icon violet"><Icon name="chart" size={19}/></span><div><small>متوسط الدرجات المسجلة</small><b>{average===null?"—":average.toLocaleString("ar-EG",{maximumFractionDigits:1})}</b><em>{graded.length?"من الدرجات المصححة":"لا توجد درجات مصححة بعد"}</em></div></article></div>{busy?<div className="platform-empty-state">جارٍ تحميل النتائج من قاعدة البيانات...</div>:error?<div className="platform-empty-state"><b>تعذر تحميل النتائج</b><span>تحقق من اتصالك وحاول مرة أخرى.</span></div>:items.length?<div className="platform-content-grid">{items.map(item=><article key={item.id}><span className="platform-content-icon"><Icon name="exam"/></span><div><b>{item.exams?.title||"امتحان"}</b><p>{item.exams?.courses?.title||"محتوى المنصة"} · {new Date(item.started_at).toLocaleDateString("ar-EG")}</p><small>{!item.submitted_at?"لم يتم التسليم":item.score===null||item.score===undefined?"تم التسليم — في انتظار التصحيح":("الدرجة: "+Number(item.score).toLocaleString("ar-EG"))}</small></div></article>)}</div>:<div className="platform-empty-state"><Icon name="chart" size={34}/><b>لا توجد نتائج مسجلة حتى الآن</b><span>عند دخول امتحانات وتسليمها ستظهر محاولاتك ودرجاتك هنا.</span></div>}</div>;
}


function HomeworkAdminPanel({profile}){
 const [title,setTitle]=useState(""),[description,setDescription]=useState(""),[grade,setGrade]=useState(gradeNames[2]),[group,setGroup]=useState(""),[due,setDue]=useState(""),[published,setPublished]=useState(true),[questions,setQuestions]=useState([]),[prompt,setPrompt]=useState(""),[type,setType]=useState("single_choice"),[choices,setChoices]=useState(""),[answer,setAnswer]=useState(""),[points,setPoints]=useState("1"),[busy,setBusy]=useState(false);
 const add=()=>{if(prompt.trim().length<4)return notify({type:"warning",title:"اكتب نص السؤال",message:"السؤال لازم يكون واضحًا."});if(type==="single_choice"&&choices.split("\n").filter(x=>x.trim()).length<2)return notify({type:"warning",title:"أضف الاختيارات",message:"سؤال الاختيار من متعدد يحتاج اختيارين على الأقل."});if(["single_choice","true_false"].includes(type)&&!answer.trim())return notify({type:"warning",title:"حدد الإجابة الصحيحة",message:"الإجابة الصحيحة مطلوبة للتصحيح التلقائي."});setQuestions(old=>[...old,{id:crypto.randomUUID(),prompt:prompt.trim(),question_type:type,choices:type==="single_choice"?choices.split("\n").map(x=>x.trim()).filter(Boolean):type==="true_false"?["صحيح","خطأ"]:[],correct_answer:answer.trim(),points:Number(points)||1}]);setPrompt("");setChoices("");setAnswer("");setPoints("1");};
 const create=async()=>{if(title.trim().length<3||!questions.length)return notify({type:"warning",title:"أكمل بيانات الواجب",message:"اكتب عنوانًا وأضف سؤالًا واحدًا على الأقل."});setBusy(true);let assignmentId=null;try{const rows=await studentApi("homework_assignments",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({title:title.trim(),description:description.trim(),grade,group_name:group.trim()||null,due_at:due?new Date(due).toISOString():null,is_published:false,created_by:profile.id})});assignmentId=rows?.[0]?.id;if(!assignmentId)throw new Error("assignment_create_failed");for(let i=0;i<questions.length;i++){const q=questions[i];const inserted=await studentApi("homework_questions",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({assignment_id:assignmentId,position:i,question_type:q.question_type,prompt:q.prompt,choices:q.choices,points:q.points})});const questionId=inserted?.[0]?.id;if(!questionId)throw new Error("question_create_failed");if(["single_choice","true_false"].includes(q.question_type))await studentApi("homework_answer_keys",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({question_id:questionId,correct_answer:q.correct_answer})});}if(published)await studentApi("homework_assignments?id=eq."+assignmentId,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({is_published:true,updated_at:new Date().toISOString()})});notify({type:"success",title:published?"تم نشر الواجب":"تم حفظ الواجب كمسودة",message:"تم حفظ "+questions.length+" سؤال في قاعدة البيانات."});setTitle("");setDescription("");setGroup("");setDue("");setQuestions([]);}catch(e){console.error("homework_admin_create",e);notify({type:"error",title:"تعذر إنشاء الواجب",message:"لم يكتمل الحفظ. راجع صلاحيات الإدارة وحاول مرة أخرى."});}finally{setBusy(false);}};
 return <section className="platform-panel hw-admin-panel"><span className="platform-eyebrow">HOMEWORK BUILDER</span><h2>إنشاء واجب أو تدريب جديد</h2><div className="hw-admin-fields"><label>عنوان الواجب<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="مثال: تدريب على قوانين الحركة"/></label><label>الصف الدراسي<select value={grade} onChange={e=>setGrade(e.target.value)}>{gradeNames.map(g=><option key={g}>{g}</option>)}</select></label><label>المجموعة (اختياري)<input value={group} onChange={e=>setGroup(e.target.value)} placeholder="اتركه فارغًا لكل مجموعات الصف"/></label><label>موعد التسليم<input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)}/></label><label className="wide">تعليمات الواجب<textarea rows={2} value={description} onChange={e=>setDescription(e.target.value)} placeholder="اكتب تعليمات أو تفاصيل الواجب..."/></label></div><div className="hw-admin-question-editor"><h3>إضافة الأسئلة</h3><label>نوع السؤال<select value={type} onChange={e=>setType(e.target.value)}><option value="single_choice">اختيار من متعدد</option><option value="true_false">صح أو خطأ</option><option value="short_answer">إجابة قصيرة</option><option value="essay">سؤال مقالي / مسألة</option></select></label><label>نص السؤال<textarea rows={3} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="اكتب السؤال بالتفصيل..."/></label>{type==="single_choice"&&<label>الاختيارات (كل اختيار في سطر)<textarea rows={4} value={choices} onChange={e=>setChoices(e.target.value)} placeholder={"الاختيار الأول\nالاختيار الثاني\nالاختيار الثالث\nالاختيار الرابع"}/></label>}{["single_choice","true_false"].includes(type)&&<label>الإجابة الصحيحة<input value={answer} onChange={e=>setAnswer(e.target.value)} placeholder={type==="true_false"?"صحيح أو خطأ":"اكتب الاختيار الصحيح بنفس الصياغة"}/></label>}<label>الدرجة<input type="number" min="0.5" step="0.5" value={points} onChange={e=>setPoints(e.target.value)}/></label><button type="button" onClick={add}>إضافة السؤال إلى الواجب</button></div>{questions.length>0&&<div className="hw-admin-question-list"><b>الأسئلة المضافة ({questions.length})</b>{questions.map((q,i)=><article key={q.id}><span>{i+1}. {q.prompt}</span><small>{q.points} درجة · {({single_choice:"اختيار من متعدد",true_false:"صح أو خطأ",short_answer:"إجابة قصيرة",essay:"مقالي"})[q.question_type]}</small><button onClick={()=>setQuestions(old=>old.filter(x=>x.id!==q.id))}>حذف</button></article>)}</div>}<label className="hw-publish-toggle"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/> نشر الواجب فور الحفظ</label><button className="platform-gold-button" onClick={create} disabled={busy}>{busy?"جارٍ حفظ الواجب والأسئلة...":published?"حفظ ونشر الواجب":"حفظ كمسودة"}<Icon name="arrow"/></button></section>;
}

function AdminPage({profile}){
 const [grade,setGrade]=useState(gradeNames[0]),[generated,setGenerated]=useState(""),[busy,setBusy]=useState(false);
 const create=async()=>{setBusy(true);setGenerated("");try{const code=await issueStudentSubscriptionCode(grade);setGenerated(typeof code==="string"?code:String(code).replace(/^"|"$/g,""));notify({type:"success",title:"تم إنشاء كود الاشتراك",message:"الكود صالح للاستخدام مرة واحدة للصف المحدد."});}catch(e){notify({type:"error",title:"تعذر إنشاء الكود",message:e.message==="not_authorized"?"حسابك لا يمتلك صلاحية الإدارة.":"تعذر إنشاء الكود. تأكد من صلاحيات حساب الإدارة."});}finally{setBusy(false);}};
 const copy=async()=>{try{await navigator.clipboard.writeText(generated);notify({type:"success",title:"تم نسخ الكود",message:"احتفظ بالكود وشاركه مع الطالب."});}catch{notify({type:"warning",title:"انسخ الكود يدويًا",message:"حدد الكود وانسخه."});}};
 return <div className="platform-page"><PageBanner eyebrow="ADMINISTRATION" title="إدارة الاشتراكات والأكواد" description="إصدار أكواد شهرية مخصصة لكل صف دراسي. صلاحية الإصدار متاحة لحسابات الإدارة فقط." art="settings"/><section className="platform-panel platform-redeem-panel"><span className="platform-eyebrow">ONE-TIME SUBSCRIPTION CODE</span><h2>إنشاء كود اشتراك جديد</h2><label htmlFor="admin-code-grade">الصف الدراسي</label><select id="admin-code-grade" value={grade} onChange={e=>setGrade(e.target.value)}>{gradeNames.map(g=><option key={g}>{g}</option>)}</select><button className="platform-gold-button" onClick={create} disabled={busy}>{busy?"جارٍ إنشاء الكود...":"إنشاء كود جديد"}<Icon name="ticket"/></button>{generated&&<div className="platform-generated-code"><small>الكود الجديد — يظهر مرة واحدة</small><strong dir="ltr">{generated}</strong><button className="platform-gold-button" onClick={copy}>نسخ الكود<Icon name="file"/></button></div>}</section><HomeworkAdminPanel profile={profile}/></div>;
}

createRoot(document.getElementById("root")).render(<MessageProvider><App/></MessageProvider>);
