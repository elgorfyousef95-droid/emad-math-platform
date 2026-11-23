import React,{useEffect,useRef,useState} from "react";

export default function ExamRunner({exam,profile,studentApi,onClose}){
 const [attempt,setAttempt]=useState(null),[questions,setQuestions]=useState([]),[answers,setAnswers]=useState({}),[seconds,setSeconds]=useState(0),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[result,setResult]=useState(null);
 const submitting=useRef(false),submitRef=useRef(null);
 useEffect(()=>{
  let alive=true;
  (async()=>{
   setLoading(true);setError("");
   try{
    const existing=await studentApi("exam_attempts?select=id,started_at&exam_id=eq."+encodeURIComponent(exam.id)+"&student_id=eq."+encodeURIComponent(profile.id)+"&submitted_at=is.null&order=started_at.desc&limit=1");
    let current=existing&&existing[0];
    if(!current){
     const created=await studentApi("exam_attempts",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({exam_id:exam.id,student_id:profile.id})});
     current=Array.isArray(created)?created[0]:created;
    }
    if(!current?.id)throw new Error("attempt_create_failed");
    const [qs,savedAnswers]=await Promise.all([
     studentApi("exam_questions?select=id,question_type,prompt,choices,points,sort_order&exam_id=eq."+encodeURIComponent(exam.id)+"&order=sort_order.asc"),
     studentApi("exam_answers?select=question_id,answer&attempt_id=eq."+encodeURIComponent(current.id))
    ]);
    if(!alive)return;
    setAttempt(current);setQuestions(qs||[]);
    setAnswers(Object.fromEntries((savedAnswers||[]).map(row=>[row.question_id,row.answer])));
   }catch(e){if(alive)setError(e.message==="student_profile_required"?"لازم تدخل بحساب طالب مستقل.":e.message==="active_subscription_required"?"الامتحان متاح للطلاب أصحاب الاشتراك النشط أو التسجيل المعتمد.":"تعذر فتح الامتحان. تأكد من الاشتراك وموعد الامتحان.");}
   finally{if(alive)setLoading(false);}
  })();
  return()=>{alive=false;};
 },[exam.id,profile.id]);
 const submit=async()=>{
  if(submitting.current||!attempt)return;
  submitting.current=true;setSaving(true);setError("");
  try{
   const rows=questions.filter(q=>answers[q.id]!==undefined&&answers[q.id]!==""&&!(Array.isArray(answers[q.id])&&!answers[q.id].length)).map(q=>({attempt_id:attempt.id,question_id:q.id,answer:q.question_type==="multiple_choice"?(q.choices||[]).filter(option=>(answers[q.id]||[]).includes(option)):answers[q.id]}));
   if(rows.length)await studentApi("exam_answers?on_conflict=attempt_id,question_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows)});
   const submitted=await studentApi("rpc/submit_exam_attempt",{method:"POST",body:JSON.stringify({p_attempt_id:attempt.id})});
   setResult(submitted);
  }catch(e){setError(e.message==="attempt_already_submitted"?"الامتحان تم تسليمه بالفعل.":e.message==="exam_not_open"?"موعد الامتحان غير متاح الآن.":e.message==="active_subscription_required"?"الاشتراك غير نشط أو غير مرتبط بهذا الصف.":"تعذر تسليم الإجابات. حاول مرة أخرى قبل انتهاء الوقت.");submitting.current=false;}
  finally{setSaving(false);}
 };
 submitRef.current=submit;
 useEffect(()=>{
  if(!attempt||result)return;
  const update=()=>{
   const end=new Date(attempt.started_at).getTime()+Number(exam.duration_minutes||60)*60000;
   const remaining=Math.max(0,Math.ceil((end-Date.now())/1000));setSeconds(remaining);
   if(remaining===0&&submitRef.current)submitRef.current();
  };
  update();const timer=window.setInterval(update,1000);return()=>window.clearInterval(timer);
 },[attempt,result,exam.duration_minutes]);
 useEffect(()=>{
  if(!attempt||result)return;
  const warn=e=>{e.preventDefault();e.returnValue="";};
  window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);
 },[attempt,result]);
 const formatTime=value=>String(Math.floor(value/60)).padStart(2,"0")+":"+String(value%60).padStart(2,"0");
 const setAnswer=(id,value)=>{
  setAnswers(old=>({...old,[id]:value}));
  if(!attempt)return;
  const question=questions.find(q=>q.id===id);
  const stored=question?.question_type==="multiple_choice"?(question.choices||[]).filter(option=>(value||[]).includes(option)):value;
  studentApi("exam_answers?on_conflict=attempt_id,question_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({attempt_id:attempt.id,question_id:id,answer:stored})}).catch(()=>setError("تعذر حفظ إجابة واحدة. سيُعاد إرسال الإجابات عند التسليم."));
 };
 const total=questions.reduce((sum,q)=>sum+Number(q.points||0),0);
 return <div className="exam-runner-backdrop" dir="rtl"><section className="exam-runner-shell">
  <header className="exam-runner-header"><div><span>EMAD EXAM EXPERIENCE</span><h2>{exam.title}</h2><small>{profile.full_name} · {questions.length} سؤال · {exam.duration_minutes} دقيقة</small></div><div className={"exam-runner-clock "+(seconds<300?"urgent":"")}>{formatTime(seconds)}</div><button onClick={onClose} aria-label="إغلاق">×</button></header>
  {loading?<div className="exam-runner-state">جارٍ تجهيز ورقة الامتحان...</div>:error&&!attempt?<div className="exam-runner-state error">{error}<button onClick={onClose}>إغلاق</button></div>:result?<div className="exam-runner-result"><span>تم تسليم الامتحان</span><strong>{Number(result.score||0).toLocaleString("ar-EG")} / {Number(result.max_score||total).toLocaleString("ar-EG")}</strong><p>{result.manual_grading_required?"تم استلام إجاباتك، وبعض الأسئلة تحتاج مراجعة المدرس.":"تم التصحيح التلقائي واعتماد النتيجة."}</p><button onClick={onClose}>العودة للامتحانات</button></div>:<>
   {error&&<p className="exam-runner-inline-error">{error}</p>}
   <div className="exam-runner-instructions"><b>تعليمات الامتحان</b><span>الوقت يبدأ من فتح الامتحان. احفظ إجاباتك ثم اضغط تسليم قبل انتهاء الوقت.</span><span>الأسئلة المقالية والمسائل تُراجع بواسطة المدرس.</span></div>
   <div className="exam-runner-question-list">{questions.map((q,index)=>{
    const choices=Array.isArray(q.choices)?q.choices:[];
    return <article className="exam-runner-question" key={q.id}><div className="exam-runner-question-title"><span>السؤال {index+1}</span><small>{q.points} درجة</small></div><h3>{q.prompt}</h3>
     {q.question_type==="single_choice"||q.question_type==="true_false"?<div className="exam-runner-options">{(q.question_type==="true_false"?["صحيح","خطأ"]:choices).map(option=><label key={option}><input type="radio" name={q.id} checked={answers[q.id]===option} onChange={()=>setAnswer(q.id,option)}/><span>{option}</span></label>)}</div>:null}
     {q.question_type==="multiple_choice"?<div className="exam-runner-options">{choices.map(option=><label key={option}><input type="checkbox" checked={(answers[q.id]||[]).includes(option)} onChange={e=>setAnswer(q.id,e.target.checked?[...(answers[q.id]||[]),option]:(answers[q.id]||[]).filter(x=>x!==option))}/><span>{option}</span></label>)}</div>:null}
     {q.question_type==="short_answer"?<input className="exam-runner-short" value={answers[q.id]||""} onChange={e=>setAnswer(q.id,e.target.value)} placeholder="اكتب إجابتك هنا"/>:null}
     {q.question_type==="essay"?<textarea className="exam-runner-essay" rows="5" value={answers[q.id]||""} onChange={e=>setAnswer(q.id,e.target.value)} placeholder="اكتب الحل أو خطوات المسألة بالتفصيل..."/>:null}
    </article>;
   })}</div>
   <footer className="exam-runner-footer"><span>تمت الإجابة عن {Object.values(answers).filter(v=>v!==""&&(!Array.isArray(v)||v.length)).length} من {questions.length}</span><button disabled={saving||!questions.length} onClick={submit}>{saving?"جارٍ تسليم الإجابات...":"تسليم الامتحان"}</button></footer>
  </>}
 </section></div>;
}