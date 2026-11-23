import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import "./home.css";
import SplashScreen from "./pages/SplashScreen.jsx";
import AuthScreen from "./pages/AuthScreen.jsx";
import MessageProvider, { notify } from "./components/MessageProvider.jsx";
import { refreshStudentSession, clearStudentSession, loadStudentWorkspace, studentApi, redeemStudentSubscription, markStudentNotificationRead, issueStudentSubscriptionCode } from "./lib/auth.js";

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
function App(){
 const [page,setPage]=useState("splash"),[profile,setProfile]=useState(null),[subscription,setSubscription]=useState(null),[notifications,setNotifications]=useState([]),[moreOpen,setMoreOpen]=useState(false),[accountOpen,setAccountOpen]=useState(false),[mobileNav,setMobileNav]=useState(false),[loading,setLoading]=useState(false);
 const pageRef=useRef(page);
 useEffect(()=>{pageRef.current=page;},[page]);
 useEffect(()=>{const marker="emad-platform";const current={marker,page:"splash"};try{window.history.replaceState({marker,guard:true},"",window.location.href);window.history.pushState(current,"",window.location.href);}catch{}const onPopState=event=>{const state=event.state;if(state?.marker===marker&&!state.guard&&typeof state.page==="string"){setPage(state.page);setMoreOpen(false);setAccountOpen(false);setMobileNav(false);return;}try{window.history.pushState({marker,page:pageRef.current},"",window.location.href);}catch{setPage(pageRef.current);}};window.addEventListener("popstate",onPopState);return()=>window.removeEventListener("popstate",onPopState);},[]);
 const loadWorkspace=async()=>{setLoading(true);try{const w=await loadStudentWorkspace();setProfile(w.profile);setSubscription(w.subscription);setNotifications(w.notifications);}catch(e){console.error("workspace_load",e);}finally{setLoading(false);}};
 const completeSplash=async()=>{try{const session=await refreshStudentSession();if(session?.access_token){await loadWorkspace();go("home");}else go("login");}catch{go("login");}};
 useEffect(()=>{if(page==="home"&& !profile)loadWorkspace();},[page]);
 useEffect(()=>{const closeMenus=event=>{const target=event.target;if(!target.closest(".platform-navigation")&&!target.closest(".platform-mobile-menu"))setMobileNav(false);if(!target.closest(".platform-nav-more"))setMoreOpen(false);if(!target.closest(".platform-account-menu"))setAccountOpen(false);};document.addEventListener("pointerdown",closeMenus);return()=>document.removeEventListener("pointerdown",closeMenus);},[]);
 const grade=profile?.grade||"";
 const nav=navByGrade[grade]||navByGrade["الصف الأول الثانوي"];
 const unread=notifications.filter(n=>!n.read_at).length;
 const go=next=>{if(!next||next===pageRef.current)return;try{window.history.pushState({marker:"emad-platform",page:next},"",window.location.href);}catch{}pageRef.current=next;setPage(next);setMoreOpen(false);setAccountOpen(false);setMobileNav(false);};
 const logout=()=>{clearStudentSession();setProfile(null);setSubscription(null);setNotifications([]);go("login");};
 if(page==="splash")return <SplashScreen onComplete={completeSplash}/>;
 if(page==="login"||page==="signup")return <div className="auth-entry-reveal"><AuthScreen mode={page} onModeChange={go} onSuccess={async()=>{await loadWorkspace();go("home");}}/></div>;
 const needsSubscription=["courses","lessons","exams","homework","files","results","schedule","live","ai","groups"].includes(page);
 const activeSubscription=subscription&&new Date(subscription.ends_at)>new Date();
 const isLocked=needsSubscription&&!activeSubscription;
 return <div className="platform-shell" dir="rtl">
  <header className="platform-topbar">
   <button className="platform-mobile-menu" aria-label="فتح القائمة الرئيسية" aria-expanded={mobileNav} onClick={()=>setMobileNav(v=>!v)}><span/><span/><span/></button>
   <button className="platform-logo" onClick={()=>go("home")} aria-label="العودة للرئيسية"><span className="platform-logo-icon"><Icon name="crown" size={22}/></span><span className="platform-brand-copy"><b>مستر عماد السنافيري</b><small>منصة الرياضيات التعليمية</small></span></button>
   <div className="platform-top-actions">
    <button className="platform-notification-button" aria-label="الإشعارات" onClick={()=>go("notifications")}><Icon name="bell" size={19}/>{unread>0&&<span className="platform-count">{unread>99?"99+":unread}</span>}</button>
    <div className="platform-account-menu"><button className="platform-account-trigger" onClick={()=>{setAccountOpen(v=>!v);setMoreOpen(false);}}>{profile?.avatar_url?<img src={profile.avatar_url} alt=""/>:<span className="platform-avatar-fallback"><Icon name="user" size={18}/></span>}<span className="platform-account-copy"><b>{profile?.full_name||"حساب الطالب"}</b><small>{grade||"الملف الشخصي"}</small></span><span className="platform-account-chevron"><Icon name="chevron" size={13}/></span></button>{accountOpen&&<div className="platform-menu-pop platform-account-pop">{[["profile","الملف الشخصي","user"],["subscriptions","اشتراكاتي","ticket"],["settings","الإعدادات","settings"],["messages","الدعم الفني","support"]].map(([id,label,ico])=><button key={id} onClick={()=>go(id)}><Icon name={ico} size={17}/>{label}</button>)}{profile?.role==="admin"&&<button onClick={()=>go("admin")}><Icon name="settings" size={17}/>إدارة المنصة</button>}<button onClick={logout}><Icon name="logout" size={17}/>تسجيل الخروج</button></div>}</div>
   </div>
  </header>
  <nav className="platform-quickbar" aria-label="اختصارات سريعة">
   {[["home","الرئيسية","home"],["courses","الكورسات","book"],["exams","الامتحانات","exam"],["schedule","الجدول","calendar"],["ai","المساعد الذكي","spark"]].map(([id,label,ico])=><button key={id} className={page===id?"active":""} onClick={()=>go(id)}><Icon name={ico} size={16}/><span>{label}</span></button>)}
  </nav>
  <div className="platform-navrail">
   {mobileNav&&<button className="platform-drawer-backdrop" aria-label="إغلاق القائمة" onClick={()=>setMobileNav(false)}/>}
   <nav className={mobileNav?"platform-navigation is-open":"platform-navigation"} aria-label="القائمة الرئيسية">
    {nav.map(([id,label,ico])=><button key={id} className={page===id?"active":""} onClick={()=>go(id)}><Icon name={ico} size={17}/><span>{label}</span></button>)}
    <div className="platform-nav-more"><button className={moreOpen?"active":""} onClick={()=>{setMoreOpen(v=>!v);setAccountOpen(false);}}><Icon name="spark" size={17}/><span>المزيد</span><Icon name="chevron" size={14}/></button>{moreOpen&&<div className="platform-menu-pop">{moreNav.map(([id,label,ico])=><button key={id} onClick={()=>go(id)}><Icon name={ico} size={17}/>{label}</button>)}</div>}</div>
   </nav>
  </div>
  <div className="platform-subbar"><div><span>مستر عماد</span><Icon name="chevron" size={13}/><b>{pageTitles[page]||"المنصة"}</b></div><span className="platform-grade-label">{grade||"الصف الدراسي غير محدد"}</span></div>
  <main className={`platform-viewport page-${page}`} key={page}>
   {page==="home"?<HomePage profile={profile} subscription={activeSubscription?subscription:null} go={go} grade={grade} unread={unread}/>:null}
   {page==="subscriptions"?<SubscriptionsPage subscription={subscription} onActivated={async()=>{await loadWorkspace();notify({type:"success",title:"تم تفعيل الاشتراك",message:"تم تفعيل اشتراكك الشهري بنجاح."});}}/>:null}
   {page==="profile"?<ProfilePage profile={profile} subscription={subscription} notifications={notifications} grade={grade} go={go} loading={loading}/>:null}
   {page==="settings"?<SettingsPage profile={profile}/>:null}
   {page==="admin"&&profile?.role==="admin"?<AdminPage/>:null}
   {page==="notifications"?<NotificationsPage notifications={notifications} onRead={async n=>{try{await markStudentNotificationRead(n.id);setNotifications(old=>old.map(x=>x.id===n.id?{...x,read_at:new Date().toISOString()}:x));}catch{notify({type:"error",title:"تعذر تحديث الإشعار",message:"حاول مرة أخرى."});}}} go={go}/>:null}
   {isLocked?<LockedPage go={go} grade={grade}/>:null}
   {!isLocked&&["courses","lessons","exams"].includes(page)?<LearningPage page={page} grade={grade}/>:null}
   {!isLocked&&["homework","files","results","schedule","live","ai","groups"].includes(page)?<SectionPage page={page} go={go}/>:null}
   {page==="messages"?<SectionPage page={page} go={go}/>:null}
   {page==="admin"?<SectionPage page={page} go={go}/>:null}
  </main>
  <div className="platform-bottom-line"><span>مستر عماد السنافيري</span><span>منصة تعليمية متخصصة</span><span>© 2026</span></div>
 </div>;
}
const pageArtwork={
 book:"https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1500&q=85",
 play:"https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1500&q=85",
 exam:"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1500&q=85",
 task:"https://images.unsplash.com/photo-1455390582262-044c6a8a7d5b?auto=format&fit=crop&w=1500&q=85",
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
 const name=profile?.full_name?.trim()?.split(/\s+/)[0]||"طالبنا";
 const modules=[
  ["courses","المحتوى التعليمي","الكورسات والوحدات الدراسية","book","https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=85","01"],
  ["lessons","المحاضرات والدروس","شرح المنهج خطوة بخطوة","play","https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=85","02"],
  ["exams","مركز الامتحانات","اختبر فهمك وتابع تقييماتك","exam","https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=85","03"],
  ["homework","الواجبات والتدريبات","تدريبات ومهامك الدراسية","task","https://images.unsplash.com/photo-1455390582262-044c6a8a7d5b?auto=format&fit=crop&w=900&q=85","04"],
  ["files","المكتبة التعليمية","المذكرات والملفات الدراسية","file","https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=85","05"],
  ["results","النتائج وتحليل المستوى","راجع نتائجك عند نشرها","chart","https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=85","06"],
  ["schedule","الجدول الدراسي","مواعيد الحصص والمحاضرات","calendar","https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=85","07"],
  ["live","المحاضرات المباشرة","حصص البث والمحاضرات","live","https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85","08"],
  ["groups","الجروبات الدراسية","تواصل مع مجموعتك الدراسية","users","https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=85","09"]
 ];
 return <div className="platform-page home-v4">
  <section className="home-v4-hero">
   <div className="home-v4-hero-copy">
    <div className="home-v4-kicker"><span/> أكاديمية مستر عماد السنافيري <i>·</i> MATHEMATICS</div>
    <div className="home-v4-welcome">مساحتك التعليمية بدأت من هنا</div>
    <h1>أهلاً بيك يا {name}<br/><em>الرياضيات محتاجة فهم… مش حفظ.</em></h1>
    <p>اتعلم على خطوات واضحة، تدرب بذكاء، وتابع مستواك في مكان واحد. كل أدوات رحلتك الدراسية منظمة قدامك.</p>
    <div className="home-v4-pills">
     <span><Icon name="book" size={15}/>{grade||"صفك الدراسي"}</span>
     <span className={subscription?"is-active":""}><Icon name="ticket" size={15}/>{subscription?"اشتراك نشط":"الاشتراك غير مفعل"}</span>
    </div>
    <div className="home-v4-hero-actions">
     <button className="home-v4-primary" onClick={()=>go(subscription?"courses":"subscriptions")}>{subscription?"ابدأ التعلم الآن":"فعّل اشتراكك"} <Icon name="arrow" size={17}/></button>
     <button className="home-v4-outline" onClick={()=>go("schedule")}><Icon name="calendar" size={17}/> جدول الحصص</button>
    </div>
    <div className="home-v4-proof"><span>شرح منظم</span><i/><span>تدريب عملي</span><i/><span>متابعة مستمرة</span></div>
   </div>
   <div className="home-v4-portrait-wrap">
    <div className="home-v4-portrait-glow"/>
    <div className="home-v4-portrait"><img src="/IMG-20261121-WA0004.jpg" alt="مستر عماد السنافيري"/><div className="home-v4-portrait-caption"><b>مستر عماد السنافيري</b><span>معاك خطوة بخطوة في الرياضيات</span></div></div>
    <div className="home-v4-equation home-v4-equation-a">∫ f(x) dx</div>
    <div className="home-v4-equation home-v4-equation-b">a² + b² = c²</div>
   </div>
   <div className="home-v4-hero-index"><b>01</b><span>LEARN WITH CONFIDENCE</span></div>
  </section>
  <section className="home-v4-student-strip">
   <div className="home-v4-student-id">
    {profile?.avatar_url?<img src={profile.avatar_url} alt="صورة الطالب"/>:<span className="home-v4-student-placeholder"><Icon name="user" size={20}/></span>}
    <div><small>أهلاً بعودتك</small><b>{profile?.full_name||"حساب الطالب"}</b><span>رقم الطالب: {profile?.student_number||"—"}</span></div>
   </div>
   <div className="home-v4-student-detail"><small>الصف الدراسي</small><b>{grade||"غير محدد"}</b></div>
   <div className="home-v4-student-detail"><small>حالة الاشتراك</small><b className={subscription?"good":"warn"}>{subscription?"نشط":"غير مفعل"}</b></div>
   <button onClick={()=>go("profile")}>ملفي الشخصي <Icon name="arrow" size={15}/></button>
  </section>
  <section className="home-v4-section">
   <div className="home-v4-section-head"><div><span>YOUR LEARNING SPACE</span><h2>كل اللي تحتاجه في مكان واحد</h2><p>اختار القسم اللي عايز تبدأ منه، وكل خدمة ليها صفحة مستقلة.</p></div><button onClick={()=>go("courses")}>استكشف المحتوى <Icon name="arrow" size={15}/></button></div>
   <div className="home-v4-module-grid">
    {modules.map(([id,title,desc,ico,image,num])=><button key={id} className="home-v4-module" style={{"--home-card-image":'url("'+image+'")'}} onClick={()=>go(id)}>
     <span className="home-v4-module-no">{num}</span><span className="home-v4-module-icon"><Icon name={ico} size={20}/></span>
     <span className="home-v4-module-copy"><b>{title}</b><small>{desc}</small></span><span className="home-v4-module-arrow"><Icon name="arrow" size={15}/></span>
    </button>)}
   </div>
  </section>
  <section className="home-v4-ai-row">
   <div className="home-v4-ai-copy"><span className="home-v4-ai-label"><Icon name="spark" size={15}/> SMART MATH ASSISTANT</span><h2>واقف قدام مسألة؟<br/><em>خلّي الفكرة توضح.</em></h2><p>مساحة مخصصة لمساعدتك على فهم خطوات الحل والتعامل مع أفكار الرياضيات بطريقة منظمة.</p><button onClick={()=>go("ai")}>اكتشف المساعد الذكي <Icon name="arrow" size={16}/></button></div>
   <div className="home-v4-ai-art" role="img" aria-label="خلفية تقنية للذكاء الاصطناعي والرياضيات"><div className="home-v4-ai-orbit"/><div className="home-v4-ai-symbol">∑</div><span>AI × MATH</span></div>
  </section>
  <section className="home-v4-bottom-grid">
   <button onClick={()=>go("messages")}><span><Icon name="support" size={19}/></span><b>الدعم الفني</b><small>إحنا معاك لو احتجت مساعدة</small><Icon name="arrow" size={15}/></button>
   <button onClick={()=>go("notifications")}><span><Icon name="bell" size={19}/></span><b>الإشعارات</b><small>تابع آخر أخبار حسابك</small>{unread>0&&<em>{unread>99?"99+":unread}</em>}<Icon name="arrow" size={15}/></button>
   <button onClick={()=>go("subscriptions")}><span><Icon name="ticket" size={19}/></span><b>الاشتراكات</b><small>إدارة اشتراكك الدراسي</small><Icon name="arrow" size={15}/></button>
  </section>
 </div>;
}

