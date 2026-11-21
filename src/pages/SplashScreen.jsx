import React from "react";

export default function SplashScreen() {
  return (
    <main className="splash-screen" aria-label="منصة مستر عماد السنافيري">
      <div className="splash-photo-backdrop" aria-hidden="true" />
      <img className="splash-background-image" src="/IMG-20261121-WA0004.jpg" alt="مستر عماد السنافيري" fetchPriority="high" />
      <div className="splash-image-vignette" aria-hidden="true" />
      <section className="splash-welcome-panel">
        <span className="splash-overline">منصة مستر عماد السنافيري</span>
        <h1>طريقك لفهم الرياضيات يبدأ هنا</h1>
        <p>شرح واضح، تدريب ذكي، ومتابعة تساعدك توصل لأفضل مستوى.</p>
        <div className="splash-loading-row">
          <span>نجهّز لك تجربة تعليمية مختلفة</span>
          <span className="splash-orbit-loader" aria-hidden="true"><i /></span>
        </div>
        <div className="splash-progress" role="progressbar" aria-label="تحميل المنصة" aria-valuemin="0" aria-valuemax="100"><span /></div>
      </section>
      <div className="splash-bottom-mark" aria-hidden="true"><span /> تجربة تعليمية تليق بطموحك <span /></div>
    </main>
  );
}
