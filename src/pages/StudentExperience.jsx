import React, { useState } from "react";
import "./StudentExperience.css";

const primary = [
 ["home","الرئيسية","⌂"],["courses","الكورسات","▤"],["lessons","المحاضرات","▷"],["exams","الامتحانات","▧"],["homework","الواجبات","✓"],["files","المذكرات والملفات","▣"],["results","النتائج","↗"]
];
const secondary = [
 ["schedule","جدول الحصص","▦"],["live","المحاضرات المباشرة","◉"],["groups","الجروبات الدراسية","◎"],["ai","المساعد الذكي","✳"],["messages","الدعم الفني","☏"]
];
export default function StudentExperience({page,profile,grade,unread,go,logout,children}){
 const [drawer,setDrawer]=useState(false),[account,setAccount]=useState(false);
 const item=(entry)=>{const [id,label,glyph]=entry;return <button key={id} className={page===id?"se-nav-item active":"se-nav-item"} onClick={()=>{go(id);setDrawer(false)}}><span className="se-nav-glyph">{glyph}</span><span>{label}</span>{id==="notifications"&&unread>0?<i>{unread>99?"99+":unread}</i>:null}</button>};
 return <div className="student-experience" dir="rtl">
  <aside className={drawer?"se-sidebar open":"se-sidebar"}>
   <div className="se-brand"><div className="se-brand-mark">م</div><div><b>عماد السنافيري</b><small>أكاديمية الرياضيات</small></div><button className="se-close-drawer" onClick={()=>setDrawer(false)}>×</button></div>
   <div className="se-sidebar-student"><span className="se-avatar">{profile?.avatar_url?<img src={profile.avatar_url} alt=""/>:"ط"}</span><div><b>{profile?.full_name||"حساب الطالب"}</b><small>{grade||"الصف الدراسي"}</small></div><span className="se-online-dot"/></div>
   <div className="se-nav-caption">مساحتك التعليمية</div>
   <nav className="se-nav">{primary.map(item)}</nav>
   <div className="se-nav-caption">خدمات المنصة</div>
   <nav className="se-nav">{secondary.map(item)}</nav>
   <div className="se-nav-caption">حسابك</div>
   <nav className="se-nav">{item(["subscriptions","الاشتراك","◇"])}{item(["notifications","الإشعارات","♧"])}{item(["profile","ملفي الشخصي","◉"])}{item(["settings","الإعدادات","⚙"])}</nav>
   {profile?.role==="admin"?<><div className="se-nav-caption">الإدارة</div><nav className="se-nav">{item(["admin","لوحة الإدارة","▦"])}</nav></>:null}
   <div className="se-sidebar-foot"><div className="se-help-icon">?</div><div><b>محتاج مساعدة؟</b><small>فريق الدعم معاك</small></div><button onClick={()=>go("messages")}>←</button></div>
  </aside>
  {drawer?<button className="se-backdrop" aria-label="إغلاق القائمة" onClick={()=>setDrawer(false)}/>:null}
  <div className="se-main">
   <header className="se-topbar">
    <div className="se-top-start"><button className="se-menu-toggle" onClick={()=>setDrawer(true)} aria-label="فتح القائمة">☰</button><div className="se-breadcrumb"><small>مساحة الطالب</small><b>{({home:"الرئيسية",courses:"الكورسات",lessons:"المحاضرات",exams:"الامتحانات",homework:"الواجبات",files:"المذكرات والملفات",results:"النتائج",schedule:"جدول الحصص",live:"المحاضرات المباشرة",groups:"الجروبات الدراسية",ai:"المساعد الذكي",messages:"الدعم الفني",subscriptions:"الاشتراكات",notifications:"الإشعارات",profile:"الملف الشخصي",settings:"الإعدادات",admin:"لوحة الإدارة"})[page]||"المنصة"}</b></div></div>
    <div className="se-top-actions"><span className="se-grade-chip">{grade||"لم يحدد الصف"}</span><button className="se-notify" onClick={()=>go("notifications")} aria-label="الإشعارات">♧{unread>0?<i>{unread>99?"99+":unread}</i>:null}</button><div className="se-account-wrap"><button className="se-account" onClick={()=>setAccount(v=>!v)}><span className="se-avatar small">{profile?.avatar_url?<img src={profile.avatar_url} alt=""/>:"ط"}</span><span><b>{profile?.full_name||"الطالب"}</b><small>حسابي</small></span><span>⌄</span></button>{account?<div className="se-account-menu"><button onClick={()=>{go("profile");setAccount(false)}}>الملف الشخصي</button><button onClick={()=>{go("settings");setAccount(false)}}>إعدادات الحساب</button><button onClick={()=>{logout();setAccount(false)}}>تسجيل الخروج</button></div>:null}</div></div>
   </header>
   <div className="se-content">{children}</div>
   <footer className="se-footer"><span>مستر عماد السنافيري</span><span>التعليم يبدأ بالفهم</span><span>© 2026</span></footer>
  </div>
 </div>;
}