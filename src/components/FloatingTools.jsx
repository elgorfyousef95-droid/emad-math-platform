import React, { useEffect, useMemo, useRef, useState } from "react";
import "./floating-tools.css";

const FUNCTIONS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10,
  exp: Math.exp, floor: Math.floor, ceil: Math.ceil, round: Math.round
};

function calculateExpression(source, degrees = true) {
  const input = source.replace(/×/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/√/g, "sqrt").replace(/\s+/g, "");
  const tokens = input.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[A-Za-z_]+|[()+\-*/^!,]/gi);
  if (!tokens || tokens.join("") !== input) throw new Error("راجع صيغة العملية");
  let i = 0;
  const peek = () => tokens[i];
  const take = () => tokens[i++];
  const angle = x => degrees ? x * Math.PI / 180 : x;
  const primary = () => {
    const t = take();
    if (t === undefined) throw new Error("عملية غير مكتملة");
    if (t === "+") return unary();
    if (t === "-") return -unary();
    if (t === "(") { const v = expression(); if (take() !== ")") throw new Error("قوس غير مغلق"); return v; }
    if (/^(?:\d|\.)/.test(t)) return Number(t);
    if (/^[A-Za-z_]+$/.test(t)) {
      const name = t.toLowerCase();
      if (name === "pi") return Math.PI;
      if (name === "e") return Math.E;
      if (name === "ans") return Number(window.localStorage.getItem("emad-calc-ans") || 0);
      if (peek() === "(" && FUNCTIONS[name]) {
        take(); const arg = expression(); if (take() !== ")") throw new Error("قوس الدالة غير مغلق");
        return FUNCTIONS[name](["sin","cos","tan"].includes(name) ? angle(arg) : arg);
      }
      throw new Error("اسم أو دالة غير معروفة: " + t);
    }
    throw new Error("صيغة غير صحيحة");
  };
  const factorial = n => {
    if (n < 0 || !Number.isInteger(n) || n > 170) throw new Error("المضروب يتطلب عددًا صحيحًا من 0 إلى 170");
    let v = 1; for (let k = 2; k <= n; k++) v *= k; return v;
  };
  const postfix = () => { let v = primary(); while (peek() === "!") { take(); v = factorial(v); } return v; };
  const power = () => { let v = postfix(); if (peek() === "^") { take(); v = v ** unary(); } return v; };
  const unary = () => { if (peek() === "+") { take(); return unary(); } if (peek() === "-") { take(); return -unary(); } return power(); };
  const term = () => { let v = unary(); while (peek() === "*" || peek() === "/") { const op = take(); const n = unary(); v = op === "*" ? v * n : v / n; } return v; };
  const expression = () => { let v = term(); while (peek() === "+" || peek() === "-") { const op = take(); const n = term(); v = op === "+" ? v + n : v - n; } return v; };
  const result = expression();
  if (i !== tokens.length || !Number.isFinite(result)) throw new Error("الناتج غير صالح");
  return result;
}

