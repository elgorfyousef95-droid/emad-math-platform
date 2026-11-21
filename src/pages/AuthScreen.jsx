import React, { useEffect, useRef, useState } from "react";
import { notify } from "../components/MessageProvider.jsx";
import { createStudentAccount, loginStudent, saveStudentSession } from "../lib/auth.js";

function Icon({ name, size = 19 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    id: <><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M6.5 16c.7-1.5 4.3-1.5 5 0M14.5 10h3M14.5 14h3"/></>,
    lock: <><rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    eye: <><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.7-4 3.2-6 7.5-6s6.8 2 7.5 6"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    shield: <><path d="M12 3 19 6v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></>,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    verified: <><path d="m12 2 2.2 2 3-.1 1.1 2.8 2.6 1.5-.7 2.9.7 2.9-2.6 1.5-1.1 2.8-3-.1L12 20l-2.2-2-3 .1-1.1-2.8-2.6-1.5.7-2.9-.7-2.9 2.6-1.5 1.1-2.8 3 .1L12 2Z"/><path d="m8.5 11.8 2.2 2.2 4.8-4.8"/></>
  };
  return <svg {...common}>{paths[name] || paths.spark}</svg>;
}

const stepTitles = ["البيانات الشخصية", "البيانات الدراسية", "بيانات ولي الأمر", "تأمين الحساب", "مراجعة البيانات"];

function errorText(code) {
  const messages = {
    missing_supabase_configuration: "إعدادات الاتصال بقاعدة البيانات غير مكتملة.",
    invalid_signup_data: "راجع البيانات المطلوبة، وتأكد من الصورة ورقمَي الهاتف وكلمة المرور.",
    invalid_full_name: "اكتب الاسم بالكامل بشكل صحيح.",
    invalid_phone: "اكتب رقم هاتف مصري صحيح يبدأ بـ 010 أو 011 أو 012 أو 015.",
    invalid_grade: "اختر الصف الدراسي من القائمة.",
    missing_required_fields: "أكمل بيانات المجموعة وولي الأمر.",
    password_length: "كلمة المرور لازم تكون 8 أحرف على الأقل.",
    avatar_required: "اختار صورة شخصية للحساب قبل المتابعة.",
    invalid_avatar: "الصورة لازم تكون JPG أو PNG أو WEBP وبحجم لا يتجاوز 3 ميجابايت.",
    account_setup_failed: "حصلت مشكلة في تجهيز رقم الطالب. حاول مرة تانية.",
    account_create_failed: "تعذر إنشاء الحساب. تأكد إن رقم الهاتف لم يُستخدم من قبل، ثم حاول مرة أخرى.",
    avatar_upload_failed: "تعذر حفظ الصورة. جرّب صورة أصغر.",
    profile_save_failed: "الحساب اتجهز لكن حفظ البيانات لم يكتمل. تواصل مع خدمة العملاء.",
    account_created_login_again: "الحساب اتعمل، لكن تسجيل الدخول التلقائي لم يكتمل. احتفظ بالرقم وكلمة المرور وسجّل دخولك.",
    invalid_login: "رقم الطالب أو كلمة المرور غير صحيحة.",
    server_configuration_error: "إعدادات الخادم غير مكتملة. أبلغ إدارة المنصة."
  };
  return messages[code] || "حصل خطأ غير متوقع. حاول مرة أخرى بعد قليل.";
}

async function copyValue(value, label) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(String(value));
    } else {
      const field = document.createElement("textarea");
      field.value = String(value);
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    notify({ type: "success", title: "تم النسخ", message: `تم نسخ ${label} بنجاح.` });
  } catch {
    notify({ type: "error", title: "تعذر النسخ", message: "حدد البيانات وانسخها يدويًا." });
  }
}

