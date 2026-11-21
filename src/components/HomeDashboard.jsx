import React, { useEffect, useState } from "react";
import { getSavedStudentSession, refreshStudentSession } from "../lib/auth.js";

const shortcuts = [
  { id:"courses", icon:"▦", title:"الكورسات", desc:"محتوى المنهج والمجموعات", tone:"gold" },
  { id:"lessons", icon:"▶", title:"المحاضرات", desc:"شرح الدروس خطوة بخطوة", tone:"blue" },
  { id:"files", icon:"▤", title:"الملفات والمذكرات", desc:"مذكرات وملخصات قابلة للتحميل", tone:"violet" },
  { id:"homework", icon:"✎", title:"الواجبات", desc:"تدريباتك وتسليماتك", tone:"green" },
  { id:"exams", icon:"▣", title:"الامتحانات", desc:"اختبر مستواك وتابع نتيجتك", tone:"orange" },
  { id:"results", icon:"▥", title:"التقدم الدراسي", desc:"إنجازك ونتائجك في مكان واحد", tone:"cyan" }
];

function LineIcon({ name }) {
  const paths = {
    bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    support:<><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2Zm16 0h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2ZM17 20c-1 1-2 1-5 1"/></>,
    arrow:<><path d="M5 12h14M13 6l6 6-6 6"/></>,
    user:<><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.7-4 3.2-6 7.5-6s6.8 2 7.5 6"/></>,
    check:<><path d="m5 12 4 4L19 6"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    chart:<><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></>,
    live:<><circle cx="12" cy="12" r="8"/><path d="m10 8 6 4-6 4z"/></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]||paths.user}</svg>;
}

