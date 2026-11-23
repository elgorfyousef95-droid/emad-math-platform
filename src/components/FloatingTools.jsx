import React, { useEffect, useState } from "react";
import "./floating-tools.css";

const funcs={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,sqrt:Math.sqrt,abs:Math.abs,ln:Math.log,log:Math.log10,exp:Math.exp,floor:Math.floor,ceil:Math.ceil,round:Math.round};
function evaluate(source,degrees,ans,memory){
 const s=source.replace(/×/g,"*").replace(/÷/g,"/").replace(/π/g,"pi").replace(/√/g,"sqrt").replace(/\s+/g,"");
 const ts=s.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[A-Za-z_]+|[()+\-*/^!,]/gi);
 if(!ts||ts.join("")!==s)throw Error("راجع صيغة العملية");
 let i=0;const peek=()=>ts[i],take=()=>ts[i++],ang=x=>degrees?x*Math.PI/180:x;
 const primary=()=>{const t=take();if(t===undefined)throw Error("عملية غير مكتملة");if(t==="+")return unary();if(t==="-")return -unary();if(t==="("){const v=expr();if(take()!==")")throw Error("قوس غير مغلق");return v;}if(/^(?:\d|\.)/.test(t))return Number(t);if(/^[A-Za-z_]+$/.test(t)){const n=t.toLowerCase();if(n==="pi")return Math.PI;if(n==="e")return Math.E;if(n==="ans")return ans;if(n==="m")return memory;if(peek()==="("&&funcs[n]){take();const a=expr();if(take()!==")")throw Error("قوس الدالة غير مغلق");return funcs[n]((["sin","cos","tan"].includes(n))?ang(a):(["asin","acos","atan"].includes(n)?(degrees?funcs[n](a)*180/Math.PI:funcs[n](a)):a));}throw Error("دالة غير معروفة: "+t);}throw Error("صيغة غير صحيحة");};
 const fact=n=>{if(n<0||!Number.isInteger(n)||n>170)throw Error("المضروب من 0 إلى 170 فقط");let v=1;for(let k=2;k<=n;k++)v*=k;return v;};
 const post=()=>{let v=primary();while(peek()==="!"){take();v=fact(v);}return v;};
 const power=()=>{let v=post();if(peek()==="^"){take();v=v**unary();}return v;};
 const unary=()=>{if(peek()==="+"){take();return unary();}if(peek()==="-"){take();return -unary();}return power();};
 const term=()=>{let v=unary();while(peek()==="*"||peek()==="/"){const o=take(),n=unary();v=o==="*"?v*n:v/n;}return v;};
 const expr=()=>{let v=term();while(peek()==="+"||peek()==="-"){const o=take(),n=term();v=o==="+"?v+n:v-n;}return v;};
 const v=expr();if(i!==ts.length||!Number.isFinite(v))throw Error("الناتج غير صالح");return v;
}
const keys=["sin(","cos(","tan(","asin(","acos(","atan(","√(","log(","ln(","(",")","⌫","AC","7","8","9","÷","4","5","6","×","1","2","3","-","0",".","^","+","π","e","!","="];
export default function FloatingTools(){
 const [open,setOpen]=useState(false),[expr,setExpr]=useState(""),[out,setOut]=useState(""),[deg,setDeg]=useState(true),[mode,setMode]=useState("scientific"),[ans,setAns]=useState(0),[memory,setMemory]=useState(0),[history,setHistory]=useState([]);
 useEffect(()=>{try{setHistory(JSON.parse(localStorage.getItem("emad-calc-history")||"[]"));setAns(Number(localStorage.getItem("emad-calc-ans")||0));setMemory(Number(localStorage.getItem("emad-calc-memory")||0));}catch{}},[]);
 const calc=()=>{try{const n=evaluate(expr,deg,ans,memory),v=Number(n.toPrecision(13)).toString();setOut(v);setExpr(v);setAns(n);const h=[{expression:expr,result:v,at:Date.now()},...history].slice(0,50);setHistory(h);localStorage.setItem("emad-calc-history",JSON.stringify(h));localStorage.setItem("emad-calc-ans",String(n));}catch(e){setOut(e.message);}};
 const press=k=>{if(k==="AC"){setExpr("");setOut("");}else if(k==="⌫")setExpr(v=>v.slice(0,-1));else if(k==="=")calc();else setExpr(v=>v+k);};
 const memoryAction=a=>{try{const n=evaluate(expr||String(ans),deg,ans,memory);const m=a==="clear"?0:a==="add"?memory+n:a==="subtract"?memory-n:memory;setMemory(m);localStorage.setItem("emad-calc-memory",String(m));if(a==="recall")setExpr(v=>v+"M");}catch{setOut("أدخل عملية صحيحة أولًا");}};
 const conversions=()=>{try{const n=evaluate(expr||"0",deg,ans,memory);return [{k:"DEC",v:String(Math.trunc(n))},{k:"BIN",v:(Math.trunc(n)>>>0).toString(2)},{k:"OCT",v:(Math.trunc(n)>>>0).toString(8)},{k:"HEX",v:(Math.trunc(n)>>>0).toString(16).toUpperCase()}];}catch{return [];}};
 return <div className="emad-floating-tools" dir="rtl">
  <button className="emad-tools-launcher" aria-label="فتح الآلة الحاسبة العلمية" onClick={()=>setOpen(v=>!v)}><span className="emad-tools-launcher-icon">{open?"×":"∑"}</span><span className="emad-tools-launcher-label">الحاسبة</span></button>
  {open&&<section className="emad-tools-panel" aria-label="آلة حاسبة علمية">
   <header className="emad-tools-header"><div><b>الآلة الحاسبة العلمية</b><small>Scientific · Programmer · Memory</small></div><button onClick={()=>setOpen(false)} aria-label="إغلاق الحاسبة">×</button></header>
   <div className="emad-calc-screen"><small> {deg?"DEG":"RAD"} · ANS: {ans}</small><div className="emad-calc-expression" dir="ltr">{expr||"0"}</div><strong dir="ltr">{out||" "}</strong></div>
   <div className="emad-calc-settings"><button onClick={()=>setDeg(v=>!v)}>{deg?"DEG":"RAD"}</button><button onClick={()=>setMode(v=>v==="scientific"?"programmer":"scientific")}>{mode==="scientific"?"الوضع المبرمج":"الوضع العلمي"}</button></div>
   <div className="emad-calc-memory"><button onClick={()=>memoryAction("clear")}>MC</button><button onClick={()=>memoryAction("recall")}>MR</button><button onClick={()=>memoryAction("add")}>M+</button><button onClick={()=>memoryAction("subtract")}>M−</button></div>
   {mode==="scientific"&&<div className="emad-calc-keys">{keys.map((k,i)=><button key={k+i} className={["=","AC","⌫"].includes(k)?"emphasis":/[+\-×÷^]/.test(k)?"operator":""} onClick={()=>press(k)}>{k}</button>)}</div>}
   {mode==="programmer"&&<div className="emad-calc-conversions">{conversions().map(x=><div key={x.k}><b>{x.k}</b><span dir="ltr">{x.v}</span></div>)}<small>تحويل العدد الصحيح بين العشري والثنائي والثماني والسداسي عشري.</small></div>}
   <div className="emad-calc-history"><b>سجل العمليات</b>{history.slice(0,5).map((h,i)=><button key={h.at+i} onClick={()=>{setExpr(h.expression);setOut(h.result);}}><span dir="ltr">{h.expression}</span><strong dir="ltr">{h.result}</strong></button>)}</div>
   <footer className="emad-tools-note">الدوال: sin cos tan والعكسية والزائدية، الجذر، اللوغاريتم، الأسس، المضروب، الثوابت π و e، الذاكرة وسجل العمليات.</footer>
  </section>}
 </div>;
}