function LockedPage({go,grade}){return <div className="platform-page"><PageBanner eyebrow="MEMBERSHIP REQUIRED" title="المحتوى التعليمي متاح للمشتركين" description="فعّل اشتراكك الشهري بكود مخصص لصفك الدراسي لفتح المحاضرات والامتحانات وباقي الخدمات." art="lock"/><section className="platform-lock-panel"><span className="platform-lock-icon"><Icon name="lock" size={30}/></span><h2>فعّل اشتراكك للمتابعة</h2><p>الاشتراك مرتبط بحسابك وبـ {grade||"صفك الدراسي"}، ولا يمكن فتح المحتوى قبل تفعيل كود صالح.</p><button className="platform-gold-button" onClick={()=>go("subscriptions")}>الانتقال للاشتراكات<Icon name="arrow"/></button></section></div>}
function SubscriptionsPage({subscription,onActivated}){
 const [code,setCode]=useState(""),[busy,setBusy]=useState(false);
 const activate=async()=>{if(!code.trim())return notify({type:"warning",title:"كود الاشتراك مطلوب",message:"اكتب الكود الذي حصلت عليه أولاً."});setBusy(true);try{await redeemStudentSubscription(code.trim());setCode("");await onActivated();}catch(e){const map={subscription_code_invalid_or_used:"الكود غير صحيح أو تم استخدامه من قبل أو لا يخص صفك الدراسي.",not_authenticated:"انتهت جلسة الدخول. سجّل الدخول مرة أخرى.",student_profile_not_found:"تعذر العثور على بيانات الطالب."};notify({type:"error",title:"تعذر تفعيل الاشتراك",message:map[e.message]||"حدث خطأ أثناء التفعيل. راجع الكود وحاول مرة أخرى."});}finally{setBusy(false);}};
 return <div className="platform-page"><PageBanner eyebrow="SUBSCRIPTION CENTER" title="الاشتراكات والأكواد" description="إدارة اشتراكك الشهري وتفعيل كود مستقل عن بيانات تسجيل الدخول." art="ticket"/><div className="platform-subscription-layout"><section className="platform-panel platform-redeem-panel"><span className="platform-eyebrow">MONTHLY ACCESS</span><h2>تفعيل الاشتراك الشهري</h2><p>اكتب كود الاشتراك المخصص لصفك. يتم تفعيل الكود مرة واحدة فقط ويبدأ الشهر من وقت التفعيل.</p><label htmlFor="student-sub-code">كود الاشتراك</label><input id="student-sub-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} placeholder="أدخل رقم الاشتراك" dir="ltr" inputMode="numeric" autoComplete="off"/><button className="platform-gold-button" onClick={activate} disabled={busy}>{busy?"جارٍ التحقق...":"تفعيل الاشتراك"}<Icon name="arrow"/></button></section><aside className="platform-panel platform-sub-status"><h3>حالة اشتراكك</h3>{subscription&&new Date(subscription.ends_at)>new Date()?<><span className="platform-active-pill">اشتراك نشط</span><b>ينتهي في</b><strong>{new Date(subscription.ends_at).toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"})}</strong><small>الصف المرتبط: {subscription.grade}</small></>:<><span className="platform-inactive-pill">لا يوجد اشتراك نشط</span><p>بعد تفعيل الكود ستظهر هنا مدة الاشتراك وتاريخ انتهائه.</p></>}<div className="platform-sub-rules"><b>قواعد الأكواد</b><span>• كود الاشتراك منفصل عن كود أو رقم تسجيل الدخول.</span><span>• كل كود يستخدم مرة واحدة فقط.</span><span>• مدة الاشتراك شهر واحد وتحدد حسب الصف الدراسي.</span></div></aside></div></div>;
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
function LearningPage({page,grade}){
 const [items,setItems]=useState([]),[busy,setBusy]=useState(true);
 const configs={courses:{title:"الكورسات والوحدات",desc:"المحتوى التعليمي المنشور والمخصص لصفك.",table:"courses",select:"id,title,description,subject,grade,created_at",filter:"status=eq.published",art:"book"},lessons:{title:"المحاضرات",desc:"المحاضرات والدروس المرتبطة بالكورسات المتاحة.",table:"lessons",select:"id,title,description,video_url,sort_order,course_id,created_at",filter:"is_published=eq.true",art:"play"},exams:{title:"الامتحانات",desc:"الاختبارات المنشورة لقياس مستواك.",table:"exams",select:"id,title,duration_minutes,opens_at,closes_at,course_id,created_at",filter:"is_published=eq.true",art:"exam"}};
 const cfg=configs[page];
 useEffect(()=>{let alive=true;setBusy(true);const query=cfg.table+"?select="+cfg.select+"&"+cfg.filter+"&order=created_at.desc";studentApi(query).then(rows=>{if(alive)setItems(rows||[]);}).catch(e=>{console.error("learning_load",e);if(alive)setItems([]);}).finally(()=>{if(alive)setBusy(false);});return()=>{alive=false;};},[page]);
 return <div className="platform-page"><PageBanner eyebrow={"GRADE CONTENT / "+(grade||"STUDENT").toUpperCase()} title={cfg.title} description={cfg.desc} art={cfg.art}/><div className="platform-content-list-heading"><h2>{cfg.title}</h2><span>{items.length} عنصر</span></div>{busy?<div className="platform-empty-state">جارٍ تحميل المحتوى من قاعدة البيانات...</div>:items.length?<div className="platform-content-grid">{items.map(item=><article key={item.id}><span className="platform-content-icon"><Icon name={cfg.art}/></span><div><b>{item.title}</b><p>{item.description||item.subject||"محتوى تعليمي"}</p>{item.duration_minutes&&<small>المدة: {item.duration_minutes} دقيقة</small>}</div></article>)}</div>:<div className="platform-empty-state"><Icon name={cfg.art} size={34}/><b>لا يوجد محتوى منشور حاليًا</b><span>عند إضافة محتوى لصفك سيظهر هنا مباشرة.</span></div>}</div>;
}
function SectionPage({page,go}){
 const data={homework:["الواجبات والتدريبات","تابع التكليفات والتدريبات المطلوبة منك.","task"],files:["المذكرات والملفات","مكتبة المذكرات والملخصات وأوراق العمل.","file"],results:["النتائج وتحليل المستوى","تابع درجاتك وقياس تقدمك الدراسي.","chart"],schedule:["جدول الحصص","مواعيد المحاضرات والامتحانات في جدول منظم.","calendar"],live:["المحاضرات المباشرة","تابع مواعيد البث المباشر والمحاضرات التفاعلية.","live"],ai:["المساعد الذكي","مساعد رياضيات مخصص لصفك الدراسي.","spark"],groups:["الجروبات الدراسية","مساحات تواصل منظمة لطلاب نفس الصف والمجموعة، مع إشراف وإعلانات ومناقشات تعليمية.","users"],messages:["الدعم الفني","تابع طلبات المساعدة وتواصل مع فريق المنصة.","support"],admin:["إدارة المنصة","إدارة المحتوى والطلاب والاشتراكات والصلاحيات.","settings"]}[page]||["القسم","", "book"];
 return <div className="platform-page"><PageBanner eyebrow="STUDENT SERVICES" title={data[0]} description={data[1]} art={data[2]}/><div className="platform-empty-state"><Icon name={data[2]} size={36}/><b>مساحة {data[0]}</b><span>سيتم توصيل هذه الخدمة ببياناتها وأدواتها الفعلية في مرحلة تنفيذ القسم.</span>{page==="ai"&&<small>سيكون المساعد مرتبطًا بالصف الدراسي والمحتوى المعتمد.</small>}{page==="messages"&&<button className="platform-gold-button" onClick={()=>notify({type:"info",title:"الدعم الفني",message:"سيتم تفعيل المحادثات المباشرة في مرحلة بناء خدمة الدعم."})}>طلب مساعدة</button>}</div></div>;
}