export default function HomeDashboard({ onGo }) {
  const [notificationsOpen,setNotificationsOpen] = useState(false);
  const [profile,setProfile] = useState(null);
  const [loadingProfile,setLoadingProfile] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let session = getSavedStudentSession();
        if (!session?.access_token) session = await refreshStudentSession();
        if (!session?.access_token || !session?.user?.id) return;
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=full_name,avatar_url,is_verified,grade,group_name&id=eq.${encodeURIComponent(session.user.id)}&limit=1`,
          { headers:{ apikey:import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization:`Bearer ${session.access_token}` } }
        );
        if (!response.ok) return;
        const rows = await response.json();
        if (active && rows[0]) setProfile(rows[0]);
      } catch {
        // The dashboard remains usable while profile data is unavailable.
      } finally {
        if (active) setLoadingProfile(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const name = profile?.full_name?.trim()?.split(/\s+/)[0] || "طالبنا";
  const verified = profile?.is_verified === true;

  return <div className="home-dashboard" dir="rtl">
    <section className="home-hero">
      <div className="home-hero-shade"/>
      <div className="home-hero-content">
        <span className="home-eyebrow"><i/> منصتك التعليمية المتكاملة</span>
        <h1>كل خطوة بتقربك<br/><em>من التفوق.</em></h1>
        <p>اتعلم بتركيز، تدرّب بذكاء، وتابع رحلتك الدراسية من مكان واحد.</p>
        <div className="home-hero-actions">
          <button className="home-primary" onClick={()=>onGo("courses")}>استكشف الكورسات <LineIcon name="arrow"/></button>
          <button className="home-ghost" onClick={()=>onGo("exams")}>ابدأ اختبارًا <LineIcon name="arrow"/></button>
        </div>
      </div>
      <div className="home-hero-note"><span>EMAD EL SANAFIRY</span><b>MATHEMATICS</b><small>تعليم • تدريب • إنجاز</small></div>
    </section>

    <section className="home-welcome-row">
      <div className="home-student-greeting">
        <div className="home-avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt="الصورة الشخصية"/> : <LineIcon name="user"/>}</div>
        <div><span>مساحتك التعليمية</span><h2>أهلاً بيك، {name}{verified && <span className="home-verified" title="حساب موثق"><LineIcon name="check"/></span>}</h2><small>{profile?.grade || "رحلتك نحو التفوق تبدأ من هنا"}{profile?.group_name ? " · "+profile.group_name : ""}</small></div>
      </div>
      <button className="home-profile-link" onClick={()=>onGo("profile")}>الملف الشخصي <LineIcon name="arrow"/></button>
    </section>

    <section className="home-section">
      <div className="home-section-heading"><div><span>ابدأ من هنا</span><h2>أقسام منصتك</h2></div><small>كل أدواتك الدراسية في مكان واحد</small></div>
      <div className="home-shortcuts">{shortcuts.map(item=><button className="home-shortcut" key={item.id} onClick={()=>onGo(item.id)}><span className={`home-shortcut-icon ${item.tone}`}>{item.icon}</span><span className="home-shortcut-copy"><b>{item.title}</b><small>{item.desc}</small></span><span className="home-shortcut-arrow">←</span></button>)}</div>
    </section>

    <section className="home-insights-grid">
      <article className="home-insight-card home-progress-card">
        <div className="home-card-heading"><span className="home-card-icon"><LineIcon name="chart"/></span><span><b>تقدمك الدراسي</b><small>ملخص إنجازك</small></span></div>
        <div className="home-progress-empty"><div className="home-progress-ring"><LineIcon name="chart"/></div><b>رحلتك هتظهر هنا</b><p>هنا هتتابع نسبة إنجازك ونتائجك بمجرد تسجيل الأنشطة والدرجات الفعلية.</p></div>
        <button onClick={()=>onGo("results")}>عرض صفحة التقدم <LineIcon name="arrow"/></button>
      </article>
      <article className="home-insight-card home-exams-card">
        <div className="home-card-heading"><span className="home-card-icon"><LineIcon name="calendar"/></span><span><b>الامتحانات والتقييم</b><small>اختبر مستواك باستمرار</small></span></div>
        <div className="home-exam-feature">
          <div className="home-exam-art"><span>EXAM</span><b>01</b><i>∑</i></div>
          <div><b>مركز الامتحانات</b><p>ادخل إلى الاختبارات المتاحة، وشاهد نتيجتك وتحليل إجاباتك.</p></div>
        </div>
        <button onClick={()=>onGo("exams")}>الذهاب للامتحانات <LineIcon name="arrow"/></button>
      </article>
    </section>

    <section className="home-live-banner">
      <div className="home-live-symbol"><LineIcon name="live"/></div>
      <div><span>LIVE LEARNING</span><h2>المحاضرات المباشرة</h2><p>مساحة البث المباشر هتكون هنا لمتابعة حصصك وقت إتاحتها.</p></div>
      <span className="home-coming-soon">قريبًا</span>
    </section>

    <section className="home-bottom-grid">
      <button className="home-bottom-tile" onClick={()=>onGo("schedule")}><span><LineIcon name="calendar"/></span><b>جدول الحصص</b><small>مواعيدك وتنظيم وقتك</small><i>←</i></button>
      <button className="home-bottom-tile" onClick={()=>onGo("messages")}><span><LineIcon name="support"/></span><b>الدعم الفني</b><small>مساعدة واستفسارات المنصة</small><i>←</i></button>
      <button className="home-bottom-tile" onClick={()=>onGo("profile")}><span><LineIcon name="user"/></span><b>ملفي الشخصي</b><small>بياناتك وصورتك وحسابك</small><i>←</i></button>
    </section>

    <button className="home-floating-support" onClick={()=>onGo("messages")} aria-label="الدعم الفني"><LineIcon name="support"/><span>الدعم الفني</span></button>

    {notificationsOpen && <div className="home-notification-popover">
      <div className="home-notification-head"><div><b>الإشعارات</b><small>تنبيهات المنصة وتحديثاتك</small></div><button onClick={()=>setNotificationsOpen(false)} aria-label="إغلاق">×</button></div>
      <div className="home-notification-empty"><span><LineIcon name="bell"/></span><b>مفيش إشعارات جديدة</b><p>أي تنبيه جديد بخصوص المحاضرات أو الواجبات أو الامتحانات هيظهر هنا.</p></div>
    </div>}
    <button className="home-notification-trigger" onClick={()=>setNotificationsOpen(v=>!v)} aria-label="فتح الإشعارات"><LineIcon name="bell"/><span>الإشعارات</span></button>
  </div>;
}
