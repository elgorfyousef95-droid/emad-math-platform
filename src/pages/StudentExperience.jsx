import React, { useEffect, useRef, useState } from "react";
import "./StudentExperience.css";
import "./StudentExperiencePremium.css";

const primary = [
 ["home","الرئيسية","home"],["courses","الكورسات","book"],["lessons","المحاضرات","play"],["exams","الامتحانات","exam"],["homework","الواجبات","task"],["files","المذكرات والملفات","file"],["results","النتائج","chart"]
];
const secondary = [
 ["schedule","جدول الحصص","calendar"],["live","المحاضرات المباشرة","live"],["groups","الجروبات الدراسية","users"],["ai","المساعد الذكي","spark"],["messages","الدعم الفني","support"]
];
function SEIcon({name}){const paths={home:<><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,book:<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20M8 7h8"/></>,play:<><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="m10 8 6 4-6 4z"/></>,exam:<><path d="M7 3h8l4 4v14H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/><path d="M15 3v5h5M8 12h7M8 16h7"/></>,task:<><path d="m5 12 4 4L19 6"/><path d="M20 12v7H4V5h11"/></>,file:<><path d="M5 3h9l5 5v13H5z"/><path d="M14 3v6h5M8 13h8M8 17h8"/></>,chart:<><path d="M4 20V4M4 20h17"/><path d="m7 15 4-4 3 2 6-7"/></>,calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,live:<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></>,users:<><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,spark:<><path d="m12 2 2.2 6.2L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.8z"/></>,support:<><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H6a2 2 0 0 1-2-2zM20 13h-3v6h1a2 2 0 0 0 2-2z"/></>,ticket:<><path d="M4 7a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4h16v-4a2 2 0 0 1 0-4V5H4z"/></>,bell:<><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,user:<><circle cx="12" cy="8" r="3.5"/><path d="M4 21a8 8 0 0 1 16 0"/></>,settings:<><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2Z"/></>,arrow:<><path d="M5 12h14M13 6l6 6-6 6"/></>,logout:<><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>};return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.spark}</svg>;}
export default function StudentExperience({page,profile,grade,unread,go,logout,children,supportEnabled=true}){
 const [drawer,setDrawer]=useState(false),[account,setAccount]=useState(false);
 const contentRef=useRef(null);
 useEffect(()=>{setDrawer(false);setAccount(false);contentRef.current?.scrollTo({top:0,behavior:"auto"});window.scrollTo({top:0,behavior:"auto"});},[page]);
 const item=(entry)=>{const [id,label,glyph]=entry;return <button key={id} className={page===id?"se-nav-item active":"se-nav-item"} onClick={()=>{go(id);setDrawer(false)}}><span className="se-nav-glyph"><SEIcon name={glyph}/></span><span>{label}</span>{id==="notifications"&&unread>0?<i>{unread>99?"99+":unread}</i>:null}</button>};
 return <div className="student-experience" dir="rtl">
  <aside className={drawer?"se-sidebar open":"se-sidebar"} aria-label="القائمة الرئيسية">
   <div className="se-brand"><div className="se-brand-mark">م</div><div><b>عماد السنافيري</b><small>أكاديمية الرياضيات</small></div><button className="se-close-drawer" onClick={()=>setDrawer(false)} aria-label="إغلاق القائمة">×</button></div>
   <div className="se-sidebar-student"><span className="se-avatar">{profile?.avatar_url?<img src={profile.avatar_url} alt=""/>:"ط"}</span><div><b>{profile?.full_name||"حساب الطالب"}</b><small>{grade||"الصف الدراسي"}</small></div><span className="se-online-dot"/></div>
   <div className="se-nav-caption">مساحتك التعليمية</div>
   <nav className="se-nav">{primary.map(item)}</nav>
   <div className="se-nav-caption">خدمات المنصة</div>
   <nav className="se-nav">{secondary.filter(([id])=>id!=="messages"||supportEnabled).map(item)}</nav>
   <div className="se-nav-caption">حسابك</div>
   <nav className="se-nav">{item(["subscriptions","الاشتراك","ticket"])}{item(["notifications","الإشعارات","bell"])}{item(["profile","ملفي الشخصي","user"])}{item(["settings","الإعدادات","settings"])}</nav>
   {profile?.role==="admin"?<><div className="se-nav-caption">الإدارة</div><nav className="se-nav">{item(["admin","لوحة الإدارة","settings"])}</nav></>:null}
   {supportEnabled?<div className="se-sidebar-foot"><div className="se-help-icon">?</div><div><b>محتاج مساعدة؟</b><small>فريق الدعم معاك</small></div><button onClick={()=>go("messages")}>←</button></div>:null}
  </aside>
  {drawer?<button className="se-backdrop" aria-label="إغلاق القائمة" onClick={()=>setDrawer(false)}/>:null}
  <div className="se-main">
   <header className="se-topbar">
    <div className="se-top-start"><button className="se-menu-toggle" onClick={()=>setDrawer(v=>!v)} aria-label="فتح أو إغلاق القائمة" aria-expanded={drawer}><span/><span/><span/></button><div className="se-breadcrumb"><small>مساحة الطالب</small><b>{({home:"الرئيسية",courses:"الكورسات",lessons:"المحاضرات",exams:"الامتحانات",homework:"الواجبات",files:"المذكرات والملفات",results:"النتائج",schedule:"جدول الحصص",live:"المحاضرات المباشرة",groups:"الجروبات الدراسية",ai:"المساعد الذكي",messages:"الدعم الفني",subscriptions:"الاشتراكات",notifications:"الإشعارات",profile:"الملف الشخصي",settings:"الإعدادات",admin:"لوحة الإدارة"})[page]||"المنصة"}</b></div></div>
    <div className="se-top-actions"><span className="se-grade-chip">{grade||"لم يحدد الصف"}</span><button className="se-notify" onClick={()=>go("notifications")} aria-label="الإشعارات"><SEIcon name="bell"/>{unread>0?<i>{unread>99?"99+":unread}</i>:null}</button><div className="se-account-wrap"><button className="se-account" onClick={()=>setAccount(v=>!v)}><span className="se-avatar small">{profile?.avatar_url?<img src={profile.avatar_url} alt=""/>:"ط"}</span><span><b>{profile?.full_name||"الطالب"}</b><small>حسابي</small></span><span className="se-account-chevron">⌄</span></button>{account?<div className="se-account-menu"><button onClick={()=>{go("profile");setAccount(false)}}>الملف الشخصي</button><button onClick={()=>{go("settings");setAccount(false)}}>إعدادات الحساب</button><button onClick={()=>{logout();setAccount(false)}}>تسجيل الخروج</button></div>:null}</div></div>
   </header>
   <div className="se-content" ref={contentRef} key={page}>{children}</div>
   <footer className="se-footer"><span>مستر عماد السنافيري</span><span>التعليم يبدأ بالفهم</span><span>© 2026</span></footer>
  </div>
 </div>;
}