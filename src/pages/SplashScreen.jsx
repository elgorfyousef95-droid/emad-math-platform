import React from "react";

export default function SplashScreen() {
  return (
    <main className="splash-screen" aria-label="شاشة الترحيب">
      <div className="splash-shade" />
      <div className="splash-content">
        <div className="splash-brand">
          <span className="splash-brand-rule" />
          <span className="splash-brand-name">EMAD MATH</span>
          <span className="splash-brand-rule" />
        </div>
        <p className="splash-eyebrow">منصة مستر عماد السنافيري التعليمية</p>
        <h1>خطوة جديدة نحو<br/><strong>فهم أعمق وتفوق أكبر</strong></h1>
        <p className="splash-description">تعلم الرياضيات بثقة، تابع تقدمك، واستعد لكل امتحان<br className="desktop-break"/> بخطة واضحة وتجربة تعليمية منظمة.</p>
        <div className="splash-divider"><span /></div>
        <p className="splash-welcome">أهلاً بك في رحلتك التعليمية</p>
        <div className="splash-progress"><span /></div>
      </div>
      <div className="splash-footer"><span>مستر عماد السنافيري</span><span>تعليم • تدريب • تفوق</span></div>
    </main>
  );
}
