import React, { useEffect, useRef, useState } from "react";
import { generateYousefReply } from "../ai/yousefEngine.js";
import "./yousef-ai.css";

const starters = [
  "اشرح لي قانون نيوتن الثاني ببساطة",
  "عايز أفهم التفاضل خطوة بخطوة",
  "حلل لي مسألة رياضيات",
  "اعمل لي اختبار قصير في الفيزياء"
];

export default function YousefAI({ profile }) {
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem("emad-yousef-chat-v2") || "[]"); } catch { return []; }
  });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported] = useState(() => typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [speaking, setSpeaking] = useState(false);
  const recognition = useRef(null);
  const bottom = useRef(null);

  useEffect(() => {
    try { localStorage.setItem("emad-yousef-chat-v2", JSON.stringify(messages.slice(-100))); } catch {}
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-EG";
    utterance.rate = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const send = (value = draft) => {
    const prompt = String(value || "").trim();
    if (!prompt || busy) return;
    setDraft("");
    setMessages(old => [...old, { role: "user", content: prompt, at: Date.now() }]);
    setBusy(true);
    window.setTimeout(() => {
      const answer = generateYousefReply(prompt);
      setMessages(old => [...old, { role: "assistant", content: answer, at: Date.now() }]);
      setBusy(false);
    }, 250);
  };

  const toggleVoice = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return;
    if (listening) { recognition.current?.stop(); setListening(false); return; }
    const rec = new Speech();
    recognition.current = rec;
    rec.lang = "ar-EG";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onstart = () => setListening(true);
    rec.onresult = event => {
      const transcript = Array.from(event.results).map(result => result[0].transcript).join("");
      setDraft(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const clearChat = () => {
    window.speechSynthesis?.cancel();
    setMessages([]);
    try { localStorage.removeItem("emad-yousef-chat-v2"); localStorage.removeItem("emad-yousef-ai-memory-v1"); } catch {}
  };

  return <main className="yousef-ai-page" dir="rtl">
    <header className="yousef-ai-hero">
      <div className="yousef-ai-brand-mark">Y</div>
      <div className="yousef-ai-hero-copy">
        <span>EMAD LEARNING · PERSONAL ASSISTANT</span>
        <h1>يوسف AI</h1>
        <p>مساعدك التعليمي — اسأل، ناقش، وراجع خطوة بخطوة</p>
      </div>
      <div className="yousef-ai-online"><i/> جاهز للمحادثة</div>
    </header>
    <section className="yousef-ai-workspace">
      <aside className="yousef-ai-side">
        <div className="yousef-ai-side-title">ابدأ من هنا</div>
        <p>اختار سؤالًا كبداية أو اكتب سؤالك بطريقتك.</p>
        {starters.map(item => <button key={item} onClick={() => send(item)}>{item}<span>←</span></button>)}
        <div className="yousef-ai-capabilities">
          <b>ماذا يستطيع الآن؟</b>
          <span>شرح المفاهيم المضافة لقاعدة المعرفة</span>
          <span>مساعدة حسابية أساسية</span>
          <span>الكتابة والإملاء الصوتي بالعربية عند دعم المتصفح</span>
          <span>حفظ سجل المحادثة على هذا الجهاز</span>
        </div>
        <button className="yousef-ai-clear" onClick={clearChat}>مسح المحادثة والذاكرة المحلية</button>
      </aside>
      <section className="yousef-ai-chat">
        <div className="yousef-ai-chat-head"><div><b>المحادثة</b><small>الردود بالعربية</small></div><span>نسخة تجريبية محلية</span></div>
        <div className="yousef-ai-messages">
          {!messages.length && <div className="yousef-ai-welcome"><div className="yousef-ai-welcome-icon">✦</div><h2>أهلًا بيك{profile?.full_name ? "، " + profile.full_name.split(" ")[0] : ""}!</h2><p>أنا يوسف AI. اكتب سؤالك، وهنبدأ من هنا. لو المعلومة مش موجودة عندي هقولك بوضوح.</p></div>}
          {messages.map((message,index) => <article key={message.at + "-" + index} className={"yousef-ai-message " + message.role}>
            <div className="yousef-ai-avatar">{message.role === "assistant" ? "Y" : "أنت"}</div>
            <div className="yousef-ai-bubble"><small>{message.role === "assistant" ? "يوسف AI" : "أنت"}</small><p>{message.content}</p>
              {message.role === "assistant" && <button className="yousef-ai-speak" onClick={() => speak(message.content)} title="استمع إلى الرد">▶ استمع للرد</button>}
            </div>
          </article>)}
          {busy && <div className="yousef-ai-thinking">يوسف AI بيجهز الرد…</div>}
          <div ref={bottom}/>
        </div>
        <div className="yousef-ai-composer">
          <textarea value={draft} onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();send();}}} placeholder="اكتب سؤالك هنا… (Enter للإرسال)" rows={2}/>
          <div className="yousef-ai-composer-actions">
            <button className={listening?"recording":""} onClick={toggleVoice} disabled={!voiceSupported}>{listening?"إيقاف التسجيل":"🎙 إملاء صوتي"}</button>
            <button onClick={()=>{window.speechSynthesis?.cancel();setSpeaking(false);}} disabled={!speaking}>إيقاف الصوت</button>
            <button className="yousef-ai-send" onClick={()=>send()} disabled={!draft.trim()||busy}>إرسال <span>➤</span></button>
          </div>
          <small>لا تكتب بياناتك السرية. المحادثة محفوظة محليًا على هذا الجهاز.</small>
        </div>
      </section>
    </section>
    <div className="yousef-ai-disclaimer">مهم: هذه النسخة واجهة محادثة متصلة بمحرك قواعد ومعرفة محلي محدود، وليست حتى الآن نموذجًا لغويًا عامًا بمستوى ChatGPT. لن نخترع إجابات عند غياب المعلومة.</div>
  </main>;
}
