import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  emadChatApi,
  getEmadChatAttachmentUrl,
  getEmadChatProfileCards,
  uploadEmadChatAttachment
} from "../lib/emadChat.js";
import "./ChatWorkspace.css";
import "./ChatWorkspacePro.css";

const gradeLabels=["الصف الأول الثانوي","الصف الثاني الثانوي","الصف الثالث الثانوي"];
const dateLabel=value=>value?new Date(value).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}):"";
const shortDate=value=>value?new Date(value).toLocaleDateString("ar-EG",{day:"numeric",month:"short"}):"";
const initials=name=>(String(name||"؟").trim().split(/\s+/)[0]||"؟").slice(0,1);

export default function ChatWorkspace({profile,mode="groups",portal="student"}){
 const [conversations,setConversations]=useState([]);
 const [lastMessages,setLastMessages]=useState({});
 const [newChatStudentId,setNewChatStudentId]=useState("");
 const [creatingChat,setCreatingChat]=useState(false);
 const [conversationTab,setConversationTab]=useState("all");
 const [groupForm,setGroupForm]=useState({title:"",grade:gradeLabels[2],description:""});
 const [creatingGroup,setCreatingGroup]=useState(false);
 const [groupInfoOpen,setGroupInfoOpen]=useState(false);
 const [messageSearch,setMessageSearch]=useState("");
 const [replyTarget,setReplyTarget]=useState(null);
 const [editingMessageId,setEditingMessageId]=useState("");
 const [reactions,setReactions]=useState({});
 const [reactionMenu,setReactionMenu]=useState("");

 const [members,setMembers]=useState([]);
 const [profiles,setProfiles]=useState({});
 const [messages,setMessages]=useState([]);
 const [receiptSummary,setReceiptSummary]=useState({});
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
 const [availableStudents,setAvailableStudents]=useState([]);
 const [addStudentId,setAddStudentId]=useState("");
 const [memberBusy,setMemberBusy]=useState(false);
 const [recording,setRecording]=useState(false);
 const [mobileView,setMobileView]=useState("list");
 const recorderRef=useRef(null);
 const streamRef=useRef(null);
 const bottomRef=useRef(null);
 const messageListRef=useRef(null);
 const stickToBottom=useRef(true);
 const fileRef=useRef(null);
 const selected=conversations.find(c=>c.id===selectedId)||null;
 const isOwner=mode==="owner";
 const isManager=isOwner||mode==="teacher"||mode==="teacher_support";
 const isSupport=mode==="support"||mode==="teacher_support";
 const title=isOwner?"مركز التواصل وخدمة العملاء":mode==="teacher_support"?"مراسلات الطلاب":isSupport?"خدمة العملاء":mode==="teacher"?"جروبات الطلاب":"الجروبات الدراسية";
 const myId=profile?.id;

 const loadConversations=useCallback(async()=>{
  if(!myId)return;
  try{
   let path="emad_conversations?select=id,kind,title,grade,created_by,updated_at,created_at,is_active&is_active=eq.true&order=updated_at.desc&limit=80";
   if(isSupport){path+="&kind=eq.support";if(mode==="support")path+="&created_by=eq."+encodeURIComponent(myId);}
   else if(mode==="teacher")path+="&kind=eq.grade_group";
   else if(mode==="groups")path+="&kind=eq.grade_group";
   else if(isOwner)path+="&kind=in.(grade_group,support)";
   let rows=await emadChatApi(portal,path);
   if(mode==="support"&&!rows.length){
    await emadChatApi(portal,"emad_conversations",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({kind:"support",title:"خدمة العملاء — "+(profile.full_name||"طالب"),created_by:myId})});
    rows=await emadChatApi(portal,"emad_conversations?select=id,kind,title,grade,created_by,updated_at,created_at,is_active&kind=eq.support&created_by=eq."+encodeURIComponent(myId)+"&is_active=eq.true&limit=1");
   }
   const ids=(rows||[]).map(x=>x.id);
   let memberRows=[];
   if(ids.length)memberRows=await emadChatApi(portal,"emad_conversation_members?select=id,conversation_id,user_id,member_role,is_pinned,pinned_at,last_read_at,left_at&conversation_id=in.("+ids.join(",")+")&left_at=is.null");
   if(mode==="teacher_support"&&ids.length){
    const joined=new Set((memberRows||[]).filter(m=>m.user_id===myId).map(m=>m.conversation_id));
    const missing=(rows||[]).filter(conversation=>!joined.has(conversation.id));
    await Promise.all(missing.map(conversation=>emadChatApi(portal,"emad_conversation_members",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({conversation_id:conversation.id,user_id:myId,member_role:"teacher"})}).catch(error=>console.warn("teacher_support_join",error))));
    memberRows=await emadChatApi(portal,"emad_conversation_members?select=id,conversation_id,user_id,member_role,is_pinned,pinned_at,last_read_at,left_at&conversation_id=in.("+ids.join(",")+")&left_at=is.null");
   }
   const personIds=[...new Set([...(rows||[]).map(x=>x.created_by),...(memberRows||[]).map(x=>x.user_id)].filter(Boolean))];
   const cards=await getEmadChatProfileCards(portal,personIds);
   const map=Object.fromEntries((cards||[]).map(p=>[p.id,p]));
   setProfiles(old=>({...old,...map}));
   setMembers(memberRows||[]);
   const previewRows=ids.length?await emadChatApi(portal,"emad_messages?select=id,conversation_id,sender_id,message_type,body,attachment_name,created_at&conversation_id=in.("+ids.join(",")+")&deleted_at=is.null&order=created_at.desc&limit=500"):[];
   const previewMap={};
   for(const message of previewRows||[])if(!previewMap[message.conversation_id])previewMap[message.conversation_id]=message;
   setLastMessages(previewMap);
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

 const loadStudentsForGroup=useCallback(async()=>{
  if(mode==="teacher_support"){
   try{const rows=await emadChatApi(portal,"rpc/emad_teacher_student_directory",{method:"POST",body:"{}"});setAvailableStudents(rows||[]);}catch(e){setAvailableStudents([]);console.warn("teacher_direct_chat_students",e);}
   return;
  }
  if(mode!=="teacher"||!selected||selected.kind!=="grade_group"){setAvailableStudents([]);return;}
  try{
   const rows=await emadChatApi(portal,"profiles?select=id,full_name,student_number,grade,role&role=eq.student&grade=eq."+encodeURIComponent(selected.grade)+"&limit=500");
   const current=new Set(members.filter(m=>m.conversation_id===selectedId&&m.left_at===null).map(m=>m.user_id));
   setAvailableStudents((rows||[]).filter(p=>!current.has(p.id)));
  }catch(e){setAvailableStudents([]);console.warn("teacher_group_students",e);}
 },[mode,portal,selected?.id,selected?.grade,selectedId,members]);

 const loadMessages=useCallback(async()=>{
  if(!selectedId)return;
  try{
   const rows=await emadChatApi(portal,"emad_messages?select=id,conversation_id,sender_id,message_type,body,attachment_path,attachment_name,attachment_mime,attachment_size,reply_to,created_at,edited_at&conversation_id=eq."+encodeURIComponent(selectedId)+"&deleted_at=is.null&order=created_at.asc&limit=150");
   setMessages(rows||[]);
   if((rows||[]).length){
    try{const reactionRows=await emadChatApi(portal,"emad_chat_message_reactions?select=id,message_id,user_id,reaction&message_id=in.("+rows.map(m=>m.id).join(",")+")");const grouped={};for(const item of reactionRows||[]){(grouped[item.message_id]||=[]).push(item);}setReactions(grouped);}
    catch(reactionError){console.warn("chat_reactions_load",reactionError);setReactions({});}
   }else setReactions({});

   const ownMessageIds=(rows||[]).filter(m=>m.sender_id===myId).map(m=>m.id);
   if(ownMessageIds.length){
    try{
     const receiptRows=await emadChatApi(portal,"emad_message_receipts?select=message_id,user_id,read_at&message_id=in.("+ownMessageIds.join(",")+")");
     const summary={};
     for(const receipt of receiptRows||[]){
      const item=summary[receipt.message_id]||{delivered:0,read:0};
      item.delivered+=1;
      if(receipt.read_at)item.read+=1;
      summary[receipt.message_id]=item;
     }
     setReceiptSummary(summary);
    }catch(receiptError){console.warn("emad_chat_receipts",receiptError);setReceiptSummary({});}
   }else setReceiptSummary({});
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
    const unseen=(rows||[]).filter(m=>m.sender_id!==myId).map(m=>m.id);
    if(unseen.length){
     await emadChatApi(portal,"emad_conversation_members?conversation_id=eq."+encodeURIComponent(selectedId)+"&user_id=eq."+encodeURIComponent(myId),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({last_read_at:now})}).catch(()=>{});
     await emadChatApi(portal,"emad_message_receipts?user_id=eq."+encodeURIComponent(myId)+"&message_id=in.("+unseen.join(",")+")&read_at=is.null",{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({read_at:now})}).catch(()=>{});
    }
   }
  }catch(e){console.error("emad_chat_messages",e);setError("تعذر تحميل رسائل المحادثة.");}
 },[selectedId,portal,myId,attachmentUrls]);

 useEffect(()=>{loadConversations();},[loadConversations]);
 useEffect(()=>{setMessages([]);setAttachmentUrls({});setReceiptSummary({});loadMessages();},[selectedId]);
 useEffect(()=>{loadStudentsForGroup();},[loadStudentsForGroup]);
 useEffect(()=>{
  if(!myId)return;
  const conversationTimer=window.setInterval(loadConversations,12000);
  const messageTimer=window.setInterval(()=>{if(selectedId)loadMessages();},4000);
  return()=>{window.clearInterval(conversationTimer);window.clearInterval(messageTimer);};
 },[myId,selectedId,loadConversations,loadMessages]);
 useEffect(()=>{
  if(stickToBottom.current)bottomRef.current?.scrollIntoView({behavior:"smooth",block:"end"});
 },[messages]);

 const send=async()=>{
  const text=draft.trim();
  if(editingMessageId){
   if(!text){setError("اكتب نص الرسالة قبل حفظ التعديل.");return;}
   setSending(true);setError("");
   try{await emadChatApi(portal,"emad_messages?id=eq."+encodeURIComponent(editingMessageId),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({body:text,edited_at:new Date().toISOString()})});setDraft("");setEditingMessageId("");await loadMessages();await loadConversations();}
   catch(e){setError("تعذر تعديل الرسالة.");}finally{setSending(false);}return;
  }
  if((!text&&!file)||!selectedId||sending)return;
  setSending(true);setError("");
  try{
   let attachment=null;if(file)attachment=await uploadEmadChatAttachment(portal,selectedId,file);
   const body={conversation_id:selectedId,sender_id:myId,message_type:attachment?(attachment.mime.startsWith("image/")?"image":attachment.mime.startsWith("audio/")?"audio":"file"):"text",body:text,attachment_path:attachment?.path||null,attachment_name:attachment?.name||null,attachment_mime:attachment?.mime||null,attachment_size:attachment?.size||null,reply_to:replyTarget?.id||null};
   await emadChatApi(portal,"emad_messages",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(body)});
   setDraft("");setFile(null);setReplyTarget(null);if(fileRef.current)fileRef.current.value="";
   await loadMessages();await loadConversations();
  }catch(e){console.error("emad_chat_send",e);setError(e.message==="attachment_too_large"?"حجم الملف أكبر من 15 ميجابايت.":e.message==="unsupported_attachment"?"نوع الملف غير مسموح.":"تعذر إرسال الرسالة. حاول مرة أخرى.");}
  finally{setSending(false);}
 };
 
 const startVoiceRecording=async()=>{
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){setError("تسجيل الصوت غير مدعوم في هذا المتصفح.");return;}
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});streamRef.current=stream;
   const preferred=["audio/webm;codecs=opus","audio/ogg;codecs=opus","audio/mp4"].find(type=>MediaRecorder.isTypeSupported?.(type));
   const recorder=new MediaRecorder(stream,preferred?{mimeType:preferred}:undefined);recorderRef.current=recorder;const chunks=[];
   recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
   recorder.onerror=()=>setError("تعذر تسجيل الرسالة الصوتية.");
   recorder.onstop=()=>{const type=recorder.mimeType||"audio/webm";const ext=type.includes("ogg")?"ogg":type.includes("mp4")?"m4a":"webm";const voice=new File(chunks,"voice-note-"+Date.now()+"."+ext,{type});if(voice.size>15*1024*1024){setError("التسجيل أكبر من الحد المسموح 15 ميجابايت.");}else{setFile(voice);setError("");}stream.getTracks().forEach(track=>track.stop());streamRef.current=null;setRecording(false);};
   recorder.start(250);setRecording(true);setError("");
  }catch(e){setError(e.name==="NotAllowedError"?"اسمح باستخدام الميكروفون لتسجيل رسالة صوتية.":"تعذر تشغيل الميكروفون.");}
 };
 const stopVoiceRecording=()=>{if(recorderRef.current?.state==="recording")recorderRef.current.stop();};
 useEffect(()=>()=>{if(recorderRef.current?.state==="recording")recorderRef.current.stop();streamRef.current?.getTracks().forEach(track=>track.stop());},[]);

 const togglePin=async()=>{
  const row=members.find(m=>m.conversation_id===selectedId&&m.user_id===myId);
  if(!row||!isManager)return;
  setPinBusy(true);
  try{
   const next=!row.is_pinned;
   await emadChatApi(portal,"emad_conversation_members?id=eq."+encodeURIComponent(row.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({is_pinned:next,pinned_at:next?new Date().toISOString():null})});
   setMembers(old=>old.map(m=>m.id===row.id?{...m,is_pinned:next}:m));
   await loadConversations();
  }catch(e){setError("تعذر تثبيت المحادثة.");}
  finally{setPinBusy(false);}
 };

 const removeMember=async(userId)=>{
  if(!isManager||!selectedId||userId===myId)return;
  const target=members.find(m=>m.conversation_id===selectedId&&m.user_id===userId);
  if(mode==="teacher"&&target?.member_role!=="student")return;
  if(!window.confirm("إزالة هذا الحساب من جروب الصف؟"))return;
  try{
   await emadChatApi(portal,"emad_conversation_members?conversation_id=eq."+encodeURIComponent(selectedId)+"&user_id=eq."+encodeURIComponent(userId),{method:"DELETE",headers:{Prefer:"return=minimal"}});
   await loadConversations();
  }catch(e){setError("تعذر إزالة العضو من الجروب.");}
 };
 const deleteMessage=async(messageId)=>{
  if(!isManager)return;
  if(!window.confirm("حذف الرسالة من المحادثة؟"))return;
  try{
   await emadChatApi(portal,"emad_messages?id=eq."+encodeURIComponent(messageId),{method:"DELETE",headers:{Prefer:"return=minimal"}});
   await loadMessages();
  }catch(e){setError("تعذر حذف الرسالة.");}
 };

 const visibleConversations=useMemo(()=>conversations.filter(c=>{
  const person=profiles[c.created_by];
  const textMatch=[c.title,c.grade,person?.full_name,person?.student_number].join(" ").toLowerCase().includes(filter.toLowerCase());
  const latest=lastMessages[c.id];
  const member=members.find(m=>m.conversation_id===c.id&&m.user_id===myId);
  const unread=!!latest&&latest.sender_id!==myId&&(!member?.last_read_at||new Date(latest.created_at)>new Date(member.last_read_at));
  return textMatch&&(conversationTab==="all"||unread);
 }),[conversations,profiles,filter,lastMessages,members,myId,conversationTab]);
 const selectedMember=members.find(m=>m.conversation_id===selectedId&&m.user_id===myId);
 const startDirectChat=async()=>{
  if(mode!=="teacher_support"||!newChatStudentId||creatingChat)return;
  const student=availableStudents.find(item=>item.id===newChatStudentId);
  if(!student)return;
  setCreatingChat(true);setError("");
  try{
   const existing=conversations.find(item=>item.kind==="support"&&item.created_by===student.id);
   if(existing){setSelectedId(existing.id);setMobileView("thread");setNewChatStudentId("");return;}
   const rows=await emadChatApi(portal,"emad_conversations",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({kind:"support",title:"محادثة مباشرة — "+(student.full_name||"طالب"),created_by:student.id})});
   const created=Array.isArray(rows)?rows[0]:rows;
   if(!created?.id)throw new Error("conversation_create_failed");
   await emadChatApi(portal,"emad_conversation_members",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({conversation_id:created.id,user_id:myId,member_role:"teacher"})});
   setProfiles(old=>({...old,[student.id]:student}));setNewChatStudentId("");
   await loadConversations();setSelectedId(created.id);setMobileView("thread");
  }catch(e){console.error("teacher_direct_chat_create",e);setError("تعذر بدء المحادثة مع الطالب. حدّث الصفحة وحاول مرة أخرى.");}
  finally{setCreatingChat(false);}
 };

 const createGroup=async()=>{
  const title=groupForm.title.trim();if(mode!=="teacher"||!title||creatingGroup)return;
  setCreatingGroup(true);setError("");
  try{
   const rows=await emadChatApi(portal,"emad_conversations",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({kind:"grade_group",title,grade:groupForm.grade,description:groupForm.description.trim(),created_by:myId})});
   const created=Array.isArray(rows)?rows[0]:rows;if(!created?.id)throw new Error("group_create_failed");
   await emadChatApi(portal,"emad_conversation_members",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({conversation_id:created.id,user_id:myId,member_role:"teacher"})});
   setGroupForm({title:"",grade:groupForm.grade,description:""});await loadConversations();setSelectedId(created.id);setMobileView("thread");
  }catch(e){console.error("teacher_group_create",e);setError("تعذر إنشاء المجموعة. تأكد من صلاحية الصف وحاول مرة أخرى.");}
  finally{setCreatingGroup(false);}
 };
 const toggleReaction=async(message,type)=>{
  const existing=(reactions[message.id]||[]).find(item=>item.user_id===myId&&item.reaction===type);
  try{
   if(existing)await emadChatApi(portal,"emad_chat_message_reactions?id=eq."+encodeURIComponent(existing.id),{method:"DELETE",headers:{Prefer:"return=minimal"}});
   else await emadChatApi(portal,"emad_chat_message_reactions",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({message_id:message.id,user_id:myId,reaction:type})});
   setReactionMenu("");await loadMessages();
  }catch(e){setError("تعذر حفظ التفاعل على الرسالة.");}
 };
 const editMessage=(message)=>{setEditingMessageId(message.id);setReplyTarget(null);setDraft(message.body||"");setFile(null);};
 const startReply=(message)=>{setReplyTarget(message);setEditingMessageId("");};
 const addStudent=async()=>{
  if(!isManager||mode!=="teacher"||!selectedId||!addStudentId||memberBusy)return;
  setMemberBusy(true);setError("");
  try{
   await emadChatApi(portal,"emad_conversation_members",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({conversation_id:selectedId,user_id:addStudentId,member_role:"student"})});
   setAddStudentId("");await loadConversations();setError("");
  }catch(e){setError("تعذر إضافة الطالب. تأكد من صلاحيات الجروب وأن الطالب تابع لنفس الصف.");}
  finally{setMemberBusy(false);}
 };
 const openProfile=async(id)=>{
  let person=profiles[id];
  if(!person){try{const cards=await getEmadChatProfileCards(portal,[id]);person=cards?.[0];if(person)setProfiles(old=>({...old,[id]:person}));}catch{}}
  if(person)setProfileCard(person);
 };

 return <section className={"emad-chat-page "+(selected?.kind==="support"?"is-direct-chat":"is-group-chat")} dir="rtl">
  <header className="emad-chat-hero"><div className="emad-chat-hero-mark">✉</div><div><span>EMAD MESSENGER</span><h1>{title}</h1><p>{isOwner?"مركز محادثات الطلاب والجروبات.":isSupport?"محادثاتك الخاصة مع فريق المنصة.":"تواصل مباشر مع المدرس والطلاب."}</p></div><div className="emad-chat-status"><i/> متصل الآن</div></header>
  {error&&<div className="emad-chat-error" role="alert">{error}</div>}
  <div className={"emad-chat-layout "+(mobileView==="thread"?"mobile-thread-open":"mobile-list-open")}>
   <aside className="emad-chat-sidebar">
    <div className="emad-chat-sidebar-head"><div><b>{isOwner?"المحادثات والجروبات":"الدردشات"}</b><small>{conversations.length} محادثة</small></div>{mode==="teacher_support"?<span className="emad-chat-new-mark">مراسلة الطلاب</span>:null}</div>
    {mode==="teacher"?<form className="emad-chat-create-group" onSubmit={e=>{e.preventDefault();createGroup();}}><div className="emad-chat-create-group-title"><b>إنشاء مجموعة جديدة</b><small>مجموعة خاصة بطلاب الصف</small></div><input value={groupForm.title} onChange={e=>setGroupForm(old=>({...old,title:e.target.value}))} placeholder="اسم المجموعة" required/><select value={groupForm.grade} onChange={e=>setGroupForm(old=>({...old,grade:e.target.value}))}>{gradeLabels.map(g=><option key={g}>{g}</option>)}</select><textarea value={groupForm.description} onChange={e=>setGroupForm(old=>({...old,description:e.target.value}))} placeholder="وصف المجموعة (اختياري)" rows={2}/><button disabled={!groupForm.title.trim()||creatingGroup}>{creatingGroup?"جارٍ الإنشاء...":"إنشاء مجموعة"}</button></form>:null}
    {mode==="teacher_support"?<div className="emad-chat-new-direct"><select value={newChatStudentId} onChange={e=>setNewChatStudentId(e.target.value)}><option value="">اختر طالبًا لبدء محادثة</option>{availableStudents.map(student=><option key={student.id} value={student.id}>{student.full_name||"طالب"} · {student.student_number||student.grade||""}</option>)}</select><button type="button" disabled={!newChatStudentId||creatingChat} onClick={startDirectChat}>{creatingChat?"جارٍ الفتح...":"محادثة جديدة +"}</button></div>:null}
    <input className="emad-chat-search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="ابحث في المحادثات..."/>
    <div className="emad-chat-list-tabs"><button className={conversationTab==="all"?"active":""} onClick={()=>setConversationTab("all")}>الكل</button><button className={conversationTab==="unread"?"active":""} onClick={()=>setConversationTab("unread")}>غير مقروءة</button></div>
    {busy?<div className="emad-chat-empty">جارٍ تحميل المحادثات...</div>:visibleConversations.map(c=>{
      const person=profiles[c.created_by];
      const pinned=members.some(m=>m.conversation_id===c.id&&m.user_id===myId&&m.is_pinned);
      const count=members.filter(m=>m.conversation_id===c.id).length;
      const latest=lastMessages[c.id];
      const ownMember=members.find(m=>m.conversation_id===c.id&&m.user_id===myId);
      const unread=!!latest&&latest.sender_id!==myId&&(!ownMember?.last_read_at||new Date(latest.created_at)>new Date(ownMember.last_read_at));
      const preview=latest?(latest.message_type==="image"?"📷 صورة":latest.message_type==="audio"?"🎤 رسالة صوتية":latest.message_type==="file"?"📎 "+(latest.attachment_name||"ملف"):latest.body||"رسالة"):(c.kind==="support"?"ابدأ المحادثة الآن":"لا توجد رسائل بعد");
      return <button key={c.id} className={"emad-chat-conversation "+(selectedId===c.id?"active":"")} onClick={()=>{setSelectedId(c.id);setMobileView("thread");}}>
       <span className={"emad-chat-conv-avatar "+(c.kind==="support"?"support":"group")}>{c.kind==="support"?(person?.avatar_url?<img src={person.avatar_url} alt=""/>:initials(person?.full_name||c.title)):"#"}</span>
       <span className="emad-chat-conv-copy"><b>{c.kind==="support"?(person?.full_name||c.title):c.title}</b><small>{preview}</small></span>
       <span className="emad-chat-conv-meta">{pinned?<i title="مثبت">★</i>:null}<small>{latest?dateLabel(latest.created_at):shortDate(c.updated_at||c.created_at)}</small>{unread?<i className="emad-chat-unread">جديد</i>:null}</span>
      </button>;
    })}
    {!busy&&!visibleConversations.length?<div className="emad-chat-empty">{isOwner?"لا توجد محادثات أو جروبات حتى الآن.":"لا توجد محادثات متاحة لحسابك."}</div>:null}
    {isOwner?<div className="emad-chat-sidebar-note">محادثات خدمة العملاء خاصة بينك وبين كل طالب. تقدر تثبت المحادثات المهمة.</div>:null}
   </aside>
   <section className="emad-chat-thread">
    {selected?<>
     <header className="emad-chat-thread-head">
      <button type="button" className="emad-chat-mobile-back" onClick={()=>setMobileView("list")} aria-label="العودة إلى المحادثات">‹ <span>المحادثات</span></button>
      <div className="emad-chat-thread-title"><span className={"emad-chat-conv-avatar "+(selected.kind==="support"?"support":"group")}>{selected.kind==="support"?(profiles[selected.created_by]?.avatar_url?<img src={profiles[selected.created_by].avatar_url} alt=""/>:initials(profiles[selected.created_by]?.full_name||selected.title)):"#"}</span><div><b>{selected.kind==="support"?(profiles[selected.created_by]?.full_name||selected.title):selected.title}</b><small>{selected.kind==="support"?"محادثة خاصة · متصل الآن":selected.grade+" · مجموعة الصف"}</small></div></div>
      <div className="emad-chat-thread-actions"><button type="button" onClick={()=>setMessageSearch(v=>v?"":" ")} title="البحث في الرسائل">بحث</button>{isManager?<button type="button" onClick={()=>setGroupInfoOpen(v=>!v)} title="تفاصيل المحادثة">التفاصيل</button>:null}{isManager&&selected.kind==="grade_group"?<button onClick={togglePin} disabled={pinBusy}>{selectedMember?.is_pinned?"إلغاء التثبيت":"تثبيت"}</button>:null}<span>{members.filter(m=>m.conversation_id===selectedId).length} أعضاء</span></div>
     </header>
     {selected.kind==="grade_group"?<div className="emad-chat-roster"><span>الأعضاء:</span>{members.filter(m=>m.conversation_id===selectedId).slice(0,18).map(m=>{const p=profiles[m.user_id];return <span className="emad-chat-roster-member" key={m.user_id}><button title={p?.full_name||"عضو"} onClick={()=>openProfile(m.user_id)}>{p?.avatar_url?<img src={p.avatar_url} alt=""/>:initials(p?.full_name)}</button>{isManager&&m.user_id!==myId&&(mode!=="teacher"||m.member_role==="student")?<button className="emad-chat-remove-member" title="إزالة من الجروب" onClick={()=>removeMember(m.user_id)}>×</button>:null}</span>;})}{mode==="teacher"?<div className="emad-chat-add-member"><select value={addStudentId} onChange={e=>setAddStudentId(e.target.value)}><option value="">إضافة طالب من نفس الصف</option>{availableStudents.map(p=><option key={p.id} value={p.id}>{p.full_name||"طالب"} · {p.student_number||"—"}</option>)}</select><button disabled={!addStudentId||memberBusy} onClick={addStudent}>{memberBusy?"جارٍ الإضافة...":"إضافة"}</button></div>:null}</div>:null}
     {messageSearch?<div className="emad-chat-message-search"><input autoFocus value={messageSearch.trim()===""?"":messageSearch} onChange={e=>setMessageSearch(e.target.value)} placeholder="ابحث داخل هذه المحادثة..."/><button onClick={()=>setMessageSearch("")}>إغلاق</button></div>:null}
     {groupInfoOpen&&selected.kind==="grade_group"?<aside className="emad-chat-group-info"><div><b>معلومات المجموعة</b><button onClick={()=>setGroupInfoOpen(false)}>إغلاق</button></div><label>اسم المجموعة<input defaultValue={selected.title} id="emad-group-title"/></label><label>وصف المجموعة<textarea defaultValue={selected.description||""} id="emad-group-description"/></label><button onClick={async()=>{const title=document.getElementById("emad-group-title")?.value?.trim();const description=document.getElementById("emad-group-description")?.value||"";if(!title)return setError("اكتب اسم المجموعة.");try{await emadChatApi(portal,"emad_conversations?id=eq."+encodeURIComponent(selectedId),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({title,description})});await loadConversations();setGroupInfoOpen(false);}catch{setError("تعذر حفظ بيانات المجموعة.");}}}>حفظ بيانات المجموعة</button><h4>أعضاء المجموعة ({members.filter(m=>m.conversation_id===selectedId).length})</h4><div className="emad-chat-group-members">{members.filter(m=>m.conversation_id===selectedId).map(m=><span key={m.user_id}>{profiles[m.user_id]?.full_name||"عضو"} · {m.member_role==="teacher"?"مدرس":"طالب"}</span>)}</div></aside>:null}
     <div className="emad-chat-message-list" ref={messageListRef} onScroll={e=>{const el=e.currentTarget;stickToBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<130;}}>
      {!messages.length?<div className="emad-chat-empty large">{selected.kind==="support"?"اكتب رسالتك الأولى، وسيظهر رد خدمة العملاء هنا.":"ابدأ النقاش مع أعضاء الجروب."}</div>:messages.filter(message=>!messageSearch.trim()||[message.body,message.attachment_name].join(" ").toLowerCase().includes(messageSearch.trim().toLowerCase())).map(message=>{
       const sender=profiles[message.sender_id]||{};
       const mine=message.sender_id===myId;
       const url=attachmentUrls[message.id];
       return <article key={message.id} className={"emad-chat-message "+(mine?"mine":"")}>
        {!mine?<button className="emad-chat-message-avatar" onClick={()=>openProfile(message.sender_id)}>{sender.avatar_url?<img src={sender.avatar_url} alt=""/>:initials(sender.full_name)}</button>:null}
        <div className="emad-chat-message-body">
         {!mine?<button className="emad-chat-sender" onClick={()=>openProfile(message.sender_id)}>{sender.full_name||"عضو"}{sender.is_verified?<i>✓</i>:null}</button>:null}
         {message.reply_to&&messages.find(m=>m.id===message.reply_to)?<div className="emad-chat-reply-quote"><b>رد على رسالة</b><span>{messages.find(m=>m.id===message.reply_to)?.body||"مرفق"}</span></div>:null}
         <div className="emad-chat-bubble">
          {message.body?<p>{message.body}</p>:null}
          {message.attachment_path&&url?(message.message_type==="image"?<a href={url} target="_blank" rel="noreferrer"><img className="emad-chat-attachment-image" src={url} alt={message.attachment_name||"صورة مرفقة"}/></a>:message.message_type==="audio"?<div className="emad-chat-audio"><span>رسالة صوتية</span><audio controls preload="metadata" src={url}/></div>:<a className="emad-chat-file" href={url} target="_blank" rel="noreferrer">📎 {message.attachment_name||"ملف مرفق"} <small>فتح الملف</small></a>):null}
         </div>
         <div className="emad-chat-message-tools"><button onClick={()=>startReply(message)}>رد</button>{mine?<button onClick={()=>editMessage(message)}>تعديل</button>:null}<button onClick={()=>setReactionMenu(reactionMenu===message.id?"":message.id)}>تفاعل</button>{(isManager||mine)?<button onClick={()=>deleteMessage(message.id)}>حذف</button>:null}</div>
         {(reactions[message.id]||[]).length?<div className="emad-chat-reaction-list">{["like","heart","laugh","surprise","sad","thanks"].map(type=>{const list=(reactions[message.id]||[]).filter(r=>r.reaction===type);return list.length?<button key={type} className={list.some(r=>r.user_id===myId)?"mine":""} onClick={()=>toggleReaction(message,type)}><span>{({like:"＋",heart:"♥",laugh:"笑",surprise:"!",sad:"−",thanks:"✓"})[type]}</span><small>{list.length}</small></button>:null;})}</div>:null}
         {reactionMenu===message.id?<div className="emad-chat-reaction-picker">{["like","heart","laugh","surprise","sad","thanks"].map(type=><button key={type} onClick={()=>toggleReaction(message,type)}><span>{({like:"＋",heart:"♥",laugh:"笑",surprise:"!",sad:"−",thanks:"✓"})[type]}</span>{({like:"إعجاب",heart:"قلب",laugh:"ضحك",surprise:"مندهش",sad:"حزين",thanks:"شكر"})[type]}</button>)}</div>:null}
         <small className="emad-chat-time">{dateLabel(message.created_at)}{mine?(receiptSummary[message.id]?.delivered? " · تم التسليم":" · تم الإرسال"):""}{mine&&receiptSummary[message.id]?.read>0?" · قرأها "+receiptSummary[message.id].read:""}{isManager?<button className="emad-chat-delete-message" onClick={()=>deleteMessage(message.id)}>حذف</button>:null}</small>
        </div>
       </article>;
      })}
      <div ref={bottomRef}/>
     </div>
     <div className="emad-chat-composer">
      {replyTarget?<div className="emad-chat-compose-context"><b>الرد على {profiles[replyTarget.sender_id]?.full_name||"الرسالة"}</b><span>{replyTarget.body||"مرفق"}</span><button onClick={()=>setReplyTarget(null)}>إلغاء</button></div>:null}
      {editingMessageId?<div className="emad-chat-compose-context"><b>تعديل الرسالة</b><span>أنت تعدّل رسالتك الحالية</span><button onClick={()=>{setEditingMessageId("");setDraft("");}}>إلغاء</button></div>:null}
      {file?<div className="emad-chat-file-chip"><span>{file.name}</span><button onClick={()=>{setFile(null);if(fileRef.current)fileRef.current.value="";}}>×</button></div>:null}
      <textarea value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} rows={2} placeholder="اكتب رسالتك هنا..."/>
      <div className="emad-chat-compose-actions"><label className="emad-chat-attach">＋ إرفاق ملف<input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button type="button" className={"emad-chat-record "+(recording?"recording":"")} onClick={recording?stopVoiceRecording:startVoiceRecording}>{recording?"إيقاف التسجيل":"تسجيل صوت"}</button><small>الحد الأقصى 15 ميجابايت</small><button onClick={send} disabled={sending||(!draft.trim()&&!file)}>{sending?"جارٍ الحفظ...":editingMessageId?"حفظ التعديل":"إرسال"} <span>➤</span></button></div>
     </div>
    </>:<div className="emad-chat-empty large">اختار محادثة من القائمة لبدء التواصل.</div>}
   </section>
  </div>
  {profileCard?<div className="emad-chat-profile-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setProfileCard(null);}}><section className="emad-chat-profile-card"><button className="emad-chat-profile-close" onClick={()=>setProfileCard(null)}>×</button><div className="emad-chat-profile-cover"/><div className="emad-chat-profile-avatar">{profileCard.avatar_url?<img src={profileCard.avatar_url} alt=""/>:initials(profileCard.full_name)}</div><h2>{profileCard.full_name||"عضو المنصة"} {profileCard.is_verified?<i>✓</i>:null}</h2><span className="emad-chat-profile-role">{({owner:"مالك المنصة",admin:"إدارة",teacher:"المدرس",student:"طالب"})[profileCard.role]||"عضو"}</span><dl><div><dt>رقم الحساب</dt><dd>{profileCard.student_number||"حساب إداري"}</dd></div><div><dt>الصف الدراسي</dt><dd>{profileCard.grade||"—"}</dd></div><div><dt>المجموعة</dt><dd>{profileCard.group_name||"—"}</dd></div></dl><p>يتم عرض بيانات الملف الأساسية فقط حفاظًا على خصوصية أرقام الهاتف وبيانات ولي الأمر.</p></section></div>:null}
 </section>;
}
