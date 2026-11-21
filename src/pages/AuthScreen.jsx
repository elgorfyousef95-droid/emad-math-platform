import React, { useState } from "react";
import { notify } from "../components/MessageProvider.jsx";

function Icon({ name }) {
  const common = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    id: <><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M6.5 16c.7-1.5 4.3-1.5 5 0M14.5 10h3M14.5 14h3"/></>,
    lock: <><rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    eye: <><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.7-4 3.2-6 7.5-6s6.8 2 7.5 6"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    shield: <><path d="M12 3 19 6v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"/><path d="M4 5v16M8 7h8M8 11h7"/></>
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const stepTitles = ["البيانات الشخصية", "البيانات الدراسية", "بيانات ولي الأمر", "مراجعة البيانات"];

export default function AuthScreen({ mode, onModeChange }) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");\n  const showNotice = message => { setNotice(message); if (message) notify({ type: "warning", title: "راجع البيانات", message }); };
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ fullName:"", phone:"", grade:"", group:"", parentName:"", parentPhone:"" });
  const signup = mode === "signup";
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const nextStep = () => {
    if (step === 0 && (!form.fullName.trim() || !form.phone.trim())) return showNotice("اكتب الاسم بالكامل ورقم الهاتف للمتابعة.");
    if (step === 1 && (!form.grade || !form.group.trim())) return showNotice("اختر الصف الدراسي واكتب المجموعة.");
    if (step === 2 && (!form.parentName.trim() || !form.parentPhone.trim())) return showNotice("أكمل بيانات ولي الأمر للمتابعة.");
    setNotice("");
    setStep(current => Math.min(3, current + 1));
  };

  const Field = ({ label, value, onChange, placeholder, type = "text", inputMode }) => (
    <label className="signup-field"><span>{label}</span><input type={type} inputMode={inputMode} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></label>
  );

  return (
    <main className={`auth-screen auth-screen-${mode}`}>
      <div className="auth-screen-bg" />
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <section className={`auth-card ${signup ? "auth-card-signup" : "auth-card-login"}`}>
        <div className="auth-card-topline" />
        <header className="auth-card-brand">
          <div className="auth-brand-copy auth-brand-copy-primary"><b>مستر عماد السنافيري</b><span>منصة الرياضيات التعليمية</span></div>
          <div className="auth-trust"><Icon name="shield"/><span>بيئة تعليمية<br/>موثوقة ومنظمة</span></div>
        </header>
        <div className="auth-card-rule"><span /></div>
        <div className="auth-form-heading">
          <span className="auth-kicker"><Icon name="spark"/>{signup ? "ابدأ رحلتك التعليمية" : "مرحباً بعودتك إلى المنصة"}</span>
          <h1>{signup ? "أنشئ حسابك الطلابي" : "سجّل دخولك"}</h1>
          <p>{signup ? "أكمل بياناتك على خطوات واضحة ومنظمة." : "أدخل رقم الطالب وكلمة المرور للوصول إلى حسابك."}</p>
        </div>
        {signup ? (
          <div className="auth-signup-content">
            <div className="signup-progress-head"><span>{stepTitles[step]}</span><small>الخطوة {step + 1} من 4</small></div>
            <div className="signup-progress-track"><span style={{ width: `${(step + 1) * 25}%` }} /></div>
            <div className="signup-step-tabs">{stepTitles.map((title, index) => <div key={title} className={index === step ? "signup-step-tab active" : index < step ? "signup-step-tab done" : "signup-step-tab"}><i>{index < step ? "✓" : index + 1}</i><span>{title}</span></div>)}</div>
            {step === 0 && <div className="signup-fields"><Field label="الاسم بالكامل" value={form.fullName} onChange={v=>update("fullName",v)} placeholder="اكتب الاسم رباعي"/><Field label="رقم الهاتف" value={form.phone} onChange={v=>update("phone",v)} placeholder="01xxxxxxxxx" inputMode="tel"/></div>}
            {step === 1 && <div className="signup-fields"><label className="signup-field"><span>الصف الدراسي</span><select value={form.grade} onChange={e=>update("grade",e.target.value)}><option value="">اختر الصف الدراسي</option><option>الصف الأول الثانوي</option><option>الصف الثاني الثانوي</option><option>الصف الثالث الثانوي</option></select></label><Field label="المجموعة أو ميعاد الحصة" value={form.group} onChange={v=>update("group",v)} placeholder="اكتب المجموعة أو الميعاد"/></div>}
            {step === 2 && <div className="signup-fields"><Field label="اسم ولي الأمر" value={form.parentName} onChange={v=>update("parentName",v)} placeholder="اسم ولي الأمر بالكامل"/><Field label="رقم هاتف ولي الأمر" value={form.parentPhone} onChange={v=>update("parentPhone",v)} placeholder="01xxxxxxxxx" inputMode="tel"/></div>}
            {step === 3 && <div className="signup-review"><div><span>اسم الطالب</span><b>{form.fullName}</b></div><div><span>رقم الهاتف</span><b>{form.phone}</b></div><div><span>الصف الدراسي</span><b>{form.grade}</b></div><div><span>المجموعة</span><b>{form.group}</b></div><div><span>ولي الأمر</span><b>{form.parentName}</b></div><div><span>هاتف ولي الأمر</span><b>{form.parentPhone}</b></div><p>راجع البيانات قبل الإرسال. إنشاء الحساب الفعلي يحتاج إلى استكمال ربط قاعدة البيانات.</p></div>}
            
            <div className="signup-actions">{step > 0 && <button className="signup-back" type="button" onClick={()=>{setNotice("");setStep(v=>v-1)}}>السابق</button>}<button className="gold full auth-submit" type="button" onClick={()=>step < 3 ? nextStep() : notify({type:"info",title:"مراجعة التسجيل",message:"تمت مراجعة البيانات محلياً. التسجيل الفعلي لم يُفعّل بعد لعدم اكتمال ربط قاعدة البيانات."})}>{step === 3 ? "مراجعة وإرسال الطلب" : "متابعة إلى الخطوة التالية"} <Icon name="arrow"/></button></div>
            <div className="auth-switch-row">لديك حساب بالفعل؟ <button type="button" onClick={() => onModeChange("login")}>تسجيل الدخول</button></div>
          </div>
        ) : (
          <>
            <div className="auth-fields">
              <label htmlFor="student-id"><span className="auth-label-icon"><Icon name="id"/></span>رقم الطالب (ID)</label>
              <div className="auth-input-wrap"><input id="student-id" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="اكتب رقم الطالب الخاص بك" autoComplete="username" /></div>
              <label htmlFor="student-password"><span className="auth-label-icon"><Icon name="lock"/></span>كلمة المرور</label>
              <div className="auth-input-wrap password-field"><input id="student-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="اكتب كلمة المرور" autoComplete="current-password" /><button className="password-toggle" type="button" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setShowPassword(v => !v)}><Icon name="eye"/></button></div>
            </div>
            <button className="auth-forgot" type="button" onClick={() => notify({type:"info",title:"استعادة بيانات الدخول",message:"لاستعادة رقم الطالب أو كلمة المرور، تواصل مع إدارة المنصة من خلال خدمة العملاء."})}>نسيت رقم الطالب أو كلمة المرور؟</button>
            <button className="gold full auth-submit" type="button" onClick={() => notify({type:"info",title:"تسجيل الدخول",message:"تسجيل الدخول الفعلي لم يُفعّل بعد، لأنه يحتاج إلى استكمال ربط قاعدة البيانات."})}>دخول إلى حسابي <Icon name="arrow"/></button>
            
            <div className="auth-switch-row">ليس لديك حساب؟ <button type="button" onClick={() => onModeChange("signup")}>إنشاء حساب جديد</button></div>
            <div className="auth-secure-foot"><Icon name="shield"/><span>دخول مخصص لطلاب منصة مستر عماد السنافيري</span></div>
          </>
        )}
      </section>
      <footer className="auth-footer"><span>مستر عماد السنافيري</span><i/><span>خطوتك القادمة تبدأ من هنا</span></footer>
    </main>
  );
}