function AdminPage(){
 const [grade,setGrade]=useState(gradeNames[0]),[generated,setGenerated]=useState(""),[busy,setBusy]=useState(false);
 const create=async()=>{setBusy(true);setGenerated("");try{const code=await issueStudentSubscriptionCode(grade);setGenerated(typeof code==="string"?code:String(code).replace(/^"|"$/g,""));notify({type:"success",title:"تم إنشاء كود الاشتراك",message:"الكود صالح للاستخدام مرة واحدة للصف المحدد."});}catch(e){notify({type:"error",title:"تعذر إنشاء الكود",message:e.message==="not_authorized"?"حسابك لا يمتلك صلاحية الإدارة.":"تعذر إنشاء الكود. تأكد من صلاحيات حساب الإدارة."});}finally{setBusy(false);}};
 const copy=async()=>{try{await navigator.clipboard.writeText(generated);notify({type:"success",title:"تم نسخ الكود",message:"احتفظ بالكود وشاركه مع الطالب."});}catch{notify({type:"warning",title:"انسخ الكود يدويًا",message:"حدد الكود وانسخه."});}};
 return <div className="platform-page"><PageBanner eyebrow="ADMINISTRATION" title="إدارة الاشتراكات والأكواد" description="إصدار أكواد شهرية مخصصة لكل صف دراسي. صلاحية الإصدار متاحة لحسابات الإدارة فقط." art="settings"/><section className="platform-panel platform-redeem-panel"><span className="platform-eyebrow">ONE-TIME SUBSCRIPTION CODE</span><h2>إنشاء كود اشتراك جديد</h2><label htmlFor="admin-code-grade">الصف الدراسي</label><select id="admin-code-grade" value={grade} onChange={e=>setGrade(e.target.value)}>{gradeNames.map(g=><option key={g}>{g}</option>)}</select><button className="platform-gold-button" onClick={create} disabled={busy}>{busy?"جارٍ إنشاء الكود...":"إنشاء كود جديد"}<Icon name="ticket"/></button>{generated&&<div className="platform-generated-code"><small>الكود الجديد — يظهر مرة واحدة</small><strong dir="ltr">{generated}</strong><button className="platform-gold-button" onClick={copy}>نسخ الكود<Icon name="file"/></button></div>}</section></div>;
}

createRoot(document.getElementById("root")).render(<MessageProvider><App/></MessageProvider>);
