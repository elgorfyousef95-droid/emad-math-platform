import React,{useMemo,useState} from "react";
import "./CurriculumPage.css";

const branches=[
 {id:"pure",name:"الرياضيات البحتة",subtitle:"الجبر والهندسة الفراغية · التفاضل والتكامل",icon:"∑",color:"pure",terms:[
  {id:"pure-t1",name:"الفصل الدراسي الأول",units:[
   {id:"binomial",name:"نظرية ذات الحدين",lessons:["نظرية ذات الحدين بأس صحيح موجب","إيجاد الحد المشتمل على س^ك من مفكوك ذات الحدين","النسبة بين حدين متتاليين من مفكوك ذات الحدين"]},
   {id:"complex",name:"الأعداد المركبة",lessons:["الصورة المثلثية للعدد المركب","نظرية ديموافر","الجذور التكعيبية للواحد الصحيح"]},
   {id:"geometry-3d",name:"الهندسة والقياس في بعدين وثلاثة أبعاد",lessons:["النظام الإحداثي المتعامد في ثلاثة أبعاد"]},
   {id:"space-lines",name:"الخطوط المستقيمة والمستويات في الفراغ",lessons:["الخطوط المستقيمة والمستويات في الفراغ"]}
  ]}
 ]},
 {id:"applied",name:"الرياضيات التطبيقية",subtitle:"الاستاتيكا · الديناميكا",icon:"⚙",color:"applied",terms:[
  {id:"applied-t1",name:"الفصل الدراسي الأول",units:[
   {id:"moments",name:"الوحدة الأولى: العزوم",lessons:["عزم قوة بالنسبة لنقطة في نظام إحداثي ثنائي الأبعاد"]},
   {id:"coplanar",name:"الوحدة الثانية: القوى المستوية",lessons:["محصلة القوى المتوازية المستوية","اتزان مجموعة من القوى المستوية"]},
   {id:"couples",name:"الوحدة الثالثة: الازدواجات",lessons:["الازدواجات","الازدواج المحصل"]},
   {id:"straight-motion",name:"الوحدة الأولى: الحركة في خط مستقيم",lessons:["تفاضل وتكامل الدوال المتجهة"]},
   {id:"newton",name:"الوحدة الثانية: تطبيقات على قوانين نيوتن للحركة",lessons:["حركة الأجسام متغيرة الكتلة أو العجلة","حركة الأجسام المتصلة","الدفع"]},
   {id:"work-energy",name:"الوحدة الثالثة: الشغل والطاقة والقدرة",lessons:["الشغل","الطاقة","القدرة"]}
  ]}
 ]}
];

const foundations=[
 "السطوح الملساء والسطوح الخشنة وقوة الاحتكاك",
 "الاحتكاك السكوني والاحتكاك الحركي ومعامل الاحتكاك",
 "زاوية الاحتكاك ورد الفعل المحصل",
 "اتزان جسم على مستوى أفقي خشن",
 "اتزان جسم على مستوى مائل خشن"
];

