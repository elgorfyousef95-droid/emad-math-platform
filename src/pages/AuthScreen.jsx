import React, { useState } from "react";

export default function AuthScreen({ mode, onModeChange }) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="auth-screen">
      <div className="auth-screen-bg" />
      <section className="auth-layout">
        <div className="auth-brand-panel">
          <div className="auth-brand-mark">∑</div>
          <span>منصة مستر عماد السنافيري</span>
          <h1>{mode === "login" ? "أهلاً بعودتك" : "ابدأ رحلتك التعليمية"}</h1>
          <p>{mode === "login" ? "سجّل دخولك وتابع دراستك من حيث توقفت." : "أنشئ حسابك الطلابي بخطوات واضحة ومنظمة."}</p>
        </div>
        <div className="auth-form-panel">
          <div className="auth-form-heading">
            <span className="kicker">بوابتك التعليمية</span>
            <h2>{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}</h2>
            <p>{mode === "login" ? "اكتب رقم الطالب وكلمة المرور للمتابعة." : "سيتم تقسيم إنشاء الحساب إلى خطوات، مع مراجعة بياناتك قبل الحفظ."}</p>
          </div>
          {mode === "login" ? (
            <>
              <label htmlFor="student-id">رقم الطالب ID</label>
              <input id="student-id" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="اكتب رقم الطالب" autoComplete="username" />
              <label htmlFor="student-password">كلمة المرور</label>
              <div className="password-field">
                <input id="student-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="اكتب كلمة المرور" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(v => !v)}>{showPassword ? "إخفاء" : "إظهار"}</button>
              </div>
              <button className="auth-forgot" type="button" onClick={() => setNotice("استعادة الحساب ستكون من خلال التواصل مع إدارة المنصة مباشرة، دون رسائل SMS أو بريد إلكتروني.")}>نسيت رقم ID أو كلمة المرور؟</button>
              <button className="gold full" type="button" onClick={() => setNotice("سيتم تفعيل تسجيل الدخول والتحقق من بيانات الحساب عند ربط هذه الصفحة بقاعدة البيانات.")}>تسجيل الدخول</button>
              {notice && <div className="auth-notice" role="status">{notice}</div>}
              <div className="auth-switch-row">ليس لديك حساب؟ <button type="button" onClick={() => onModeChange("signup")}>إنشاء حساب جديد</button></div>
            </>
          ) : (
            <>
              <div className="signup-intro-card"><b>إنشاء حساب الطالب</b><p>التسجيل سيكون على مراحل مستقلة، وسيُنشأ رقم ID فريد بعد حفظ البيانات والتحقق منها داخل النظام.</p></div>
              <div className="signup-preview-steps"><span className="current">١. بيانات الطالب</span><span>٢. البيانات الدراسية</span><span>٣. ولي الأمر</span><span>٤. الصورة والمراجعة</span></div>
              <button className="gold full" type="button" onClick={() => setNotice("هنبدأ نموذج التسجيل متعدد الخطوات وربطه بقاعدة البيانات في المرحلة التالية.")}>ابدأ إنشاء الحساب</button>
              {notice && <div className="auth-notice" role="status">{notice}</div>}
              <div className="auth-switch-row">لديك حساب بالفعل؟ <button type="button" onClick={() => onModeChange("login")}>تسجيل الدخول</button></div>
            </>
          )}
        </div>
      </section>
      <div className="auth-footer">جميع الحقوق محفوظة © منصة مستر عماد السنافيري</div>
    </main>
  );
}
