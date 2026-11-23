import { refreshStudentSession } from "./auth.js";
import { refreshPortalSession } from "./portalAuth.js";

const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY=import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET="emad-lecture-videos";
const PUBLIC_MARKER="/storage/v1/object/public/"+BUCKET+"/";

function storagePath(value){
 const raw=String(value||"").trim();
 if(!raw)return "";
 const at=raw.indexOf(PUBLIC_MARKER);
 if(at>=0)return decodeURIComponent(raw.slice(at+PUBLIC_MARKER.length).split("?")[0]);
 if(raw.startsWith(BUCKET+"/"))return raw.slice(BUCKET.length+1);
 if(/^https?:\/\//i.test(raw))return "";
 return raw.replace(/^\/+/,"");
}

export async function getLectureVideoUrl(value,portal="student"){
 const raw=String(value||"").trim();
 if(!raw)return "";
 const path=storagePath(raw);
 if(!path)return raw;
 const session=portal==="student"?await refreshStudentSession():await refreshPortalSession(portal);
 if(!session?.access_token)throw new Error("not_authenticated");
 const base=SUPABASE_URL.replace(/\/$/,"");
 const response=await fetch(base+"/storage/v1/object/sign/"+BUCKET+"/"+path,{
  method:"POST",
  headers:{apikey:SUPABASE_PUBLIC_KEY,Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},
  body:JSON.stringify({expiresIn:21600})
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.message||"lecture_video_access_denied");
 const signed=data.signedURL||data.signedUrl||data.url;
 if(!signed)throw new Error("lecture_video_url_missing");
 return signed.startsWith("http")?signed:base+"/storage/v1"+signed;
}
