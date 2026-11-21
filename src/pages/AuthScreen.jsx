import React, { useState } from "react";

export default function AuthScreen({ mode, onModeChange }) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="auth-screen">
      <div className="auth-screen-bg" />
      <section className="auth-card">
        <header className="auth-card-brand">
          <div className="auth-monogram">EM</div>
          <div className="auth-brand-copy">
            <b>مستر عماد السنافيري</b>
            <span>منصة الرياضيات التعليمية</span>
          </div>
        </header>
        <div className="auth-card-rule" />
        <div className="auth-form-heading">
          <span className="kicker">{mode === "login" ? "مرحباً بعودتك" : "انضم إلى المنصة"}</span>
          <h1>{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب طالب"}</h1>
          <p>{mode === "login" ? "اكتب رقم الطالب وكلمة المرور للوصول إلى حسابك ومتابعة دراستك." : "أنشئ حسابك بخطوات منظمة، وراجع بياناتك قبل اعتماد التسجيل."}</p>
        </div>
        {mode === "login" ? (
          <>
            <label htmlFor="student-id">رقم الطالب (ID)</label>
            <input id="student-id" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="أدخل رقم الطالب" autoComplete="username" />
            <label htmlFor="student-password">كلمة المرور</label>
            <div className="password-field">
              <input id="student-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="أدخل كلمة المرور" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(v => !v)}>{showPassword ? "إخفاء" : "إظهار"}</button>
            </div>
            <button className="auth-forgot" type="button" onClick={() => setNotice("لاستعادة رقم ID أو كلمة المرور، تواصل مع إدارة المنصة من خلال خدمة العملاء. لن نطلب منك رمزاً عبر الهاتف أو البريد الإلكتروني.")}>نسيت رقم ID أو كلمة المرور؟</button>
            <button className="gold full auth-submit" type="button" onClick={() => setNotice("تسجيل الدخول سيعمل بعد ربط الحسابات بقاعدة البيانات والتحقق من بيانات الطالب.")}>دخول إلى المنصة</button>
            {notice && <div className="auth-notice" role="status">{notice}</div>}
            <div className="auth-switch-row">ليس لديك حساب؟ <button type="button" onClick={() => onModeChange("signup")}>إنشاء حساب جديد</button></div>
          </>
        ) : (
          <>
            <div className="signup-intro-card"><b>حسابك الطلابي في خطوات بسيطة</b><p>سنطلب بياناتك الأساسية ثم بياناتك الدراسية وولي الأمر، وبعد المراجعة يُنشأ رقم ID خاص بك.</p></div>
            <div className="signup-preview-steps"><span className="current">١. بيانات الطالب</span><span>٢. البيانات الدراسية</span><span>٣. ولي الأمر</span><span>٤. الصورة والمراجعة</span></div>
            <button className="gold full auth-submit" type="button" onClick={() => setNotice("سيبدأ نموذج التسجيل متعدد الخطوات بعد تجهيز وربط قاعدة البيانات.")}>ابدأ إنشاء الحساب</button>
            {notice && <div className="auth-notice" role="status">{notice}</div>}
            <div className="auth-switch-row">لديك حساب بالفعل؟ <button type="button" onClick={() => onModeChange("login")}>تسجيل الدخول</button></div>
          </>
        )}
      </section>
      <footer className="auth-footer"><span>منصة مستر عماد السنافيري</span><span>جميع الحقوق محفوظة © 2026</span></footer>
    </main>
  );
}
