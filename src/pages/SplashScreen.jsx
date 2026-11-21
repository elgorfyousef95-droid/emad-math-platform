import React from "react";

export default function SplashScreen() {
  return (
    <main className="splash-screen" aria-label="شاشة الترحيب">
      <div className="splash-photo-backdrop" aria-hidden="true" />
      <img
        className="splash-background-image"
        src="/IMG-20261121-WA0004.jpg"
        alt="مستر عماد السنافيري"
        fetchPriority="high"
      />
      <div className="splash-image-vignette" aria-hidden="true" />
      <section className="splash-welcome-panel">
        <span className="splash-overline">منصة مستر عماد السنافيري</span>
        <h1>مرحباً بك في منصتك التعليمية</h1>
        <p>ابدأ رحلتك في الرياضيات بفهم أوضح، وتدريب أقوى، وخطوات واثقة نحو التفوق.</p>
        <div className="splash-loading-row">
          <span>جارٍ تجهيز تجربتك التعليمية</span>
          <span className="splash-loading-dots" aria-hidden="true"><i /><i /><i /></span>
        </div>
        <div className="splash-progress" role="progressbar" aria-label="تحميل المنصة" aria-valuemin="0" aria-valuemax="100">
          <span />
        </div>
        <small>لحظات قليلة ونبدأ</small>
      </section>
    </main>
  );
}
