import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">∑</span><span>مستر عماد <small>منصة الرياضيات</small></span></a>
        <nav><a href="#features">مميزات المنصة</a><a href="#about">عن المستر</a><a className="login-link" href="#login">تسجيل الدخول</a></nav>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span></span> تعلّم بذكاء.. وحقق هدفك</div>
          <h1>الرياضيات<br/><em>بقت أوضح وأسهل</em></h1>
          <p>منصة تعليمية متكاملة مع مستر عماد السنافيري. شرح منظم، تدريبات تفاعلية، وامتحانات تساعدك تتابع مستواك خطوة بخطوة.</p>
          <div className="actions"><a className="primary" href="#login">ابدأ رحلتك التعليمية <b>←</b></a><a className="secondary" href="#features">اكتشف المنصة</a></div>
          <div className="proof"><span>✦</span> شرح واضح <i></i> متابعة مستمرة <i></i> تدريب وامتحانات</div>
        </div>
        <div className="math-art" aria-hidden="true"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="formula">∫ f(x) dx</div><div className="sigma">Σ</div><div className="pi">π</div><div className="graph"><span></span></div></div>
      </section>
      <section className="features" id="features"><div><b>01</b><h2>شرح مرتب</h2><p>كل درس متقسم بشكل واضح عشان تذاكر من غير تشتت.</p></div><div><b>02</b><h2>تدريبات متنوعة</h2><p>أسئلة بمستويات مختلفة لتثبيت الفهم والتطبيق.</p></div><div><b>03</b><h2>امتحانات ومتابعة</h2><p>اختبر نفسك وتابع تقدمك في كل خطوة.</p></div></section>
      <footer id="about"><span>مستر عماد السنافيري</span><span>منصة تعليمية قيد التجهيز © 2026</span></footer>
    </main>
  );
}
createRoot(document.getElementById("root")).render(<App />);