export default function CurriculumPage(){
 const [branchId,setBranchId]=useState("pure");
 const [expanded,setExpanded]=useState("binomial");
 const [search,setSearch]=useState("");
 const branch=branches.find(x=>x.id===branchId)||branches[0];
 const visibleTerms=useMemo(()=>branch.terms.map(term=>({...term,units:term.units.map(unit=>({...unit,lessons:unit.lessons.filter(lesson=>(unit.name+" "+lesson).toLowerCase().includes(search.trim().toLowerCase()))})).filter(unit=>unit.lessons.length||unit.name.toLowerCase().includes(search.trim().toLowerCase()))})).filter(term=>term.units.length),[branch,search]);
 const totalUnits=branch.terms.reduce((n,t)=>n+t.units.length,0);
 const totalLessons=branch.terms.reduce((n,t)=>n+t.units.reduce((m,u)=>m+u.lessons.length,0),0);
 return <main className="curriculum-page" dir="rtl">
  <section className="curriculum-hero">
   <div className="curriculum-hero-copy"><span className="curriculum-kicker">EMAD ACADEMY · LEARNING PATH</span><h1>المسار التعليمي</h1><p>خريطة منظمة لمنهج الصف الثالث الثانوي علمي رياضة؛ اختار الفرع، وافتح الوحدة، وابدأ من الدرس المناسب.</p><div className="curriculum-hero-meta"><span>العام الدراسي ٢٠٢٦–٢٠٢٧</span><span>الصف الثالث الثانوي · علمي رياضة</span></div></div>
   <div className="curriculum-hero-symbol">{branch.icon}</div>
  </section>
  <section className="curriculum-branch-switch" aria-label="اختيار فرع الرياضيات">
   {branches.map(item=><button key={item.id} type="button" className={branchId===item.id?"active "+item.color:item.color} onClick={()=>{setBranchId(item.id);setExpanded(item.terms[0].units[0].id);setSearch("");}}><span>{item.icon}</span><b>{item.name}</b><small>{item.subtitle}</small><i>{branchId===item.id?"الفرع الحالي":"عرض المنهج"}</i></button>)}
  </section>
  <section className="curriculum-overview">
   <div><small>الفرع المختار</small><b>{branch.name}</b></div><div><small>الوحدات في الفهرس الحالي</small><b>{totalUnits}</b></div><div><small>موضوعات الدروس</small><b>{totalLessons}</b></div>
  </section>
  <div className="curriculum-list-head"><div><span>CURRICULUM INDEX</span><h2>فهرس المنهج</h2><p>افتح أي وحدة لعرض الدروس التابعة لها.</p></div><label className="curriculum-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن وحدة أو درس..."/></label></div>
  {visibleTerms.length?visibleTerms.map(term=><section className="curriculum-term" key={term.id}><header><span>الفصل الدراسي</span><h3>{term.name}</h3><small>{term.units.length} وحدات ظاهرة</small></header><div className="curriculum-units">{term.units.map((unit,index)=><article className={expanded===unit.id?"curriculum-unit expanded":"curriculum-unit"} key={unit.id}><button type="button" className="curriculum-unit-toggle" onClick={()=>setExpanded(old=>old===unit.id?"":unit.id)} aria-expanded={expanded===unit.id}><span className="curriculum-unit-number">{String(index+1).padStart(2,"0")}</span><span className="curriculum-unit-copy"><b>{unit.name}</b><small>{unit.lessons.length} موضوعات دراسية</small></span><span className="curriculum-unit-chevron">{expanded===unit.id?"−":"＋"}</span></button>{expanded===unit.id?<div className="curriculum-lessons">{unit.lessons.map((lesson,i)=><div className="curriculum-lesson-row" key={lesson}><span>{String(i+1).padStart(2,"0")}</span><b>{lesson}</b><em>ضمن الفهرس</em></div>)}</div>:null}</article>)}</div></section>):<div className="curriculum-no-results">لا توجد نتائج مطابقة لعبارة البحث.</div>}
  {branchId==="applied"?<aside className="curriculum-foundations"><div><span>FOUNDATION REVIEW</span><h3>متطلبات قبلية تساعدك في الاستاتيكا</h3><p>مراجعة تمهيدية للمفاهيم التي تحتاجها قبل دراسة العزوم والقوى.</p></div><ul>{foundations.map(item=><li key={item}>{item}</li>)}</ul><small>هذه قائمة تأسيسية مساعدة، وليست وحدة إضافية في فهرس الامتحان.</small></aside>:null}
  <footer className="curriculum-source-note">الفهرس مبني على ترتيب موضوعات كتب الوزارة المتاحة للعام الدراسي ٢٠٢٦–٢٠٢٧. سيتم اعتماد بقية الفروع والفصول بعد مطابقة الفهارس الرسمية كاملة، ثم إضافة الشرح والأمثلة والتدريبات الأصلية لكل درس.</footer>
 </main>;
}