const KEYS = ["sin(", "cos(", "tan(", "√(", "(", ")", "⌫", "AC", "7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "^", "+", "π", "e", "!", "=", "log(", "ln("];

function FloatingTools() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("calc");
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState([]);
  const [degrees, setDegrees] = useState(true);
  const [voiceText, setVoiceText] = useState("");
  const [reply, setReply] = useState("أهلًا! تقدر تتكلم أو تكتب سؤالك. المحادثة الذكية الكاملة تحتاج ربط محرك لغوي مناسب.");
  const [listening, setListening] = useState(false);
  const recognition = useRef(null);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem("emad-calc-history") || "[]")); } catch {}
    return () => { recognition.current?.stop(); };
  }, []);

  const append = key => {
    if (key === "AC") { setExpression(""); setResult(""); return; }
    if (key === "⌫") { setExpression(v => v.slice(0, -1)); return; }
    if (key === "=") {
      try {
        const value = calculateExpression(expression, degrees);
        const formatted = Number(value.toPrecision(12)).toString();
        const item = { expression, result: formatted, at: Date.now() };
        setResult(formatted); setExpression(formatted);
        setHistory(old => {
          const next = [item, ...old].slice(0, 30);
          try { localStorage.setItem("emad-calc-history", JSON.stringify(next)); localStorage.setItem("emad-calc-ans", formatted); } catch {}
          return next;
        });
      } catch (e) { setResult(e.message); }
      return;
    }
    setExpression(v => v + key);
  };

  const startVoice = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) { setReply("المتصفح الحالي لا يدعم التعرف على الصوت. جرّب Chrome وحدّثه، أو اكتب رسالتك."); return; }
    if (listening) { recognition.current?.stop(); setListening(false); return; }
    const rec = new Speech();
    recognition.current = rec;
    rec.lang = "ar-EG"; rec.interimResults = true; rec.continuous = false;
    rec.onstart = () => setListening(true);
    rec.onresult = event => {
      const text = Array.from(event.results).map(x => x[0].transcript).join("");
      setVoiceText(text);
    };
    rec.onerror = () => { setListening(false); setReply("حصلت مشكلة في التقاط الصوت. تأكد من إذن الميكروفون وحاول مرة أخرى."); };
    rec.onend = () => setListening(false);
    rec.start();
  };

  const sendVoiceText = () => {
    const text = voiceText.trim();
    if (!text) return;
    let answer = "وصلت رسالتك: «" + text + "». واجهة الصوت جاهزة لالتقاط الكلام والرد المنطوق، لكن فهم الأسئلة المفتوح يحتاج توصيل محرك يوسف AI اللغوي قبل اعتمادها كمحادثة ذكية كاملة.";
    const math = text.match(/(?:احسب|ناتج|يساوي)\s*([0-9π().+\-*/×÷^ ]+)/i);
    if (math) {
      try { answer = "الناتج هو " + calculateExpression(math[1].replace(/×/g,"*").replace(/÷/g,"/"), degrees); }
      catch {}
    }
    setReply(answer);
    if (synth && "speechSynthesis" in window) {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(answer);
      utterance.lang = "ar-EG"; utterance.rate = 1; synth.speak(utterance);
    }
    setVoiceText("");
  };

  return <div className="emad-floating-tools" dir="rtl">
    <button className="emad-tools-launcher" aria-label="فتح الأدوات المساعدة" onClick={() => setOpen(v => !v)}>
      <span className="emad-tools-launcher-icon">{open ? "×" : "∑"}</span>
      {!open && <span className="emad-tools-launcher-label">الأدوات</span>}
    </button>
    {open && <section className="emad-tools-panel" aria-label="الأدوات المساعدة">
      <header className="emad-tools-header"><div><b>أدوات الطالب</b><small>حاسبة علمية ومحادثة صوتية</small></div><button onClick={() => setOpen(false)} aria-label="إخفاء الأدوات">−</button></header>
      <nav className="emad-tools-tabs"><button className={tab==="calc"?"active":""} onClick={()=>setTab("calc")}>الحاسبة العلمية</button><button className={tab==="voice"?"active":""} onClick={()=>setTab("voice")}>يوسف AI صوتيًا</button></nav>
      {tab === "calc" ? <div className="emad-calc">
        <div className="emad-calc-screen"><div className="emad-calc-expression" dir="ltr">{expression || "0"}</div><strong dir="ltr">{result || " "}</strong></div>
        <div className="emad-calc-settings"><button onClick={()=>setDegrees(v=>!v)}>{degrees?"DEG":"RAD"}</button><span>علمية</span><button onClick={()=>setHistory(v=>{localStorage.removeItem("emad-calc-history");return [];})}>مسح السجل</button></div>
        <div className="emad-calc-keys">{KEYS.map((key,i)=><button key={key+i} className={["=","AC","⌫"].includes(key)?"emphasis":/[+\-×÷^]/.test(key)?"operator":""} onClick={()=>append(key)}>{key}</button>)}</div>
        {history.length>0&&<div className="emad-calc-history"><b>آخر العمليات</b>{history.slice(0,4).map((h,i)=><button key={h.at+i} onClick={()=>{setExpression(h.expression);setResult(h.result);}}><span dir="ltr">{h.expression}</span><strong dir="ltr">{h.result}</strong></button>)}</div>}
        <small className="emad-tools-note">يدعم الدوال المثلثية والجذور واللوغاريتمات والأسس والمضروب والذاكرة ANS.</small>
      </div> : <div className="emad-voice">
        <div className="emad-voice-status">{listening?"جارٍ الاستماع إليك…":"المحادثة الصوتية"}</div>
        <p>{reply}</p>
        <textarea value={voiceText} onChange={e=>setVoiceText(e.target.value)} placeholder="اكتب رسالتك أو اضغط على الميكروفون..." rows={3}/>
        <div className="emad-voice-actions"><button className={listening?"recording":""} onClick={startVoice}>{listening?"إيقاف الاستماع":"🎙 تحدث"}</button><button onClick={sendVoiceText} disabled={!voiceText.trim()}>إرسال</button><button onClick={()=>{synth?.cancel();}}>إيقاف الصوت</button></div>
        {!supported&&<small>التعرف على الصوت غير متاح في هذا المتصفح؛ الكتابة والرد الصوتي يعتمدان على دعم الجهاز.</small>}
        <small className="emad-tools-note">تنبيه: هذه واجهة صوت أولية، وليست بعدُ محرك محادثة لغويًا كاملًا.</small>
      </div>}
    </section>}
  </div>;
}

export default FloatingTools;
