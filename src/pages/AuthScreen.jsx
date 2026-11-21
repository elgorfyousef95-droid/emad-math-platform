import React, { useState } from "react";

function Icon({ name }) {
  const common = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    id: <><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M6.5 16c.7-1.5 4.3-1.5 5 0M14.5 10h3M14.5 14h3"/></>,
    lock: <><rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    eye: <><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.7-4 3.2-6 7.5-6s6.8 2 7.5 6"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    shield: <><path d="M12 3 19 6v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"/><path d="M4 5v16M8 7h8M8 11h7"/></>
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const steps = [
  ["01", "البيانات الشخصية"],
  ["02", "البيانات الدراسية"],
  ["03", "بيانات ولي الأمر"],
  ["04", "الصورة والمراجعة"]
];

export default function AuthScreen({ mode, onModeChange }) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const signup = mode === "signup";

  return (
    <main className={`auth-screen auth-screen-${mode}`}>
      <div className="auth-screen-bg" />
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <section className="auth-card">
        <div className="auth-card-topline" />
        <header className="auth-card-brand">
          <div className="auth-monogram"><span>EM</span><i /></div>
          <div className="auth-brand-copy">
            <b>مستر عماد السنافيري</b>
            <span>منصة الرياضيات التعليمية</span>
          </div>
          <div className="auth-trust"><Icon name="shield"/><span>بيئة تعليمية<br/>موثوقة ومنظمة</span></div>
        </header>

        <div className="auth-card-rule"><span /></div>

        <div className="auth-form-heading">
          <span className="auth-kicker"><Icon name="spark"/>{signup ? "ابدأ رحلتك التعليمية" : "مرحباً بعودتك إلى المنصة"}</span>
          <h1>{signup ? "أنشئ حسابك الطلابي" : "سجّل دخولك"}</h1>
          <p>{signup ? "خطوات بسيطة تفصلك عن مساحتك التعليمية الخاصة." : "كل دروسك ومتابعتك التعليمية في مكان واحد. أدخل بيانات حسابك للمتابعة."}</p>
        </div>

        {signup ? (
          <div className="auth-signup-content">
            <div className="signup-intro-card">
              <div className="signup-intro-icon"><Icon name="book"/></div>
              <div><b>حساب واحد… ورحلة تعليمية متكاملة</b><p>جهّز بياناتك، وسنرشدك خلال خطوات إنشاء ملفك الطلابي.</p></div>
            </div>
            <div className="signup-progress-head"><span>مراحل إنشاء الحساب</span><small>4 خطوات منظمة</small></div>
            <div className="signup-preview-steps">
              {steps.map(([number, label], index) => (
                <div className={index === 0 ? "signup-step current" : "signup-step"} key={number}>
                  <span className="signup-step-number">{number}</span>
                  <span className="signup-step-label">{label}</span>
                  {index === 0 && <i className="signup-step-dot"/>}
                </div>
              ))}
            </div>
            <div className="signup-note"><Icon name="shield"/><span>بياناتك تُستخدم لإعداد حسابك ومتابعتك داخل المنصة.</span></div>
            <button className="gold full auth-submit" type="button" onClick={() => setNotice("سيتم تفعيل نموذج التسجيل متعدد الخطوات عند استكمال ربط قاعدة البيانات.")}>ابدأ إنشاء الحساب <Icon name="arrow"/></button>
            {notice && <div className="auth-notice" role="status">{notice}</div>}
            <div className="auth-switch-row">لديك حساب بالفعل؟ <button type="button" onClick={() => onModeChange("login")}>تسجيل الدخول</button></div>
          </div>
        ) : (
          <>
            <div className="auth-fields">
              <label htmlFor="student-id"><span className="auth-label-icon"><Icon name="id"/></span>رقم الطالب (ID)</label>
              <div className="auth-input-wrap"><input id="student-id" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="اكتب رقم الطالب الخاص بك" autoComplete="username" /></div>

              <label htmlFor="student-password"><span className="auth-label-icon"><Icon name="lock"/></span>كلمة المرور</label>
              <div className="auth-input-wrap password-field">
                <input id="student-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="اكتب كلمة المرور" autoComplete="current-password" />
                <button className="password-toggle" type="button" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setShowPassword(v => !v)}><Icon name="eye"/></button>
              </div>
            </div>
            <button className="auth-forgot" type="button" onClick={() => setNotice("لاستعادة رقم الطالب أو كلمة المرور، تواصل مع إدارة المنصة من خلال خدمة العملاء.")}>نسيت رقم الطالب أو كلمة المرور؟</button>
            <button className="gold full auth-submit" type="button" onClick={() => setNotice("سيتم تفعيل تسجيل الدخول والتحقق من الحساب بعد استكمال ربط قاعدة البيانات.")}>دخول إلى حسابي <Icon name="arrow"/></button>
            {notice && <div className="auth-notice" role="status">{notice}</div>}
            <div className="auth-switch-row">ليس لديك حساب؟ <button type="button" onClick={() => onModeChange("signup")}>إنشاء حساب جديد</button></div>
            <div className="auth-secure-foot"><Icon name="shield"/><span>دخول مخصص لطلاب منصة مستر عماد السنافيري</span></div>
          </>
        )}
      </section>
      <footer className="auth-footer"><span>مستر عماد السنافيري</span><i/> <span>خطوتك القادمة تبدأ من هنا</span></footer>
    </main>
  );
}