export default function AuthScreen({ mode, onModeChange, onSuccess }) {
  const scrollRef = useRef(null);
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(0);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [signupBusy, setSignupBusy] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(null);
  const [form, setForm] = useState({ fullName:"", phone:"", grade:"", group:"", parentName:"", parentPhone:"" });
  const signup = mode === "signup";
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const showNotice = message => {
    setNotice(message);
    if (message) notify({ type: "warning", title: "راجع البيانات", message });
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, mode, createdAccount]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  useEffect(() => {
    setStep(0);
    setNotice("");
    setCreatedAccount(null);
    setPassword("");
    setConfirmPassword("");
    setStudentId("");
    setAvatarFile(null);
    setForm({ fullName:"", phone:"", grade:"", group:"", parentName:"", parentPhone:"" });
  }, [mode]);

  const focusIntoView = event => {
    const target = event.currentTarget;
    window.setTimeout(() => target?.scrollIntoView?.({ behavior: "smooth", block: "center" }), 220);
  };

  const nextStep = () => {
    setNotice("");
    if (step === 0) {
      if (!form.fullName.trim() || form.fullName.trim().length < 5) return showNotice("اكتب الاسم بالكامل، ويفضل الاسم الرباعي.");
      if (!/^01[0125][0-9]{8}$/.test(form.phone.replace(/[\s-]/g, ""))) return showNotice("اكتب رقم هاتف مصري صحيح.");
      if (!avatarFile) return showNotice("اختار صورة شخصية للحساب قبل المتابعة.");
    }
    if (step === 1 && (!form.grade || !form.group.trim())) return showNotice("اختر الصف الدراسي واكتب المجموعة أو ميعاد الحصة.");
    if (step === 2) {
      if (!form.parentName.trim()) return showNotice("اكتب اسم ولي الأمر.");
      if (!/^01[0125][0-9]{8}$/.test(form.parentPhone.replace(/[\s-]/g, ""))) return showNotice("اكتب رقم هاتف ولي الأمر بشكل صحيح.");
    }
    if (step === 3) {
      if (password.length < 8) return showNotice("كلمة المرور لازم تكون 8 أحرف على الأقل.");
      if (password.length > 72) return showNotice("كلمة المرور طويلة جدًا.");
      if (password !== confirmPassword) return showNotice("تأكيد كلمة المرور غير مطابق.");
    }
    setStep(current => Math.min(4, current + 1));
  };

  const chooseAvatar = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      event.target.value = "";
      return showNotice("اختار صورة JPG أو PNG أو WEBP.");
    }
    if (file.size > 3145728) {
      event.target.value = "";
      return showNotice("حجم الصورة أكبر من 3 ميجابايت. اختار صورة أصغر.");
    }
    setAvatarFile(file);
    setNotice("");
  };

  const submitSignup = async () => {
    if (signupBusy) return;
    setSignupBusy(true);
    setNotice("");
    const payload = new FormData();
    payload.append("full_name", form.fullName.trim());
    payload.append("phone", form.phone.trim());
    payload.append("grade", form.grade);
    payload.append("group_name", form.group.trim());
    payload.append("parent_name", form.parentName.trim());
    payload.append("parent_phone", form.parentPhone.trim());
    payload.append("password", password);
    payload.append("avatar", avatarFile);
    try {
      const result = await createStudentAccount(payload);
      setShowPassword(false);
      if (result.session) saveStudentSession(result.session);
      setCreatedAccount({
        studentNumber: String(result.student_number),
        password,
        avatarUrl: result.avatar_url || avatarPreview,
        needsLogin: !result.session
      });
      notify({ type: "success", title: "تم إنشاء الحساب", message: "احتفظ برقم الطالب وكلمة المرور قبل الانتقال." });
    } catch (error) {
      showNotice(errorText(error.message));
    } finally {
      setSignupBusy(false);
    }
  };

  const submitLogin = async event => {
    event?.preventDefault?.();
    if (loginBusy) return;
    if (!studentId.trim() || !password) return showNotice("اكتب رقم الطالب وكلمة المرور.");
    setLoginBusy(true);
    setNotice("");
    try {
      const result = await loginStudent(studentId.trim(), password);
      saveStudentSession(result.session);
      notify({ type: "success", title: "أهلًا بعودتك", message: "تم تسجيل الدخول بنجاح." });
      onSuccess?.();
    } catch (error) {
      showNotice(errorText(error.message));
    } finally {
      setLoginBusy(false);
    }
  };

  const Field = ({ label, value, onChange, placeholder, type = "text", inputMode, autoComplete }) => (
    <label className="signup-field">
      <span>{label}</span>
      <input type={type} inputMode={inputMode} autoComplete={autoComplete} value={value} onChange={e => onChange(e.target.value)} onFocus={focusIntoView} placeholder={placeholder}/>
    </label>
  );

  return (
    <main ref={scrollRef} className={`auth-screen auth-screen-${mode}`}>
      <div className="auth-screen-bg" />
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <section className={`auth-card ${signup ? "auth-card-signup" : "auth-card-login"} ${createdAccount ? "auth-card-created" : ""}`}>
        <div className="auth-card-topline" />
        {!createdAccount && <>
          <header className="auth-card-brand">
            <div className="auth-brand-copy auth-brand-copy-primary"><b>مستر عماد السنافيري</b><span>منصة الرياضيات التعليمية</span></div>
            <div className="auth-trust"><Icon name="shield"/><span>بيئة تعليمية<br/>موثوقة ومنظمة</span></div>
          </header>
          <div className="auth-card-rule"><span /></div>
        </>}

        {createdAccount ? (
          <div className="signup-success">
            <div className="signup-success-icon"><Icon name="check" size={27}/></div>
            <span className="auth-kicker">اكتمل التسجيل بنجاح</span>
            <h1>حسابك الطلابي جاهز</h1>
            <p className="signup-success-lead">دي بيانات الدخول الخاصة بيك. انسخها واحتفظ بيها في مكان آمن.</p>
            <div className="signup-success-profile">
              <img src={createdAccount.avatarUrl} alt="صورة الحساب الطلابي"/>
              <div><b>{form.fullName}</b><span>{form.grade} · {form.group}</span></div>
            </div>
            <div className="signup-verified-pending"><Icon name="verified" size={18}/><span><b>حالة التوثيق</b><small>شارة التوثيق تظهر بعد مراجعة واعتماد الإدارة.</small></span><em>قيد المراجعة</em></div>
            <div className="signup-credential">
              <div><span>رقم الطالب (ID)</span><strong>{createdAccount.studentNumber}</strong></div>
              <button type="button" onClick={() => copyValue(createdAccount.studentNumber, "رقم الطالب")}><Icon name="copy"/> نسخ الرقم</button>
            </div>
            <div className="signup-credential">
              <div><span>كلمة المرور</span><strong className="credential-password">{showPassword ? createdAccount.password : "•".repeat(Math.min(createdAccount.password.length, 18))}</strong></div>
              <button type="button" onClick={() => copyValue(createdAccount.password, "كلمة المرور")}><Icon name="copy"/> نسخ كلمة المرور</button>
            </div>
            <p className="signup-security-note"><Icon name="lock" size={15}/> كلمة المرور لا تظهر مرة أخرى بعد مغادرة هذه الشاشة. احتفظ بنسخة منها.</p>
            {createdAccount.needsLogin ? (
              <button className="gold full auth-submit" type="button" onClick={() => onModeChange("login")}>الانتقال لتسجيل الدخول <Icon name="arrow"/></button>
            ) : (
              <button className="gold full auth-submit" type="button" onClick={() => onSuccess?.()}>الدخول إلى المنصة <Icon name="arrow"/></button>
            )}
          </div>
        ) : (
          <>
            <div className="auth-form-heading">
              <span className="auth-kicker"><Icon name="spark"/>{signup ? "ابدأ رحلتك التعليمية" : "مرحباً بعودتك إلى المنصة"}</span>
              <h1>{signup ? "أنشئ حسابك الطلابي" : "سجّل دخولك"}</h1>
              <p>{signup ? "أكمل بياناتك على خطوات واضحة ومنظمة." : "أدخل رقم الطالب وكلمة المرور للوصول إلى حسابك."}</p>
            </div>

            {signup ? (
              <div className="auth-signup-content">
                <div className="signup-progress-head"><span>{stepTitles[step]}</span><small>الخطوة {step + 1} من {stepTitles.length}</small></div>
                <div className="signup-progress-track"><span style={{ width: `${(step + 1) / stepTitles.length * 100}%` }} /></div>
                <div className="signup-step-tabs">{stepTitles.map((title, index) => <div key={title} className={index === step ? "signup-step-tab active" : index < step ? "signup-step-tab done" : "signup-step-tab"}><i>{index < step ? "✓" : index + 1}</i><span>{title}</span></div>)}</div>

                {step === 0 && <>
                  <div className="signup-photo-picker">
                    <div className="signup-photo-preview">{avatarPreview ? <img src={avatarPreview} alt="معاينة صورة الطالب"/> : <Icon name="user" size={32}/>}</div>
                    <div className="signup-photo-copy"><b>صورة الحساب</b><span>صورة واضحة لملفك الشخصي</span><label className="signup-photo-button"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatar}/> <Icon name="image" size={16}/> {avatarFile ? "تغيير الصورة" : "اختيار صورة"}</label><small>JPG أو PNG أو WEBP · حتى 3 ميجابايت</small></div>
                  </div>
                  <div className="signup-fields">
                    <Field label="الاسم بالكامل" value={form.fullName} onChange={v=>update("fullName",v)} placeholder="اكتب الاسم رباعي" autoComplete="name"/>
                    <Field label="رقم الهاتف" value={form.phone} onChange={v=>update("phone",v)} placeholder="01xxxxxxxxx" inputMode="tel" autoComplete="tel"/>
                  </div>
                </>}

                {step === 1 && <div className="signup-fields">
                  <label className="signup-field"><span>الصف الدراسي</span><select value={form.grade} onChange={e=>update("grade",e.target.value)} onFocus={focusIntoView}><option value="">اختر الصف الدراسي</option><option>الصف الأول الثانوي</option><option>الصف الثاني الثانوي</option><option>الصف الثالث الثانوي</option></select></label>
                  <Field label="المجموعة أو ميعاد الحصة" value={form.group} onChange={v=>update("group",v)} placeholder="اكتب المجموعة أو الميعاد"/>
                </div>}

                {step === 2 && <div className="signup-fields">
                  <Field label="اسم ولي الأمر" value={form.parentName} onChange={v=>update("parentName",v)} placeholder="اسم ولي الأمر بالكامل"/>
                  <Field label="رقم هاتف ولي الأمر" value={form.parentPhone} onChange={v=>update("parentPhone",v)} placeholder="01xxxxxxxxx" inputMode="tel"/>
                </div>}

                {step === 3 && <div className="signup-fields">
                  <Field label="أنشئ كلمة مرور" value={password} onChange={setPassword} placeholder="8 أحرف على الأقل" type={showPassword ? "text" : "password"} autoComplete="new-password"/>
                  <div className="signup-password-tools"><button type="button" onClick={()=>setShowPassword(v=>!v)}><Icon name="eye" size={16}/>{showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}</button><span>استخدم كلمة مرور يصعب تخمينها.</span></div>
                  <Field label="تأكيد كلمة المرور" value={confirmPassword} onChange={setConfirmPassword} placeholder="اكتب كلمة المرور مرة أخرى" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password"/>
                  <div className="signup-password-tools"><button type="button" onClick={()=>setShowConfirmPassword(v=>!v)}><Icon name="eye" size={16}/>{showConfirmPassword ? "إخفاء التأكيد" : "إظهار التأكيد"}</button></div>
                </div>}

                {step === 4 && <div className="signup-review">
                  <div className="signup-review-photo"><img src={avatarPreview} alt="صورة الطالب"/><span>{form.fullName}</span></div>
                  <div><span>رقم الهاتف</span><b>{form.phone}</b></div>
                  <div><span>الصف الدراسي</span><b>{form.grade}</b></div>
                  <div><span>المجموعة</span><b>{form.group}</b></div>
                  <div><span>ولي الأمر</span><b>{form.parentName}</b></div>
                  <div><span>هاتف ولي الأمر</span><b>{form.parentPhone}</b></div>
                  <div><span>كلمة المرور</span><b>تم إعدادها بنجاح</b></div>
                  <p>بمراجعة البيانات والضغط على إنشاء الحساب، سيتم إنشاء رقم الطالب وحفظ صورة الحساب في المنصة.</p>
                </div>}

                <div className="signup-actions">
                  {step > 0 && <button className="signup-back" type="button" onClick={()=>{setNotice("");setStep(v=>v-1)}}>السابق</button>}
                  <button className="gold full auth-submit" type="button" disabled={signupBusy} onClick={()=>step < 4 ? nextStep() : submitSignup()}>
                    {signupBusy ? "جارٍ إنشاء الحساب..." : step === 4 ? "إنشاء الحساب الآن" : "متابعة إلى الخطوة التالية"} <Icon name="arrow"/>
                  </button>
                </div>
                <div className="auth-switch-row">لديك حساب بالفعل؟ <button type="button" onClick={() => onModeChange("login")}>تسجيل الدخول</button></div>
              </div>
            ) : (
              <form className="auth-login-form" onSubmit={submitLogin}>
                <div className="auth-fields">
                  <label htmlFor="student-id"><span className="auth-label-icon"><Icon name="id"/></span>رقم الطالب (ID)</label>
                  <div className="auth-input-wrap"><input id="student-id" value={studentId} onChange={e => setStudentId(e.target.value)} onFocus={focusIntoView} placeholder="اكتب رقم الطالب الخاص بك" autoComplete="username" inputMode="numeric"/></div>
                  <label htmlFor="student-password"><span className="auth-label-icon"><Icon name="lock"/></span>كلمة المرور</label>
                  <div className="auth-input-wrap password-field"><input id="student-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onFocus={focusIntoView} placeholder="اكتب كلمة المرور" autoComplete="current-password"/><button className="password-toggle" type="button" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setShowPassword(v => !v)}><Icon name="eye"/></button></div>
                </div>
                <button className="auth-forgot" type="button" onClick={() => notify({type:"info",title:"استعادة بيانات الدخول",message:"لاستعادة رقم الطالب أو كلمة المرور، تواصل مع إدارة المنصة من خلال خدمة العملاء."})}>نسيت رقم الطالب أو كلمة المرور؟</button>
                <button className="gold full auth-submit" type="submit" disabled={loginBusy}>{loginBusy ? "جارٍ تسجيل الدخول..." : "دخول إلى حسابي"} <Icon name="arrow"/></button>
                <div className="auth-switch-row">ليس لديك حساب؟ <button type="button" onClick={() => onModeChange("signup")}>إنشاء حساب جديد</button></div>
                <div className="auth-secure-foot"><Icon name="shield"/><span>دخول مخصص لطلاب منصة مستر عماد السنافيري</span></div>
              </form>
            )}
          </>
        )}
      </section>
      <footer className="auth-footer"><span>مستر عماد السنافيري</span><i/><span>خطوتك القادمة تبدأ من هنا</span></footer>
    </main>
  );
}
