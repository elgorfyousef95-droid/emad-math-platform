import React,{useEffect,useState} from "react";
import {studentApi,uploadStudentAvatar} from "../lib/auth.js";

export default function ProfilePage({profile,subscription,notifications=[],grade,go,loading,onProfileUpdated}){
 const [editing,setEditing]=useState(false),[name,setName]=useState(profile?.full_name||""),[phone,setPhone]=useState(profile?.phone||""),[city,setCity]=useState(profile?.city||""),[governorate,setGovernorate]=useState(profile?.governorate||""),[busy,setBusy]=useState(false),[avatarBusy,setAvatarBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 useEffect(()=>{setName(profile?.full_name||"");setPhone(profile?.phone||"");setCity(profile?.city||"");setGovernorate(profile?.governorate||"");},[profile?.id,profile?.full_name,profile?.phone,profile?.city,profile?.governorate]);
 const active=!!subscription&&new Date(subscription.ends_at)>new Date(),unread=notifications.filter(n=>!n.read_at).length;
 const expiry=subscription?.ends_at?new Date(subscription.ends_at).toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}):"لا يوجد اشتراك نشط";
 const joined=profile?.created_at?new Date(profile.created_at).toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}):"—";
 const initials=(profile?.full_name||"ط").trim().slice(0,1);
 const save=async()=>{
  if(name.trim().length<3){setError("الاسم لازم يكون 3 أحرف على الأقل.");return;}
  if(phone.trim()&&!/^[+0-9٠-٩\s()-]{7,20}$/.test(phone.trim())){setError("راجع رقم الهاتف واكتبه بشكل صحيح.");return;}
  setBusy(true);setError("");setNotice("");
  try{const patch={full_name:name.trim(),phone:phone.trim()||null,city:city.trim()||null,governorate:governorate.trim()||null};await studentApi("profiles?id=eq."+encodeURIComponent(profile.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(patch)});onProfileUpdated?.({...profile,...patch});setEditing(false);setNotice("تم تحديث بيانات حسابك بنجاح.");}
  catch(e){setError("لم نتمكن من حفظ البيانات. تأكد من الاتصال وحاول مرة أخرى.");}
  finally{setBusy(false);}
 };
 const avatar=async file=>{
  if(!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setError("اختار صورة JPG أو PNG أو WEBP.");return;}
  if(file.size>3*1024*1024){setError("حجم الصورة يجب ألا يتجاوز 3 ميجابايت.");return;}
  setAvatarBusy(true);setError("");setNotice("");
  try{const url=await uploadStudentAvatar(file);await studentApi("profiles?id=eq."+encodeURIComponent(profile.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({avatar_url:url})});onProfileUpdated?.({...profile,avatar_url:url});setNotice("تم تحديث صورتك الشخصية.");}
  catch(e){setError("تعذر رفع الصورة. جرّب صورة أصغر بصيغة JPG أو PNG أو WEBP.");}
  finally{setAvatarBusy(false);}
 };
 return <div className="platform-page profile-vip profile-premium-page">
  <header className="profile-vip-hero profile-premium-hero">
   <div className="profile-hero-copy"><span className="profile-vip-kicker">EMAD ACADEMY · STUDENT IDENTITY</span><h1>ملفي الشخصي</h1><p>كل بياناتك التعليمية وعضويتك في مكان واحد، بتصميم واضح وسهل التحكم.</p><div className="profile-hero-actions"><button className="profile-primary-action" onClick={()=>{setEditing(v=>!v);setError("");setNotice("");}}>{editing?"إلغاء التعديل":"تعديل بيانات الحساب"} <span>✦</span></button><button className="profile-secondary-action" onClick={()=>go("subscriptions")}>إدارة الاشتراك ←</button></div></div>
   <div className="profile-hero-emblem"><span>EA</span><small>STUDENT<br/>PORTAL</small></div>
  </header>
  <section className="profile-vip-card profile-premium-card">
   <div className="profile-vip-cover profile-premium-cover"><span>STUDENT ACCOUNT</span><b>{active?"ACTIVE MEMBERSHIP":"ACADEMY MEMBER"}</b></div>
   <div className="profile-vip-identity profile-premium-identity">
    <label className="profile-vip-avatar profile-premium-avatar">{profile?.avatar_url?<img src={profile.avatar_url} alt="صورة الطالب"/>:<span>{initials}</span>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{avatar(e.target.files?.[0]);e.target.value="";}}/><i>{avatarBusy?"جارٍ الرفع":"تغيير الصورة"}</i></label>
    <div className="profile-vip-name"><small>أهلاً بعودتك</small><h2>{loading?"جارٍ تحميل البيانات...":profile?.full_name||"الطالب"}</h2><span>{grade||"الصف الدراسي غير محدد"}{profile?.group_name?" · "+profile.group_name:""}</span></div>
    <div className={active?"profile-vip-status active":"profile-vip-status"}><i/>{active?"عضوية مفعلة":"العضوية غير مفعلة"}</div>
   </div>
   {error&&<p className="profile-vip-error profile-feedback error">{error}</p>}{notice&&<p className="profile-feedback success">{notice}</p>}
   {editing?<div className="profile-vip-edit profile-premium-edit">
    <div className="profile-edit-heading"><div><span>PERSONAL INFORMATION</span><h3>تعديل البيانات الشخصية</h3></div><small>بياناتك الأساسية لا تغيّر الصف أو رقم الطالب.</small></div>
    <label>الاسم بالكامل<input value={name} onChange={e=>setName(e.target.value)} maxLength={120} placeholder="اكتب اسمك بالكامل"/></label>
    <label>رقم الهاتف<input value={phone} onChange={e=>setPhone(e.target.value)} inputMode="tel" maxLength={20} placeholder="01xxxxxxxxx"/></label>
    <label>المحافظة<input value={governorate} onChange={e=>setGovernorate(e.target.value)} maxLength={80} placeholder="المحافظة"/></label>
    <label>المدينة أو المركز<input value={city} onChange={e=>setCity(e.target.value)} maxLength={80} placeholder="المدينة أو المركز"/></label>
    <button disabled={busy||avatarBusy} onClick={save}>{busy?"جارٍ حفظ البيانات...":"حفظ التعديلات ✓"}</button>
   </div>:<div className="profile-vip-facts profile-premium-facts">
    <article><small>رقم الطالب</small><b>{profile?.student_number||"—"}</b><span>معرّف حسابك</span></article>
    <article><small>الصف الدراسي</small><b>{grade||"غير محدد"}</b><span>المسار التعليمي</span></article>
    <article><small>المجموعة</small><b>{profile?.group_name||"غير محددة"}</b><span>المجموعة المسجل بها</span></article>
    <article><small>رقم الهاتف</small><b dir="ltr">{profile?.phone||"غير مضاف"}</b><span>وسيلة التواصل</span></article>
    <article><small>المحافظة والمدينة</small><b>{[profile?.governorate,profile?.city].filter(Boolean).join(" · ")||"غير مضافتين"}</b><span>بيانات الموقع</span></article>
    <article><small>تاريخ إنشاء الحساب</small><b>{joined}</b><span>عضو في الأكاديمية منذ</span></article>
   </div>}
  </section>
  <section className="profile-vip-metrics profile-premium-metrics">
   <article><span className="profile-metric-symbol">✦</span><small>حالة العضوية</small><b>{active?"نشطة":"غير مفعلة"}</b><span>{active?"الوصول للمحتوى متاح":"فعّل اشتراكك لفتح المحتوى"}</span></article>
   <article><span className="profile-metric-symbol">◉</span><small>تنبيهات جديدة</small><b>{unread}</b><span>إشعارات لم تقرأها بعد</span></article>
   <article><span className="profile-metric-symbol">⌁</span><small>تاريخ انتهاء الاشتراك</small><b>{expiry}</b><span>{active?"تابع صلاحية عضويتك":"لا توجد عضوية حالية"}</span></article>
  </section>
  <section className="profile-vip-shortcuts profile-premium-shortcuts"><div><span>YOUR LEARNING SPACE</span><h2>مساحتك التعليمية</h2><p>انتقل مباشرة إلى الخدمات المرتبطة بحسابك.</p></div><div>{[["courses","الكورسات"],["lessons","المحاضرات"],["results","نتائجي"],["subscriptions","الاشتراكات"],["notifications","الإشعارات"],["settings","الإعدادات"]].map(([id,label],i)=><button key={id} onClick={()=>go(id)}><i>{["01","02","03","04","05","06"][i]}</i>{label}<b>←</b></button>)}</div></section>
 </div>;
}
