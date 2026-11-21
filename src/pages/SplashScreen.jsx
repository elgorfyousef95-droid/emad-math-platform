import React from "react";

const teacherPhoto = "https://raw.githubusercontent.com/elgorfyousef95-droid/emad-math-platform/main/IMG-20261121-WA0004.jpg";

export default function SplashScreen() {
  return (
    <main className="splash-screen" aria-label="منصة مستر عماد السنافيري">
      <div className="splash-photo-backdrop" aria-hidden="true" />
      <img
        className="splash-background-image"
        src={teacherPhoto}
        alt="مستر عماد السنافيري"
        fetchPriority="high"
        decoding="async"
        onError={(event) => { event.currentTarget.style.display = "none"; }}
      />
      <div className="splash-image-vignette" aria-hidden="true" />
      <section className="splash-welcome-panel">
        <span className="splash-overline splash-reveal splash-reveal-one">منصة مستر عماد السنافيري</span>
        <h1 className="splash-reveal splash-reveal-two">افهم الرياضيات… <em>واصنع تفوقك</em></h1>
        <p className="splash-reveal splash-reveal-three">شرح يبسّط الفكرة، وتدريب يثبّت المعلومة، ومتابعة تقرّبك من هدفك.</p>
        <div className="splash-loading-row splash-reveal splash-reveal-four">
          <span>نحضّر لك تجربة تعلّم متكاملة</span>
          <span className="splash-orbit-loader" aria-hidden="true"><i /></span>
        </div>
        <div className="splash-progress" role="progressbar" aria-label="جارٍ تجهيز المنصة" aria-valuemin="0" aria-valuemax="100"><span /></div>
      </section>
      <div className="splash-bottom-mark" aria-hidden="true">رحلتك نحو التفوق تبدأ الآن</div>
    </main>
  );
}
