import React, { useState } from "react";

function Icon({ name }) {
  const common = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    id: <><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M6.5 16c.7-1.5 4.3-1.5 5 0M14.5 10h3M14.5 14h3"/></>,
    lock: <><rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    eye: <><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.7-4 3.2-6 7.5-6s6.8 2 7.5 6"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    shield: <><path d="M12 3 19 6v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></>
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export default function AuthScreen({ mode, onModeChange }) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const signup = mode === "signup";

  return (
    <main className={`auth-screen auth-screen-${mode}`}>
      <div className="auth-screen-bg" />
      <div className="auth-ambient auth-ambient-a" /><div className="auth-ambient auth-ambient-b" />
      <section className="auth-card">
        <header className="auth-card-brand">
          <div className="auth-monogram">EM</div>
          <div className="auth-brand-copy"><b>مستر عماد السنافيري</b><span>منصة الرياضيات التعليمية</span></div>
          <div className="auth-trust"><Icon name="shield" /><span>بيئة تعليمية<br/>منظمة وآمنة</span></div>
        </header>
        <div className="auth-card-rule" />
        <div className="auth-form-heading">
          <span className="kicker">{signup ? "انضم إلى مجتمع المنصة" : "مرحباً بعودتك"}</span>
          <h1>{signup ? "أنشئ حسابك الآن" : "سجّل دخولك"}</h1>
          <p>{signup ? "ابدأ خطوات التسجيل لتجهيز حسابك الطلابي." : "سجّل باستخدام رقم الطالب وكلمة المرور لمتابعة رحلتك التعليمية."}</p>
        </div>
        {signup ? (
          <>
            <div className="signup-intro-card"><div className="signup-intro-icon"><Icon name="user"/></div><div><b>حسابك الطلابي يبدأ من هنا</b><p>بياناتك هتتسجل في خطوات واضحة، وبعد المراجعة هيكون ليك رقم طالب خاص.</p></div></div>
            <div className="signup-preview-steps"><span className="current"><b>01</b> البيانات الشخصية</span><span><b>02</b> البيانات الدراسية</span><span><b>03</b> بيانات ولي الأمر</span><span><b>04</b> الصورة والمراجعة</span></div>
            <button className="gold full auth-submit" type="button" onClick={() => setNotice("سيتم تفعيل نموذج التسجيل متعدد الخطوات عند ربط قاعدة البيانات.")}>ابدأ إنشاء الحساب <Icon name="arrow"/></button>
            {notice && <div className="auth-notice" role="status">{notice}</div>}
            <div className="auth-switch-row">لديك حساب بالفعل؟ <button type="button" onClick={() => onModeChange("login")}>تسجيل الدخول</button></div>
          </>
        ) : (
          <>
            <label htmlFor="student-id"><Icon name="id"/> رقم الطالب (ID)</label>
            <div className="auth-input-wrap"><input id="student-id" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="اكتب رقم الطالب الخاص بك" autoComplete="username" /></div>
            <label htmlFor="student-password"><Icon name="lock"/> كلمة المرور</label>
            <div className="auth-input-wrap password-field"><input id="student-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="اكتب كلمة المرور" autoComplete="current-password" /><button className="password-toggle" type="button" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setShowPassword(v => !v)}><Icon name="eye"/></button></div>
            <button className="auth-forgot" type="button" onClick={() => setNotice("لاستعادة رقم الطالب أو كلمة المرور، تواصل مع إدارة المنصة من خلال خدمة العملاء.")}>نسيت رقم الطالب أو كلمة المرور؟</button>
            <button className="gold full auth-submit" type="button" onClick={() => setNotice("سيتم تفعيل تسجيل الدخول والتحقق من الحساب بعد ربط قاعدة البيانات.")}>دخول إلى حسابي <Icon name="arrow"/></button>
            {notice && <div className="auth-notice" role="status">{notice}</div>}
            <div className="auth-switch-row">ليس لديك حساب؟ <button type="button" onClick={() => onModeChange("signup")}>إنشاء حساب جديد</button></div>
          </>
        )}
      </section>
      <footer className="auth-footer"><span>مستر عماد السنافيري</span><span>خطوتك القادمة تبدأ من هنا</span></footer>
    </main>
  );
}
