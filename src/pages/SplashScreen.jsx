import React from "react";

function Seal() {
  return <div className="splash-seal" aria-hidden="true"><span>EM</span><i /></div>;
}

export default function SplashScreen() {
  return (
    <main className="splash-screen" aria-label="شاشة الترحيب">
      <div className="splash-shade" />
      <div className="splash-orbit splash-orbit-one" />
      <div className="splash-orbit splash-orbit-two" />
      <section className="splash-stage">
        <div className="splash-master-photo">
          <img src="/IMG-20261121-WA0004.jpg" alt="مستر عماد السنافيري" />
          <span className="splash-photo-ring" />
        </div>
        <div className="splash-copy">
          <div className="splash-brand"><span /> EMAD ALSANAFIRY <span /></div>
          <p className="splash-eyebrow">منصة الرياضيات التعليمية</p>
          <h1>ابدأ رحلتك نحو<br /><strong>فهم أقوى وتفوق حقيقي</strong></h1>
          <p className="splash-description">شرح واضح، تدريب ذكي، ومتابعة منظمة<br className="desktop-break" /> تساعدك تحقق أفضل نتيجة خطوة بخطوة.</p>
          <div className="splash-divider"><i /></div>
          <p className="splash-welcome">أهلاً بك في منصتك التعليمية</p>
        </div>
      </section>
      <footer className="splash-footer"><span>مستر عماد السنافيري</span><span>تعليم بفهم • تدريب بثقة • تفوق باستحقاق</span></footer>
      <div className="splash-progress"><span /></div>
    </main>
  );
}
