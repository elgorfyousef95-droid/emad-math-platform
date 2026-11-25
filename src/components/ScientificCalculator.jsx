import React,{useMemo,useState} from "react";
import "./ScientificCalculator.css";

const KEYS=[
 ["SHIFT","shift"],["ALPHA","alpha"],["◀","left"],["▶","right"],["MODE","mode"],["2nd","second"],
 ["CALC","calc"],["∫dx","integral"],["x⁻¹","inv"],["logᵧx","logxy"],["√","sqrt"],["x²","square"],
 ["xʸ","power"],["log","log"],["ln","ln"],["sin","sin"],["cos","cos"],["tan","tan"],
 ["(","("],[")",")"],["7","7"],["8","8"],["9","9"],["⌫","back"],
 ["4","4"],["5","5"],["6","6"],["×","*"],["÷","/"],["AC","clear"],
 ["1","1"],["2","2"],["3","3"],["+","+"],["−","-"],["=","equals"],
 ["0","0"],[".","."],["EXP","exp"],["Ans","ans"],["π","pi"],["e","e"]
];
const SECOND=[
 ["FACTOR","factor"],["EXPAND","expand"],["SIMPLIFY","simplify"],["GRAPH","graph"],["d/dx","derivative"],["∫","integral"],
 ["r","r"],["u","u"],["x","x"],["{","{"],["}", "}"],[",",","],
 ["=","="],["<","<"],[">",">"],["True","true"],["→","arrow"],[":=","assign"],
 ["DET","det"],["RANK","rank"],["MATRIX","matrix"],["VECTOR","vector"],["nPr","npr"],["nCr","ncr"],
 ["STAT","stat"],["CMPLX","complex"],["DIST","dist"],["Pol","pol"],["Rec","rec"],["HISTORY","history"]
];
function factorial(n){if(!Number.isInteger(n)||n<0||n>170)throw Error("factorial");let v=1;for(let i=2;i<=n;i++)v*=i;return v;}
function calculate(raw,deg){
 let s=raw.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-").replace(/π/g,"Math.PI").replace(/\be\b/g,"Math.E").replace(/Ans/g,"0");
 s=s.replace(/(\d+(?:\.\d+)?)!/g,"factorial($1)");
 s=s.replace(/√\(/g,"Math.sqrt(").replace(/√(\d+(?:\.\d+)?)/g,"Math.sqrt($1)");
 s=s.replace(/(\d+(?:\.\d+)?)²/g,"($1**2)");
 s=s.replace(/(\d+(?:\.\d+)?)³/g,"($1**3)");
 s=s.replace(/sin\(/g,"sin(").replace(/cos\(/g,"cos(").replace(/tan\(/g,"tan(");
 s=s.replace(/log\(/g,"log10(").replace(/ln\(/g,"Math.log(");
 if(!/^[0-9+\-*/().,%\sA-Za-z_*]+$/.test(s))throw Error("syntax");
 const fn=new Function("sin","cos","tan","log10","factorial","return ("+s+");");
 const rad=x=>deg?x*Math.PI/180:x;
 const val=fn(x=>Math.sin(rad(x)),x=>Math.cos(rad(x)),x=>Math.tan(rad(x)),x=>Math.log10(x),factorial);
 if(!Number.isFinite(val))throw Error("math");
 return Number(Number(val).toPrecision(12));
}
export default function ScientificCalculator({onClose}){
 const [expr,setExpr]=useState(""),[result,setResult]=useState(""),[shift,setShift]=useState(false),[alpha,setAlpha]=useState(false),[second,setSecond]=useState(false),[deg,setDeg]=useState(true),[history,setHistory]=useState([]),[tab,setTab]=useState("basic"),[memory,setMemory]=useState(0);
 const append=v=>{setExpr(x=>x+v);setResult("");};
 const run=()=>{try{const v=calculate(expr,deg);setResult(String(v));setHistory(h=>[{expr,result:String(v)},...h].slice(0,20));}catch{setResult("صيغة غير صحيحة");}};
 const key=k=>{
  if(k==="shift"){setShift(x=>!x);return;}if(k==="alpha"){setAlpha(x=>!x);return;}if(k==="second"){setSecond(x=>!x);return;}
  if(k==="mode"){setTab(t=>t==="basic"?"advanced":"basic");return;}
  if(k==="clear"){setExpr("");setResult("");return;}if(k==="back"){setExpr(x=>x.slice(0,-1));return;}
  if(k==="equals"){run();return;}if(k==="left"){setExpr(x=>x.slice(0,-1));return;}if(k==="right"){append(" ");return;}
  if(k==="deg"){setDeg(x=>!x);return;}if(k==="pi"){append("π");return;}if(k==="e"){append("e");return;}
  if(k==="ans"){append(result||"0");return;}if(k==="exp"){append("*10^");return;}
  if(k==="sqrt"){append("√(");return;}if(k==="square"){append("²");return;}if(k==="power"){append("^");return;}
  if(k==="inv"){append("^-1");return;}if(k==="log"){append("log(");return;}if(k==="ln"){append("ln(");return;}
  if(["sin","cos","tan"].includes(k)){append(k+"(");return;}
  if(k==="factor"){try{setResult("تحليل: "+expr);}catch{}return;}
  if(k==="history"){setTab("history");return;}
  if(k==="mplus"){setMemory(m=>m+Number(result||0));return;}if(k==="mr"){append(String(memory));return;}
  append(k);
 };
 const shown=second?SECOND:KEYS;
 return <div className="scalc-overlay" dir="ltr" role="dialog" aria-label="Scientific calculator">
  <section className="scalc-device">
   <header className="scalc-top"><span>SCIENTIFIC · MATH</span><div><button onClick={()=>setDeg(x=>!x)}>{deg?"DEG":"RAD"}</button><button onClick={onClose} aria-label="Close calculator">×</button></div></header>
   <div className="scalc-screen"><small>{shift?"SHIFT ":""}{alpha?"ALPHA ":""}{deg?"DEG":"RAD"} · {tab.toUpperCase()}</small><div className="scalc-expression">{expr||" "}</div><strong>{result||" "}</strong></div>
   {tab==="history"?<div className="scalc-history"><h3>History</h3>{history.map((h,i)=><button key={i} onClick={()=>{setExpr(h.expr);setResult(h.result);setTab("basic");}}>{h.expr} = <b>{h.result}</b></button>)}{!history.length&&<p>No calculations yet</p>}</div>:<><div className="scalc-tools"><button onClick={()=>setSecond(x=>!x)}>{second?"1st":"2nd"}</button><button onClick={()=>setShift(x=>!x)}>SHIFT</button><button onClick={()=>setAlpha(x=>!x)}>ALPHA</button><button onClick={()=>setTab("history")}>History</button><button onClick={()=>setMemory(m=>m+Number(result||0))}>M+</button><button onClick={()=>append(String(memory))}>MR</button></div>
   <div className="scalc-keypad">{shown.map(([label,key],i)=><button key={i} className={["clear","equals","shift","alpha"].includes(key)?"accent":/^[0-9.]$/.test(key)?"number":""} onClick={()=>key==="="?run():key==="arrow"?append("→"):key==="assign"?append(":="):key==="true"?append("true"):key==="complex"?setTab("advanced"):key==="matrix"||key==="vector"||key==="det"||key==="rank"||key==="stat"||key==="dist"||key==="pol"||key==="rec"||key==="npr"||key==="ncr"?append(label+"("):key==="derivative"?append("d/dx("):key==="integral"?append("∫("):key==="graph"?setResult("أدخل دالة ثم استخدم وضع الرسم"):key==="expand"||key==="simplify"?setResult("أدخل التعبير أولًا"):key==="factor"?setResult("تحليل العوامل متاح للأعداد الصحيحة"):key==="r"||key==="u"||key==="x"||key==="{"||key==="}"||key===","||key==="="||key==="<"||key===">"?append(key):key==="exp"?append("*10^"):key==="mplus"?setMemory(m=>m+Number(result||0)):key==="clear"||key==="back"||key==="equals"||key==="shift"||key==="alpha"||key==="second"||key==="mode"||key==="history"||key==="left"||key==="right"||key==="pi"||key==="e"||key==="ans"||key==="sqrt"||key==="square"||key==="power"||key==="inv"||key==="log"||key==="ln"||key==="sin"||key==="cos"||key==="tan"?keyFn(key):keyFn(key)}>{label}</button>)}</div>
   <div className="scalc-bottom"><button onClick={()=>setExpr("")}>CLR</button><button onClick={()=>setExpr(x=>x+"!")}>x!</button><button onClick={()=>setDeg(x=>!x)}>{deg?"DEG":"RAD"}</button><button onClick={run}>=</button></div></>}
  </section>
 </div>;
 function keyFn(k){key(k);}
}
