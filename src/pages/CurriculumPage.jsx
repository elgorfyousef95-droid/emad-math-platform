import React,{useEffect,useMemo,useState} from "react";
import {studentApi} from "../lib/auth.js";
import "./CurriculumPage.css";

const branches=[
 {id:"pure",name:"الرياضيات البحتة",subtitle:"الجبر والهندسة الفراغية · التفاضل والتكامل",icon:"∑",color:"pure",terms:[
  {id:"pure-t1",name:"الفصل الدراسي الأول",units:[
   {id:"binomial",name:"نظرية ذات الحدين",lessons:["نظرية ذات الحدين بأس صحيح موجب","إيجاد الحد المشتمل على س^ك من مفكوك ذات الحدين","النسبة بين حدين متتاليين من مفكوك ذات الحدين"]},
   {id:"complex",name:"الأعداد المركبة",lessons:["الصورة المثلثية للعدد المركب","نظرية ديموافر","الجذور التكعيبية للواحد الصحيح"]},
   {id:"geometry-3d",name:"الهندسة والقياس في بعدين وثلاثة أبعاد",lessons:["النظام الإحداثي المتعامد في ثلاثة أبعاد","المتجهات في الفراغ","ضرب المتجهات"]},
   {id:"space-lines",name:"الخطوط المستقيمة والمستويات في الفراغ",lessons:["معادلة المستقيم في الفراغ","معادلة المستوى في الفراغ"]}
  ]},
  {id:"pure-t2",name:"الفصل الدراسي الثاني",units:[
   {id:"derivatives",name:"الوحدة الأولى: الاشتقاق وتطبيقاته",lessons:["متطلبات قبلية في التفاضل والتكامل","الاشتقاق الضمني والبارامتري","المشتقات العليا للدالة","مشتقات الدوال الأسية واللوغاريتمية","المعدلات الزمنية المرتبطة"]},
   {id:"function-behavior",name:"الوحدة الثانية: سلوك الدالة ورسم المنحنيات",lessons:["تزايد وتناقص الدوال","القيم العظمى والصغرى","دراسة المنحنيات","تطبيقات على القيم العظمى والصغرى"]},
   {id:"definite-integral",name:"الوحدة الثالثة: التكامل المحدد وتطبيقاته",lessons:["تكامل الدوال الأسية واللوغاريتمية","طرق التكامل","التكامل المحدد","تطبيقات على التكامل المحدد"]}
  ]}
 ]},
 {id:"applied",name:"الرياضيات التطبيقية",subtitle:"الاستاتيكا · الديناميكا",icon:"F",color:"applied",terms:[
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
 const [dbLessons,setDbLessons]=useState([]);
 const [selectedDbLesson,setSelectedDbLesson]=useState(null);
 const [dbLoading,setDbLoading]=useState(true);
 const [dbError,setDbError]=useState("");
 useEffect(()=>{let alive=true;(async()=>{try{const rows=await studentApi("emad_curriculum_content?select=id,branch,semester,unit_title,lesson_title,lesson_slug,sort_order,content,status&status=eq.published&order=sort_order.asc");if(alive)setDbLessons(rows||[]);}catch(e){if(alive)setDbError(e.message==="not_authenticated"?"سجّل الدخول لعرض محتوى المسار.":"تعذر تحميل الدروس من قاعدة البيانات.");}finally{if(alive)setDbLoading(false);}})();return()=>{alive=false;};},[]);
 const renderItems=(value)=>{if(!value)return null;const items=Array.isArray(value)?value:[value];return items.map((item,index)=>{const obj=typeof item==="object"&&item!==null?item:null;const heading=obj?(obj.title||obj.name||obj.question||""):null;const body=obj?(obj.body||obj.text||obj.explanation||obj.answer||obj.description||""):String(item);return <div className="curriculum-content-item" key={index}>{heading?<b>{heading}</b>:null}{body?<p>{body}</p>:null}{obj?.steps? <ol>{obj.steps.map((step,i)=><li key={i}>{typeof step==="string"?step:JSON.stringify(step)}</li>)}</ol>:null}</div>;});};
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

  <section className="curriculum-db-content">
   <div className="curriculum-db-heading"><span>LESSON LIBRARY · DATABASE</span><h2>الدروس التعليمية المنشورة</h2><p>المحتوى هنا يُحمّل مباشرة من قاعدة البيانات، ولا يظهر للطالب إلا إذا سمحت صلاحية اشتراكه بذلك.</p></div>
   {dbLoading?<div className="curriculum-db-state">جارٍ تحميل الدروس...</div>:dbError?<div className="curriculum-db-state">{dbError}</div>:dbLessons.length===0?<div className="curriculum-db-state">لا توجد دروس منشورة حاليًا. الفهرس بالأعلى خريطة تنظيمية فقط، وسيظهر الشرح هنا بعد إضافة الدروس واعتمادها.</div>:<div className="curriculum-db-grid">{dbLessons.filter(item=>item.branch===branchId).map(item=><button type="button" className={selectedDbLesson?.id===item.id?"curriculum-db-card selected":"curriculum-db-card"} key={item.id} onClick={()=>setSelectedDbLesson(item)}><small>{item.unit_title}</small><b>{item.lesson_title}</b><span>فتح الدرس ←</span></button>)}</div>}
   {selectedDbLesson&&selectedDbLesson.branch===branchId?<article className="curriculum-db-reader"><div className="curriculum-db-reader-head"><small>{selectedDbLesson.unit_title}</small><h3>{selectedDbLesson.lesson_title}</h3><button type="button" onClick={()=>setSelectedDbLesson(null)}>إغلاق</button></div>
    {Object.entries(selectedDbLesson.content||{}).map(([key,value])=><section className="curriculum-content-section" key={key}><h4>{{objectives:"أهداف الدرس",explanation_sections:"الشرح",laws:"القوانين",solved_examples:"أمثلة محلولة",exercises:"تدريبات",quiz:"اختبار قصير",summary:"ملخص الدرس"}[key]||key}</h4>{renderItems(value)}</section>)}
   </article>:null}
  </section>
  <footer className="curriculum-source-note">الفهرس مبني على ترتيب موضوعات كتب الوزارة المتاحة للعام الدراسي ٢٠٢٦–٢٠٢٧. سيتم اعتماد بقية الفروع والفصول بعد مطابقة الفهارس الرسمية كاملة، ثم إضافة الشرح والأمثلة والتدريبات الأصلية لكل درس.</footer>
 </main>;
}
