import React from "react";

export default function SplashScreen() {
  return (
    <main className="splash-screen" aria-label="شاشة الترحيب">
      <div className="splash-shade" />
      <div className="splash-center">
        <div className="splash-mark">∑</div>
        <p className="splash-eyebrow">منصة الرياضيات التعليمية</p>
        <h1>مستر عماد السنافيري</h1>
        <span className="splash-line" />
        <p className="splash-caption">طريقك للفهم والتفوق يبدأ هنا</p>
      </div>
      <div className="splash-bottom">أهلاً بيك في منصتك التعليمية</div>
    </main>
  );
}
