import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  emadChatApi,
  getEmadChatAttachmentUrl,
  getEmadChatProfileCards,
  uploadEmadChatAttachment
} from "../lib/emadChat.js";
import "./ChatWorkspace.css";

const gradeLabels=["الصف الأول الثانوي","الصف الثاني الثانوي","الصف الثالث الثانوي"];
const dateLabel=value=>value?new Date(value).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}):"";
const shortDate=value=>value?new Date(value).toLocaleDateString("ar-EG",{day:"numeric",month:"short"}):"";
const initials=name=>(String(name||"؟").trim().split(/\s+/)[0]||"؟").slice(0,1);

export default function ChatWorkspace({profile,mode="groups",portal="student"}){
 const [conversations,setConversations]=useState([]);
 const [members,setMembers]=useState([]);
 const [profiles,setProfiles]=useState({});
 const [messages,setMessages]=useState([]);
 const [selectedId,setSelectedId]=useState("");
 const [draft,setDraft]=useState("");
 const [file,setFile]=useState(null);
 const [busy,setBusy]=useState(true);
 const [sending,setSending]=useState(false);
 const [error,setError]=useState("");
 const [filter,setFilter]=useState("");
 const [profileCard,setProfileCard]=useState(null);
 const [attachmentUrls,setAttachmentUrls]=useState({});
 const [pinBusy,setPinBusy]=useState(false);
 const bottomRef=useRef(null);
 const fileRef=useRef(null);
 const selected=conversations.find(c=>c.id===selectedId)||null;
 const isOwner=mode==="owner";
 const isSupport=mode==="support";
 const title=isOwner?"مركز التواصل وخدمة العملاء":isSupport?"خدمة العملاء":mode==="teacher"?"جروبات الطلاب":"الجروبات الدراسية";
 const myId=profile?.id;

 const loadConversations=useCallback(async()=>{
  if(!myId)return;
  try{
   let path="emad_conversations?select=id,kind,title,grade,created_by,updated_at,created_at,is_active&is_active=eq.true&order=updated_at.desc&limit=250";
   if(isSupport)path+="&kind=eq.support&created_by=eq."+encodeURIComponent(myId);
   else if(mode==="teacher")path+="&kind=eq.grade_group";
   else if(mode==="groups")path+="&kind=eq.grade_group";
   else if(isOwner)path+="&kind=in.(grade_group,support)";
   let rows=await emadChatApi(portal,path);
   if(isSupport&&!rows.length){
    await emadChatApi(portal,"emad_conversations",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({kind:"support",title:"خدمة العملاء — "+(profile.full_name||"طالب"),created_by:myId})});
    rows=await emadChatApi(portal,"emad_conversations?select=id,kind,title,grade,created_by,updated_at,created_at,is_active&kind=eq.support&created_by=eq."+encodeURIComponent(myId)+"&is_active=eq.true&limit=1");
   }
   const ids=(rows||[]).map(x=>x.id);
   let memberRows=[];
   if(ids.length)memberRows=await emadChatApi(portal,"emad_conversation_members?select=id,conversation_id,user_id,member_role,is_pinned,pinned_at,last_read_at,left_at&conversation_id=in.("+ids.join(",")+")&left_at=is.null");
   const personIds=[...new Set([...(rows||[]).map(x=>x.created_by),...(memberRows||[]).map(x=>x.user_id)].filter(Boolean))];
   const cards=await getEmadChatProfileCards(portal,personIds);
   const map=Object.fromEntries((cards||[]).map(p=>[p.id,p]));
   setProfiles(old=>({...old,...map}));
   setMembers(memberRows||[]);
   const sorted=[...(rows||[])].sort((a,b)=>{
    if(isOwner&&a.kind==="support"&&b.kind==="support"){
     const ap=memberRows.some(m=>m.conversation_id===a.id&&m.user_id===myId&&m.is_pinned);
     const bp=memberRows.some(m=>m.conversation_id===b.id&&m.user_id===myId&&m.is_pinned);
     if(ap!==bp)return ap?-1:1;
    }
    return new Date(b.updated_at||b.created_at)-new Date(a.updated_at||a.created_at);
   });
   setConversations(sorted);
   if(isSupport&&sorted[0]&&selectedId!==sorted[0].id)setSelectedId(sorted[0].id);
   if(!selectedId&&sorted[0])setSelectedId(sorted[0].id);
   if(selectedId&&!sorted.some(c=>c.id===selectedId)&&sorted[0])setSelectedId(sorted[0].id);
   setError("");
  }catch(e){console.error("emad_chat_conversations",e);setError("تعذر تحميل المحادثات. تأكد من تسجيل الدخول واتصال المنصة.");}
  finally{setBusy(false);}
 },[myId,portal,mode,isSupport,isOwner,profile?.full_name,selectedId]);

 const loadMessages=useCallback(async()=>{
  if(!selectedId)return;
  try{
   const rows=await emadChatApi(portal,"emad_messages?select=id,conversation_id,sender_id,message_type,body,attachment_path,attachment_name,attachment_mime,attachment_size,reply_to,created_at,edited_at&conversation_id=eq."+encodeURIComponent(selectedId)+"&deleted_at=is.null&order=created_at.asc&limit=150");
   setMessages(rows||[]);
   const ids=[...new Set((rows||[]).map(m=>m.sender_id).filter(Boolean))];
   const cards=await getEmadChatProfileCards(portal,ids);
   setProfiles(old=>({...old,...Object.fromEntries((cards||[]).map(p=>[p.id,p]))}));
   const pending=(rows||[]).filter(m=>m.attachment_path&&!attachmentUrls[m.id]);
   if(pending.length){
    const pairs=await Promise.all(pending.map(async m=>{try{return [m.id,await getEmadChatAttachmentUrl(portal,m.attachment_path)];}catch{return [m.id,""];}}));
    setAttachmentUrls(old=>({...old,...Object.fromEntries(pairs)}));
   }
   if(myId){
    const now=new Date().toISOString();
    await emadChatApi(portal,"emad_conversation_members?conversation_id=eq."+encodeURIComponent(selectedId)+"&user_id=eq."+encodeURIComponent(myId),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({last_read_at:now})}).catch(()=>{});
    const unseen=(rows||[]).filter(m=>m.sender_id!==myId).map(m=>m.id);
    if(unseen.length)await emadChatApi(portal,"emad_message_receipts?user_id=eq."+encodeURIComponent(myId)+"&message_id=in.("+unseen.join(",")+")&read_at=is.null",{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({read_at:now})}).catch(()=>{});
   }
   bottomRef.current?.scrollIntoView({behavior:"smooth",block:"end"});
  }catch(e){console.error("emad_chat_messages",e);setError("تعذر تحميل رسائل المحادثة.");}
 },[selectedId,portal,myId,attachmentUrls]);

 useEffect(()=>{loadConversations();},[loadConversations]);
 useEffect(()=>{setMessages([]);setAttachmentUrls({});loadMessages();},[selectedId]);
 useEffect(()=>{
  if(!myId)return;
  const timer=window.setInterval(()=>{loadConversations();if(selectedId)loadMessages();},4000);
  return()=>window.clearInterval(timer);
 },[myId,selectedId,loadConversations,loadMessages]);

 const send=async()=>{
  const text=draft.trim();
  if((!text&&!file)||!selectedId||sending)return;
  setSending(true);setError("");
  try{
   let attachment=null;
   if(file)attachment=await uploadEmadChatAttachment(portal,selectedId,file);
   const body={conversation_id:selectedId,sender_id:myId,message_type:attachment?(attachment.mime.startsWith("image/")?"image":"file"):"text",body:text,attachment_path:attachment?.path||null,attachment_name:attachment?.name||null,attachment_mime:attachment?.mime||null,attachment_size:attachment?.size||null};
   await emadChatApi(portal,"emad_messages",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(body)});
   setDraft("");setFile(null);if(fileRef.current)fileRef.current.value="";
   await loadMessages();await loadConversations();
  }catch(e){console.error("emad_chat_send",e);setError(e.message==="attachment_too_large"?"حجم الملف أكبر من 15 ميجابايت.":e.message==="unsupported_attachment"?"نوع الملف غير مسموح.":"تعذر إرسال الرسالة. حاول مرة أخرى.");}
  finally{setSending(false);}
 };

 const togglePin=async()=>{
  const row=members.find(m=>m.conversation_id===selectedId&&m.user_id===myId);
  if(!row||!isOwner)return;
  setPinBusy(true);
  try{
   const next=!row.is_pinned;
   await emadChatApi(portal,"emad_conversation_members?id=eq."+encodeURIComponent(row.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({is_pinned:next,pinned_at:next?new Date().toISOString():null})});
   setMembers(old=>old.map(m=>m.id===row.id?{...m,is_pinned:next}:m));
   await loadConversations();
  }catch(e){setError("تعذر تثبيت المحادثة.");}
  finally{setPinBusy(false);}
 };

 const visibleConversations=useMemo(()=>conversations.filter(c=>{
  const person=profiles[c.created_by];
  return [c.title,c.grade,person?.full_name,person?.student_number].join(" ").toLowerCase().includes(filter.toLowerCase());
 }),[conversations,profiles,filter]);
 const selectedMember=members.find(m=>m.conversation_id===selectedId&&m.user_id===myId);
 const openProfile=async(id)=>{
  let person=profiles[id];
  if(!person){try{const cards=await getEmadChatProfileCards(portal,[id]);person=cards?.[0];if(person)setProfiles(old=>({...old,[id]:person}));}catch{}}
  if(person)setProfileCard(person);
 };

 return <section className="emad-chat-page" dir="rtl">
  <header className="emad-chat-hero"><div className="emad-chat-hero-mark">✦</div><div><span>EMAD EL SANAFIRY · SECURE MESSAGING</span><h1>{title}</h1><p>{isOwner?"كل محادثات الطلاب والجروبات في مركز واحد.":isSupport?"محادثة خاصة ومستمرة مع خدمة العملاء.":"تواصل منظم مع زملائك والمدرس داخل جروب الصف."}</p></div><div className="emad-chat-status"><i/> متصل بقاعدة البيانات</div></header>
  {error&&<div className="emad-chat-error" role="alert">{error}</div>}
  <div className="emad-chat-layout">
   <aside className="emad-chat-sidebar">
    <div className="emad-chat-sidebar-head"><b>{isOwner?"المحادثات والجروبات":"المحادثات"}</b><small>{visibleConversations.length} مساحة</small></div>
    <input className="emad-chat-search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="ابحث في المحادثات..."/>
    {busy?<div className="emad-chat-empty">جارٍ تحميل المحادثات...</div>:visibleConversations.map(c=>{
      const person=profiles[c.created_by];
      const pinned=members.some(m=>m.conversation_id===c.id&&m.user_id===myId&&m.is_pinned);
      const count=members.filter(m=>m.conversation_id===c.id).length;
      const latest=messages.find(m=>m.conversation_id===c.id);
      return <button key={c.id} className={"emad-chat-conversation "+(selectedId===c.id?"active":"")} onClick={()=>setSelectedId(c.id)}>
       <span className={"emad-chat-conv-avatar "+(c.kind==="support"?"support":"group")}>{c.kind==="support"?(person?.avatar_url?<img src={person.avatar_url} alt=""/>:initials(person?.full_name||c.title)):"#"}</span>
       <span className="emad-chat-conv-copy"><b>{c.kind==="support"?(person?.full_name||c.title):c.title}</b><small>{c.kind==="support"?"خدمة العملاء · "+(person?.student_number||"حساب طالب"):(c.grade||"جروب دراسي")+" · "+count+" أعضاء"}</small></span>
       <span className="emad-chat-conv-meta">{pinned?<i title="مثبت">★</i>:null}<small>{shortDate(c.updated_at||c.created_at)}</small></span>
      </button>;
    })}
    {!busy&&!visibleConversations.length?<div className="emad-chat-empty">{isOwner?"لا توجد محادثات أو جروبات حتى الآن.":"لا توجد محادثات متاحة لحسابك."}</div>:null}
    {isOwner?<div className="emad-chat-sidebar-note">محادثات خدمة العملاء خاصة بينك وبين كل طالب. تقدر تثبت المحادثات المهمة.</div>:null}
   </aside>
   <section className="emad-chat-thread">
    {selected?<>
     <header className="emad-chat-thread-head">
      <div className="emad-chat-thread-title"><span className={"emad-chat-conv-avatar "+(selected.kind==="support"?"support":"group")}>{selected.kind==="support"?(profiles[selected.created_by]?.avatar_url?<img src={profiles[selected.created_by].avatar_url} alt=""/>:initials(profiles[selected.created_by]?.full_name||selected.title)):"#"}</span><div><b>{selected.kind==="support"?(profiles[selected.created_by]?.full_name||selected.title):selected.title}</b><small>{selected.kind==="support"?"محادثة خاصة مع خدمة العملاء":selected.grade+" · مجموعة الصف"}</small></div></div>
      <div className="emad-chat-thread-actions">{isOwner&&selected.kind==="support"?<button onClick={togglePin} disabled={pinBusy}>{selectedMember?.is_pinned?"إلغاء التثبيت":"تثبيت المحادثة"}</button>:null}<span>{members.filter(m=>m.conversation_id===selectedId).length} أعضاء</span></div>
     </header>
     {selected.kind==="grade_group"?<div className="emad-chat-roster"><span>الأعضاء:</span>{members.filter(m=>m.conversation_id===selectedId).slice(0,18).map(m=>{const p=profiles[m.user_id];return <button key={m.user_id} title={p?.full_name||"عضو"} onClick={()=>openProfile(m.user_id)}>{p?.avatar_url?<img src={p.avatar_url} alt=""/>:initials(p?.full_name)}</button>;})}</div>:null}
     <div className="emad-chat-message-list">
      {!messages.length?<div className="emad-chat-empty large">{selected.kind==="support"?"اكتب رسالتك الأولى، وسيظهر رد خدمة العملاء هنا.":"ابدأ النقاش مع أعضاء الجروب."}</div>:messages.map(message=>{
       const sender=profiles[message.sender_id]||{};
       const mine=message.sender_id===myId;
       const url=attachmentUrls[message.id];
       return <article key={message.id} className={"emad-chat-message "+(mine?"mine":"")}>
        {!mine?<button className="emad-chat-message-avatar" onClick={()=>openProfile(message.sender_id)}>{sender.avatar_url?<img src={sender.avatar_url} alt=""/>:initials(sender.full_name)}</button>:null}
        <div className="emad-chat-message-body">
         {!mine?<button className="emad-chat-sender" onClick={()=>openProfile(message.sender_id)}>{sender.full_name||"عضو"}{sender.is_verified?<i>✓</i>:null}</button>:null}
         <div className="emad-chat-bubble">
          {message.body?<p>{message.body}</p>:null}
          {message.attachment_path&&url?(message.message_type==="image"?<a href={url} target="_blank" rel="noreferrer"><img className="emad-chat-attachment-image" src={url} alt={message.attachment_name||"صورة مرفقة"}/></a>:<a className="emad-chat-file" href={url} target="_blank" rel="noreferrer">📎 {message.attachment_name||"ملف مرفق"} <small>فتح الملف</small></a>):null}
         </div>
         <small className="emad-chat-time">{dateLabel(message.created_at)}{mine?" · تم الإرسال":""}</small>
        </div>
       </article>;
      })}
      <div ref={bottomRef}/>
     </div>
     <div className="emad-chat-composer">
      {file?<div className="emad-chat-file-chip"><span>{file.name}</span><button onClick={()=>{setFile(null);if(fileRef.current)fileRef.current.value="";}}>×</button></div>:null}
      <textarea value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} rows={2} placeholder="اكتب رسالتك هنا..."/>
      <div className="emad-chat-compose-actions"><label className="emad-chat-attach">＋ إرفاق صورة أو ملف<input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><small>الحد الأقصى 15 ميجابايت</small><button onClick={send} disabled={sending||(!draft.trim()&&!file)}>{sending?"جارٍ الإرسال...":"إرسال الرسالة"} <span>➤</span></button></div>
     </div>
    </>:<div className="emad-chat-empty large">اختار محادثة من القائمة لبدء التواصل.</div>}
   </section>
  </div>
  {profileCard?<div className="emad-chat-profile-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setProfileCard(null);}}><section className="emad-chat-profile-card"><button className="emad-chat-profile-close" onClick={()=>setProfileCard(null)}>×</button><div className="emad-chat-profile-cover"/><div className="emad-chat-profile-avatar">{profileCard.avatar_url?<img src={profileCard.avatar_url} alt=""/>:initials(profileCard.full_name)}</div><h2>{profileCard.full_name||"عضو المنصة"} {profileCard.is_verified?<i>✓</i>:null}</h2><span className="emad-chat-profile-role">{({owner:"مالك المنصة",admin:"إدارة",teacher:"المدرس",student:"طالب"})[profileCard.role]||"عضو"}</span><dl><div><dt>رقم الحساب</dt><dd>{profileCard.student_number||"حساب إداري"}</dd></div><div><dt>الصف الدراسي</dt><dd>{profileCard.grade||"—"}</dd></div><div><dt>المجموعة</dt><dd>{profileCard.group_name||"—"}</dd></div></dl><p>يتم عرض بيانات الملف الأساسية فقط حفاظًا على خصوصية أرقام الهاتف وبيانات ولي الأمر.</p></section></div>:null}
 </section>;
}
