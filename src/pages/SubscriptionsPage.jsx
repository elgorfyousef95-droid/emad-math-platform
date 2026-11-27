import React,{useMemo,useState} from "react";
import {redeemStudentSubscription} from "../lib/auth.js";
import {notify} from "../components/MessageProvider.jsx";
export default function SubscriptionsPage({subscription,onActivated}){
 const [code,setCode]=useState(""),[busy,setBusy]=useState(false);
 const start=subscription?.starts_at?new Date(subscription.starts_at):null,end=subscription?.ends_at?new Date(subscription.ends_at):null;
 const active=!!(end&&end.getTime()>Date.now()),days=end?Math.max(0,Math.ceil((end.getTime()-Date.now())/86400000)):0;
 const totalDays=start&&end?Math.max(1,Math.ceil((end-start)/86400000)):0;
 const elapsed=start?Math.max(0,Math.floor((Date.now()-start.getTime())/86400000)):0;
 const progress=active&&totalDays?Math.min(100,Math.max(0,elapsed/totalDays*100)):0;
 const date=d=>d?d.toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}):"—";
 const activate=async()=>{
  if(!code.trim())return notify({type:"warning",title:"كود الاشتراك مطلوب",message:"اكتب الكود الذي حصلت عليه من إدارة المنصة."});
  setBusy(true);
  try{await redeemStudentSubscription(code.trim());setCode("");await onActivated?.();notify({type:"success",title:"تم تفعيل الاشتراك",message:"تم تحديث عضويتك وفتح المحتوى المخصص لصفك."});}
  catch(e){const map={subscription_code_invalid_or_used:"الكود غير صحيح أو مستخدم بالفعل أو غير مخصص لصفك الدراسي.",not_authenticated:"انتهت جلسة الدخول. سجّل الدخول مرة أخرى.",student_profile_not_found:"تعذر العثور على بيانات الطالب."};notify({type:"error",title:"تعذر تفعيل الاشتراك",message:map[e.message]||"حدث خطأ أثناء التفعيل. راجع الكود وحاول مرة أخرى."});}
  finally{setBusy(false);}
 };
 return <div className="platform-page subscription-vip subscription-premium-page">
  <header className="subscription-vip-hero subscription-premium-hero"><div><span>EMAD ACADEMY · MEMBERSHIP SERVICES</span><h1>العضوية والاشتراكات</h1><p>تابع صلاحية حسابك، اعرف الخدمات المتاحة لك، وجدّد وصولك للمحتوى باستخدام كود الاشتراك الرسمي.</p></div><div className="subscription-hero-seal"><b>EA</b><small>ACADEMY<br/>MEMBERSHIP</small></div></header>
  <section className={"subscription-vip-status subscription-premium-status "+(active?"is-active":"is-inactive")}>
   <div className="subscription-status-main"><span className="subscription-vip-label">حالة عضويتك الحالية</span><b className={active?"active":"inactive"}>{active?"اشتراكك نشط":"لا يوجد اشتراك نشط"}</b><p>{active?"حسابك مؤهل للوصول إلى المحتوى المنشور والمخصص لصفك.":"فعّل كود الاشتراك الرسمي لفتح الكورسات والمحاضرات والخدمات التعليمية."}</p><div className="subscription-status-pill"><i/>{active?"ACTIVE MEMBER":"MEMBERSHIP NOT ACTIVE"}</div></div>
   <div className="subscription-vip-days"><strong>{active?days:"—"}</strong><small>{active?"يوم متبقٍ على الانتهاء":"الأيام المتبقية"}</small></div>
   <div className="subscription-premium-progress"><div><b>مدة العضوية</b><span>{active?Math.round(progress)+"% مستهلك":"بانتظار التفعيل"}</span></div><div className="subscription-progress-track"><i style={{width:progress+"%"}}/></div><div className="subscription-vip-dates"><article><small>تاريخ البداية</small><b>{date(start)}</b></article><article><small>تاريخ الانتهاء</small><b>{date(end)}</b></article><article><small>الصف المرتبط</small><b>{subscription?.grade||"حسب بيانات حسابك"}</b></article></div></div>
  </section>
  <div className="subscription-premium-grid">
   <section className="subscription-vip-activate subscription-premium-activate"><span>SECURE ACTIVATION</span><h2>تفعيل أو تجديد العضوية</h2><p>استخدم كودًا صادرًا من إدارة الأكاديمية. يتم التحقق منه وربطه بحسابك وصفك الدراسي داخل قاعدة البيانات.</p><label htmlFor="student-sub-code">كود الاشتراك الخاص بك</label><div className="subscription-code-field"><input id="student-sub-code" value={code} onChange={e=>setCode(e.target.value.replace(/[^A-Z0-9-]/gi,"").toUpperCase())} placeholder="EMAD-XXXX-XXXX" dir="ltr" autoComplete="off" maxLength={40}/><span>✦</span></div><button disabled={busy||!code.trim()} onClick={activate}>{busy?"جارٍ التحقق من الكود...":"تفعيل الاشتراك الآن"} <b>←</b></button><small>كل كود مخصص لصف دراسي، ويُستخدم مرة واحدة فقط.</small></section>
   <aside className="subscription-vip-benefits subscription-premium-benefits"><span>YOUR MEMBERSHIP INCLUDES</span><h2>ماذا تحصل عليه بعد التفعيل؟</h2>{[["01","الكورسات والمحاضرات","الوصول للمحتوى المنشور لصفك الدراسي"],["02","الواجبات والامتحانات","حل التدريبات والاختبارات المتاحة"],["03","المذكرات والملفات","فتح الملفات التعليمية المنشورة"],["04","النتائج والمتابعة","متابعة درجاتك وتقدمك الدراسي"]].map(([n,title,desc])=><article key={n}><i>{n}</i><div><b>{title}</b><small>{desc}</small></div><span>✓</span></article>)}<div className="subscription-payment-note">التفعيل في هذه الصفحة يتم بالكود الرسمي فقط. لا توجد عملية دفع إلكتروني أو خصم مالي من داخل الصفحة.</div></aside>
  </div>
  <section className="subscription-help-strip"><div><b>محتاج مساعدة في الاشتراك؟</b><small>لو الكود لا يعمل أو لا تعرف الكود المناسب لصفك، تواصل مع فريق الدعم.</small></div><button onClick={()=>notify({type:"info",title:"الدعم الفني",message:"افتح قسم الدعم الفني من قائمة المنصة لإرسال استفسارك."})}>تعرف على طريقة التواصل ←</button></section>
 </div>;
}
