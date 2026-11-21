import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import SplashScreen from "./pages/SplashScreen.jsx";
import AuthScreen from "./pages/AuthScreen.jsx";
import MessageProvider, { notify } from "./components/MessageProvider.jsx";
import { refreshStudentSession, clearStudentSession } from "./lib/auth.js";

const mainNav = [
  ["home","الرئيسية","⌂"],["courses","الكورسات","▦"],["lessons","المحاضرات","▶"],
  ["exams","الامتحانات","▣"],["homework","الواجبات","✎"],["files","الملفات","▤"],
  ["results","النتائج","◫"],["live","اللايف","◉"]
];
const moreNav = [
  ["schedule","جدول الحصص"],["messages","الدعم الفني"],["ai","المساعد الذكي"],
  ["subscriptions","الاشتراكات"],["profile","الملف الشخصي"],["settings","الإعدادات"]
];
const pageInfo = {
  courses:["مكتبة الكورسات","كل كورساتك ومجموعاتك التعليمية في مساحة واحدة.","تعلّم","استكشف المحتوى التعليمي المنظم حسب الصف والمجموعة."],
  lessons:["مركز المحاضرات","محاضراتك المسجلة والمباشرة مرتبة لتوصل للمعلومة بسرعة.","شاهد وتعلّم","تابع آخر محاضراتك وواصل من حيث توقفت."],
  exams:["مركز الامتحانات","اختبارات منظمة لقياس مستواك ومراجعة إجاباتك.","اختبر نفسك","استعد للامتحان بتدريبات تحاكي شكل الاختبارات."],
  homework:["الواجبات والتدريبات","اعرف المطلوب منك ومواعيد التسليم وتابع التصحيح.","تدرّب باستمرار","كل تدريباتك ومهامك الدراسية في مكان واحد."],
  files:["مكتبة الملفات","المذكرات والملخصات وأوراق العمل والملفات التعليمية.","مكتبتك","ملفات مرتبة وسهلة الوصول والتحميل."],
  results:["النتائج والتحليل","تابع درجاتك ومستوى تقدمك ونقاط القوة التي تحتاج دعمًا.","راقب تقدمك","ستظهر النتائج الفعلية عند ربط نظام التقييم."],
  schedule:["جدولك الدراسي","نظّم مواعيد المحاضرات والامتحانات والمهام القادمة.","خطّط أسبوعك","جدول موحد يساعدك تتابع التزاماتك."],
  messages:["مركز الدعم الفني","تواصل مع فريق المنصة وتابع استفساراتك وطلبات المساعدة.","نحن هنا لمساعدتك","سيتم ربط المحادثات وإرسال الرسائل في مرحلة تشغيل الدعم."],
  live:["المحاضرات المباشرة","ادخل إلى مساحة المحاضرات والبث المباشر عند إتاحتها.","تعلّم مباشرة","مكان مخصص للبث والتفاعل أثناء الحصة."],
  ai:["المساعد الذكي","مساعدك الدراسي لفهم الرياضيات والتدريب على حل المسائل.","ذكاء يساعدك تتقدم","سيتم بناء المساعد وربطه بأدوات المنهج في مرحلة مستقلة."],
  subscriptions:["الاشتراكات والأكواد","إدارة اشتراكك الشهري وتفعيل كود الاشتراك الخاص بك.","اشتراكك التعليمي","أكواد الاشتراك منفصلة تمامًا عن بيانات تسجيل الدخول."],
  profile:["ملفك الشخصي","بيانات حسابك وصورتك ومعلومات مجموعتك التعليمية.","حسابك","ستظهر بيانات حسابك الفعلية بعد تحميلها من قاعدة البيانات."],
  settings:["إعدادات المنصة","تحكم في تفضيلات حسابك والإشعارات والأمان.","تحكم في تجربتك","إعدادات الحساب والمنصة في مكان واحد."]
};
function Mark({children}){return <span className="platform-mark">{children}</span>}
function App(){
 const [page,setPage]=useState("splash");
 const [moreOpen,setMoreOpen]=useState(false);
 const [accountOpen,setAccountOpen]=useState(false);
 const [mobileNav,setMobileNav]=useState(false);
 const completeSplash=async()=>{
  try{const session=await refreshStudentSession();setPage(session?.access_token?"home":"login");}
  catch{setPage("login");}
 };
 const go=(next)=>{setPage(next);setMoreOpen(false);setAccountOpen(false);setMobileNav(false);};
 if(page==="splash") return <SplashScreen onComplete={completeSplash}/>;
 if(page==="login"||page==="signup") return <div className="auth-entry-reveal"><AuthScreen mode={page} onModeChange={setPage} onSuccess={()=>setPage("home")}/></div>;
 const title=page==="admin"?"لوحة المالك":page==="teacher"?"لوحة المستر":pageInfo[page]?.[0]||"منصة مستر عماد";
 const logout=()=>{clearStudentSession();go("login");};
 return <div className="platform-app" dir="rtl">
  <header className="platform-header">
   <button className="platform-mobile-toggle" onClick={()=>setMobileNav(v=>!v)} aria-label="فتح القائمة">☰</button>
   <button className="platform-brand" onClick={()=>go("home")}><span className="platform-brand-symbol">∑</span><span><b>مستر عماد السنافيري</b><small>منصة الرياضيات التعليمية</small></span></button>
   <nav className={mobileNav?"platform-nav mobile-open":"platform-nav"}>
    {mainNav.map(([id,label,icon])=><button key={id} className={page===id?"selected":""} onClick={()=>go(id)}><span>{icon}</span>{label}</button>)}
    <div className="platform-nav-more">
     <button className={moreOpen?"selected":""} onClick={()=>{setMoreOpen(v=>!v);setAccountOpen(false);}}>المزيد <span>⌄</span></button>
     {moreOpen&&<div className="platform-dropdown">{moreNav.map(([id,label])=><button key={id} onClick={()=>go(id)}>{label}<span>←</span></button>)}</div>}
    </div>
   </nav>
   <div className="platform-header-actions">
    <button className="platform-icon-button" title="الإشعارات" onClick={()=>notify({type:"info",title:"الإشعارات",message:"سيتم عرض تنبيهات حسابك هنا بعد تفعيل نظام الإشعارات."})}>♧</button>
    <div className="platform-account">
     <button className="platform-account-button" onClick={()=>{setAccountOpen(v=>!v);setMoreOpen(false);}}><span className="platform-account-avatar">∑</span><span className="platform-account-label">حسابي</span><span>⌄</span></button>
     {accountOpen&&<div className="platform-dropdown account-dropdown">{[["profile","الملف الشخصي"],["subscriptions","اشتراكاتي"],["settings","الإعدادات"],["admin","لوحة الإدارة"]].map(([id,label])=><button key={id} onClick={()=>go(id)}>{label}<span>←</span></button>)}<button onClick={logout}>تسجيل الخروج<span>↗</span></button></div>}
    </div>
   </div>
  </header>
  <div className="platform-page-topline"><span>منصة مستر عماد</span><i>/</i><b>{title}</b><span className="platform-topline-spacer"/><span className="platform-status"><i/> مساحة الطالب</span></div>
  <main className="platform-main">
   {page==="home"?<HomePage go={go}/>:page==="subscriptions"?<SubscriptionsPage/>:page==="settings"?<SettingsPage/>:page==="ai"?<GenericPage page={page} go={go}/>:page==="admin"||page==="teacher"?<AdminPage page={page} go={go}/>:page==="profile"?<ProfilePage/>:<GenericPage page={page} go={go}/>}
  </main>
  <footer className="platform-footer"><b>مستر عماد السنافيري</b><span>منصة تعليمية متكاملة</span><span>© 2026</span></footer>
 </div>;
}
function HomePage({go}){
 const tiles=[["courses","الكورسات","محتوى المنهج والمجموعات","▦"],["lessons","المحاضرات","شرح الدروس خطوة بخطوة","▶"],["exams","الامتحانات","اختبارات وتقييمات دورية","▣"],["homework","الواجبات","تدريباتك ومهامك","✎"],["files","الملفات والمذكرات","ملخصات وأوراق عمل","▤"],["results","النتائج والمتابعة","درجاتك وتحليل مستواك","◫"]];
 return <div className="platform-home">
  <section className="platform-hero">
   <div className="platform-hero-copy"><span className="platform-eyebrow"><i/> YOUR LEARNING SPACE</span><h1>ابدأ رحلتك نحو<br/><em>التفوق الحقيقي.</em></h1><p>كل ما تحتاجه في الرياضيات، من شرح وتدريب وامتحانات ومتابعة، في منصة واحدة مصممة لتساعدك تتقدم.</p><div className="platform-hero-buttons"><button className="platform-primary" onClick={()=>go("courses")}>اكتشف الكورسات <span>←</span></button><button className="platform-secondary" onClick={()=>go("exams")}>ابدأ اختبارًا</button></div></div>
   <div className="platform-hero-visual"><div className="platform-hero-orbit"><span>∑</span><i>π</i><b>ƒ(x)</b><small>∫</small></div><div className="platform-hero-caption">LEARN · PRACTICE · ACHIEVE</div></div>
   <div className="platform-hero-bottom"><span>MATHEMATICS PLATFORM</span><span>تعليم بخطوات واضحة ونتائج قابلة للقياس</span></div>
  </section>
  <section className="platform-welcome"><div><span>أهلاً بيك في مساحتك التعليمية</span><h2>كل يوم فرصة جديدة للتقدم.</h2><p>ابدأ من القسم الذي تحتاجه، وتابع رحلتك التعليمية من مكان واحد.</p></div><button onClick={()=>go("profile")}>ملفي الشخصي <span>←</span></button></section>
  <section className="platform-section"><div className="platform-section-heading"><div><span>منصتك بين إيديك</span><h2>الأقسام التعليمية</h2></div><p>اختار القسم وابدأ مباشرة</p></div><div className="platform-feature-grid">{tiles.map(([id,name,desc,icon],i)=><button className="platform-feature" key={id} onClick={()=>go(id)}><span className={"platform-feature-icon tone-"+i}>{icon}</span><span className="platform-feature-text"><b>{name}</b><small>{desc}</small></span><i>←</i></button>)}</div></section>
  <section className="platform-promo-grid"><button className="platform-promo live-promo" onClick={()=>go("live")}><span className="platform-promo-tag">LIVE CLASSROOM</span><b>المحاضرات المباشرة</b><small>تابع حصصك وتفاعل وقت البث</small><i>←</i></button><button className="platform-promo ai-promo" onClick={()=>go("ai")}><span className="platform-promo-tag">SMART LEARNING</span><b>المساعد الذكي</b><small>مساحة ذكية للتعلم وحل المسائل — قريبًا</small><i>←</i></button></section>
  <section className="platform-bottom-links"><button onClick={()=>go("schedule")}>جدول الحصص <span>↗</span></button><button onClick={()=>go("messages")}>الدعم الفني <span>↗</span></button><button onClick={()=>go("subscriptions")}>إدارة الاشتراك <span>↗</span></button></section>
 </div>;
}
function GenericPage({page,go}){
 const data=pageInfo[page]||pageInfo.courses;
 return <div className="platform-inner-page"><section className="platform-page-hero"><div><span className="platform-eyebrow">STUDENT PORTAL / {page.toUpperCase()}</span><h1>{data[0]}</h1><p>{data[1]}</p></div><div className="platform-page-art">∑</div></section><div className="platform-content-heading"><div><span>{data[2]}</span><h2>{data[0]}</h2></div><span className="platform-coming">مساحتك التعليمية</span></div><div className="platform-empty-panel"><div className="platform-empty-symbol">✦</div><h3>{data[3]}</h3><p>القسم ده هيتبني بصفحات وأدوات مستقلة، وهيتربط ببيانات حسابك الحقيقية. مش هنعرض درجات أو محتوى تجريبي على إنه بيانات فعلية.</p><button className="platform-primary" onClick={()=>go("home")}>العودة للرئيسية <span>←</span></button></div></div>;
}
function SubscriptionsPage(){
 return <div className="platform-inner-page"><section className="platform-page-hero subscription-hero"><div><span className="platform-eyebrow">MEMBERSHIP & ACCESS</span><h1>اشتراكك التعليمي</h1><p>فعّل اشتراكك الشهري بكود مستقل عن رقم الطالب وكلمة المرور.</p></div><div className="platform-page-art">◇</div></section><div className="subscription-layout"><section className="subscription-card"><span className="platform-eyebrow">MONTHLY ACCESS</span><h2>الاشتراك الشهري</h2><p>اكتب كود الاشتراك الذي حصلت عليه لتفعيل مدة الاشتراك على حسابك.</p><label htmlFor="subscription-code">كود الاشتراك</label><input id="subscription-code" placeholder="مثال: EMAD-XXXX-XXXX" autoComplete="off"/><button className="platform-primary" onClick={()=>notify({type:"info",title:"تفعيل الاشتراك",message:"واجهة التفعيل جاهزة. سيتم تشغيل التحقق من الأكواد وربط مدة الشهر بقاعدة البيانات في المرحلة التالية."})}>تفعيل الكود <span>←</span></button><small>كل كود اشتراك صالح للاستخدام مرة واحدة فقط.</small></section><aside className="subscription-info"><h3>كيف يعمل الاشتراك؟</h3><ol><li>أنشئ حساب الطالب وسجّل الدخول.</li><li>احصل على كود اشتراك شهري.</li><li>أدخل الكود داخل هذه الصفحة.</li><li>يبدأ الشهر من وقت تفعيل الكود.</li></ol><p>أكواد الاشتراك ليست أكواد تسجيل الدخول، ولكل نوع استخدام منفصل.</p></aside></div></div>;
}
function SettingsPage(){return <div className="platform-inner-page"><section className="platform-page-hero"><div><span className="platform-eyebrow">ACCOUNT PREFERENCES</span><h1>إعدادات المنصة</h1><p>كل إعدادات حسابك وتجربتك التعليمية في مكان واحد.</p></div><div className="platform-page-art">⚙</div></section><div className="settings-grid">{[["الملف الشخصي","الاسم والصورة والبيانات الشخصية"],["الإشعارات","تنبيهات المحاضرات والواجبات والامتحانات"],["الأمان والحساب","إدارة كلمة المرور والجلسات"],["تفضيلات العرض","اللغة وطريقة عرض المنصة"]].map(([a,b])=><article key={a}><b>{a}</b><p>{b}</p><span>سيتم تفعيل الإعدادات عند ربط كل خدمة.</span></article>)}</div></div>}
function ProfilePage(){return <div className="platform-inner-page"><section className="platform-page-hero"><div><span className="platform-eyebrow">STUDENT PROFILE</span><h1>ملفك الشخصي</h1><p>بياناتك وصورتك ومعلومات حسابك التعليمي.</p></div><div className="platform-page-art">◎</div></section><div className="platform-empty-panel"><div className="platform-empty-symbol">◎</div><h3>ملفك الشخصي في مكان واحد</h3><p>سيتم عرض بيانات الطالب وصورته ومجموعته وحالة التوثيق من قاعدة البيانات.</p></div></div>}
function AdminPage({page,go}){return <div className="platform-inner-page"><section className="platform-page-hero"><div><span className="platform-eyebrow">MANAGEMENT CENTER</span><h1>{page==="admin"?"لوحة المالك":"لوحة المستر"}</h1><p>إدارة المحتوى والطلاب والاشتراكات والصلاحيات من مساحة مخصصة.</p></div><div className="platform-page-art">⌘</div></section><div className="settings-grid">{["إدارة الطلاب","إدارة الكورسات","إدارة المحاضرات","الامتحانات والنتائج","إدارة الاشتراكات والأكواد","إعدادات المنصة"].map((x,i)=><article key={x}><b>{x}</b><p>أدوات تحكم مخصصة لهذا القسم.</p><button onClick={()=>go(i===4?"subscriptions":i===1?"courses":i===3?"exams":"home")}>فتح القسم ←</button></article>)}</div></div>}
createRoot(document.getElementById("root")).render(<MessageProvider><App/></MessageProvider>);
