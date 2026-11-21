import React, { useEffect, useState } from "react";
import "./SplashScreen.css";

const teacherPhoto = "https://raw.githubusercontent.com/elgorfyousef95-droid/emad-math-platform/main/IMG-20261121-WA0004.jpg";

const floatingLines = [
  { className: "splash-float splash-float-top", eyebrow: "تعلّم بثقة", text: "كل فكرة ليها طريقة أبسط" },
  { className: "splash-float splash-float-right", eyebrow: "خطوة بخطوة", text: "من الفهم… للحل… للتفوّق" },
  { className: "splash-float splash-float-left", eyebrow: "تدريب ذكي", text: "ثبّت المعلومة بالممارسة" },
  { className: "splash-float splash-float-midright", eyebrow: "متابعة مستمرة", text: "تقدّمك يستحق الاهتمام" },
  { className: "splash-float splash-float-midleft", eyebrow: "رياضيات بشكل مختلف", text: "افهم الفكرة قبل ما تحفظ القانون" },
  { className: "splash-float splash-float-bottomline", eyebrow: "ابدأ رحلتك", text: "مكان واحد… لكل طموحك" }
];

export default function SplashScreen({ onComplete }) {
  const [isLeaving, setIsLeaving] = useState(false);
  useEffect(() => {
    const exitStart = window.setTimeout(() => setIsLeaving(true), 9300);
    const finish = window.setTimeout(() => onComplete?.(), 10000);
    return () => { window.clearTimeout(exitStart); window.clearTimeout(finish); };
  }, [onComplete]);
  return (
    <main className={isLeaving ? "splash-screen splash-is-leaving" : "splash-screen"} aria-label="منصة مستر عماد السنافيري">
      <div className="splash-ambient" aria-hidden="true" />
      <div className="splash-grid-glow" aria-hidden="true" />
      <div className="splash-orbit-ring splash-orbit-ring-one" aria-hidden="true" />
      <div className="splash-orbit-ring splash-orbit-ring-two" aria-hidden="true" />
      <div className="splash-photo-halo" aria-hidden="true" />
      <img
        className="splash-background-image"
        src={teacherPhoto}
        alt="مستر عماد السنافيري"
        fetchPriority="high"
        decoding="async"
        onError={(event) => { event.currentTarget.style.display = "none"; }}
      />

      <div className="splash-brand-corner">
        <span className="splash-brand-symbol">∑</span>
        <span><b>مستر عماد السنافيري</b><small>منصة الرياضيات التعليمية</small></span>
      </div>

      <div className="splash-main-copy">
        <span className="splash-kicker">تجربة تعليمية مختلفة</span>
        <h1>الرياضيات <em>أوضح مما تتخيل</em></h1>
        <p>افهم الفكرة، أتقن الحل، وخلي كل خطوة تقرّبك من هدفك.</p>
      </div>

      <div className="splash-king-math" aria-label="كينج الرياضيات"><span className="king-orbit">✦</span><b>كينج الرياضيات</b><small>THE KING OF MATHEMATICS</small></div>

      {floatingLines.map((line, index) => (
        <div className={line.className} key={line.className} style={{ "--float-delay": `${0.35 + index * 0.42}s` }}>
          <span>{line.eyebrow}</span>
          <b>{line.text}</b>
        </div>
      ))}

      <div className="splash-bottom-loader" aria-label="جارٍ تجهيز المنصة">
        <div className="splash-loader-ring"><i /><b /></div>
        <span>لحظات ونبدأ معاك</span>
        <small>جاري تجهيز تجربتك التعليمية</small>
      </div>

      <div className="splash-progress" role="progressbar" aria-label="جارٍ تجهيز المنصة" aria-valuemin="0" aria-valuemax="100">
        <span />
      </div>
    </main>
  );
}
