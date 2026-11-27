const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PORTAL_KEYS = { owner: "emad_owner_portal_session_v1", teacher: "emad_teacher_portal_session_v1" };

function config() {
  if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) throw new Error("missing_supabase_configuration");
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_PUBLIC_KEY };
}
function storageKey(portal) {
  if (!PORTAL_KEYS[portal]) throw new Error("invalid_portal");
  return PORTAL_KEYS[portal];
}
async function callPortalFunction(body, accessToken) {
  const { url, key } = config();
  const response = await fetch(`${url}/functions/v1/emad-portal-auth`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "portal_request_failed");
  return data;
}
export async function portalLogin(portal, password) {
  const data = await callPortalFunction({ action: "login", portal, password });
  if (!data.session?.access_token || !data.session?.refresh_token) throw new Error("portal_session_missing");
  localStorage.setItem(storageKey(portal), JSON.stringify(data.session));
  return data.session;
}
export async function setupPortalAccounts(bootstrapToken, ownerPassword, teacherPassword, teacherName) {
  if (!bootstrapToken || bootstrapToken.trim().length < 32) throw new Error("bootstrap_invalid");
  return callPortalFunction({
    action: "setup",
    bootstrap_token: bootstrapToken.trim(),
    owner_password: ownerPassword,
    teacher_password: teacherPassword,
    teacher_name: teacherName,
  });
}
export function getPortalSession(portal) {
  try { return JSON.parse(localStorage.getItem(storageKey(portal)) || "null"); } catch { return null; }
}
export function logoutPortalSession(portal) {
  try { localStorage.removeItem(storageKey(portal)); } catch {}
}
export async function refreshPortalSession(portal) {
  const session = getPortalSession(portal);
  if (!session?.refresh_token) return null;
  if (session.expires_at && session.expires_at * 1000 > Date.now() + 60000) return session;
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) { logoutPortalSession(portal); return null; }
  const data = await response.json();
  const next = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    token_type: data.token_type || "bearer",
    user: data.user || session.user || null,
  };
  localStorage.setItem(storageKey(portal), JSON.stringify(next));
  return next;
}
export async function portalApi(portal, path, options = {}) {
  const { url, key } = config();
  const session = await refreshPortalSession(portal);
  if (!session?.access_token) throw new Error("portal_not_authenticated");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.code || "portal_api_error");
  }
  if (response.status === 204) return null;
  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}


export async function uploadPortalImage(file, portal = "owner") {
  if (!file || !String(file.type || "").startsWith("image/")) throw new Error("invalid_image_file");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("unsupported_image_type");
  if (file.size > 5 * 1024 * 1024) throw new Error("image_too_large");
  const session = await refreshPortalSession(portal);
  if (!session?.access_token) throw new Error("portal_not_authenticated");
  const { url, key } = config();
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const folder = portal === "teacher" ? `teacher/${session.user?.id}` : `owner/${session.user?.id}`;
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const response = await fetch(`${url}/storage/v1/object/emad-learning-media/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": file.type,
      "x-upsert": "false",
    },
    body: file,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || "image_upload_failed");
  return `${url}/storage/v1/object/public/emad-learning-media/${path}`;
}


const MAX_LECTURE_VIDEO_BYTES = 1024 * 1024 * 1024;
const TUS_CHUNK_BYTES = 6 * 1024 * 1024;

function encodeTusMetadata(value) {
  return btoa(unescape(encodeURIComponent(String(value))));
}

function videoStorageHost(baseUrl) {
  const hostname = new URL(baseUrl).hostname;
  return hostname.endsWith(".supabase.co")
    ? hostname.replace(".supabase.co", ".storage.supabase.co")
    : new URL(baseUrl).host;
}

function videoResumeKey(userId, file) {
  return "emad_video_upload_v2:" + [userId, file.name, file.size, file.lastModified].join(":");
}

async function tusRequest(url, options, token, key) {
  return fetch(url, {
    ...options,
    headers: {
      apikey: key,
      Authorization: "Bearer " + token,
      "Tus-Resumable": "1.0.0",
      ...(options.headers || {}),
    },
  });
}

async function tusOffset(uploadUrl, token, key) {
  const response = await tusRequest(uploadUrl, { method: "HEAD" }, token, key);
  if (!response.ok) {
    const error = new Error("tus_resume_unavailable");
    error.status = response.status;
    throw error;
  }
  return Number(response.headers.get("Upload-Offset") || 0);
}

export async function uploadPortalVideo(file, portal = "teacher", onProgress = () => {}) {
  if (!file || !["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) {
    throw new Error("unsupported_video_type");
  }
  if (file.size > MAX_LECTURE_VIDEO_BYTES) throw new Error("video_too_large");

  const session = await refreshPortalSession(portal);
  if (!session?.access_token) throw new Error("portal_not_authenticated");

  const { url, key } = config();
  const projectHost = videoStorageHost(url);
  const endpoint = "https://" + projectHost + "/storage/v1/upload/resumable";
  const extension = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
  const folder = portal === "teacher" ? "teacher/" + session.user?.id : "owner/" + session.user?.id;
  const resumeKey = videoResumeKey(session.user?.id || portal, file);
  let resume = null;

  try {
    resume = JSON.parse(localStorage.getItem(resumeKey) || "null");
  } catch {}

  const createUpload = async () => {
    const path = folder + "/lectures/" + crypto.randomUUID() + "." + extension;
    const metadata = [
      ["bucketName", "emad-lecture-videos"],
      ["objectName", path],
      ["contentType", file.type],
      ["cacheControl", "3600"],
    ].map(([name, value]) => name + " " + encodeTusMetadata(value)).join(",");
    const response = await tusRequest(endpoint, {
      method: "POST",
      headers: {
        "Upload-Length": String(file.size),
        "Upload-Metadata": metadata,
        "x-upsert": "false",
      },
    }, session.access_token, key);
    if (response.status !== 201) {
      const detail = await response.text().catch(() => "");
      const error = new Error("video_upload_start_failed");
      error.status = response.status;
      error.detail = detail;
      throw error;
    }
    const location = response.headers.get("Location");
    if (!location) throw new Error("video_upload_location_missing");
    const uploadUrl = new URL(location, endpoint).toString();
    resume = { path, uploadUrl, fileSize: file.size, fileName: file.name, lastModified: file.lastModified };
    try { localStorage.setItem(resumeKey, JSON.stringify(resume)); } catch {}
    return { path, uploadUrl };
  };

  let active;
  if (resume?.uploadUrl && resume?.path && resume.fileSize === file.size && resume.lastModified === file.lastModified) {
    try {
      active = { path: resume.path, uploadUrl: resume.uploadUrl };
      await tusOffset(active.uploadUrl, session.access_token, key);
    } catch (error) {
      if (![404, 410].includes(error.status)) throw error;
      try { localStorage.removeItem(resumeKey); } catch {}
      resume = null;
    }
  }
  if (!active) active = await createUpload();

  let offset = await tusOffset(active.uploadUrl, session.access_token, key);
  if (offset > file.size) throw new Error("video_upload_offset_invalid");
  onProgress(Math.round((offset / file.size) * 100), offset, file.size);

  while (offset < file.size) {
    const end = Math.min(offset + TUS_CHUNK_BYTES, file.size);
    let attempts = 0;
    let completed = false;
    while (!completed) {
      try {
        const response = await tusRequest(active.uploadUrl, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/offset+octet-stream",
            "Upload-Offset": String(offset),
          },
          body: file.slice(offset, end),
        }, session.access_token, key);
        if (response.status === 204) {
          offset = Number(response.headers.get("Upload-Offset") || end);
          completed = true;
        } else if (response.status === 409) {
          offset = await tusOffset(active.uploadUrl, session.access_token, key);
          completed = offset >= end;
        } else {
          const detail = await response.text().catch(() => "");
          const error = new Error("video_upload_chunk_failed");
          error.status = response.status;
          error.detail = detail;
          throw error;
        }
      } catch (error) {
        attempts += 1;
        if (error.status && ![408, 429, 500, 502, 503, 504].includes(error.status)) throw error;
        if (attempts > 5) throw error;
        await new Promise((resolve) => setTimeout(resolve, Math.min(15000, 1500 * (2 ** (attempts - 1)))));
        offset = await tusOffset(active.uploadUrl, session.access_token, key);
        if (offset >= end) completed = true;
      }
    }
    onProgress(Math.min(100, Math.round((offset / file.size) * 100)), offset, file.size);
  }

  try { localStorage.removeItem(resumeKey); } catch {}
  return active.path;
}

export async function deletePortalVideo(value, portal = "owner") {
  const raw = String(value || "").trim();
  if (!raw) return;
  const publicMarker = "/storage/v1/object/public/emad-lecture-videos/";
  const markerIndex = raw.indexOf(publicMarker);
  let path = markerIndex >= 0
    ? decodeURIComponent(raw.slice(markerIndex + publicMarker.length).split("?")[0])
    : raw.startsWith("emad-lecture-videos/")
      ? raw.slice("emad-lecture-videos/".length)
      : /^https?:\/\//i.test(raw) ? "" : raw.replace(/^\/+/, "");
  if (!path) return;
  const session = await refreshPortalSession(portal);
  if (!session?.access_token) throw new Error("portal_not_authenticated");
  const { url, key } = config();
  const response = await fetch(url + "/storage/v1/object/emad-lecture-videos/" + path.split("/").map(encodeURIComponent).join("/"), {
    method: "DELETE",
    headers: { apikey: key, Authorization: "Bearer " + session.access_token },
  });
  if (!response.ok && response.status !== 404) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "video_delete_failed");
  }
}


const RESOURCE_MAX_BYTES = 100 * 1024 * 1024;
const RESOURCE_TYPES = new Set([
  "application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain","image/jpeg","image/png","image/webp"
]);

export async function uploadPortalResource(file, portal = "teacher", onProgress = () => {}) {
  if (!file) throw new Error("unsupported_resource_type");
  if (file.size <= 0) throw new Error("empty_resource_file");
  if (file.size > RESOURCE_MAX_BYTES) throw new Error("resource_too_large");
  const extension = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g,"") || "bin";
  const mimeByExtension = {pdf:"application/pdf",doc:"application/msword",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xls:"application/vnd.ms-excel",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",ppt:"application/vnd.ms-powerpoint",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",txt:"text/plain",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp"};
  const contentType = file.type || mimeByExtension[extension] || "";
  if (!RESOURCE_TYPES.has(contentType)) throw new Error("unsupported_resource_type");
  const session = await refreshPortalSession(portal);
  if (!session?.access_token) throw new Error("portal_not_authenticated");
  const { url, key } = config();
  const host = videoStorageHost(url);
  const endpoint = "https://" + host + "/storage/v1/upload/resumable";
  const folder = portal === "teacher" ? "teacher/" + session.user?.id : "owner/" + session.user?.id;
  const path = folder + "/resources/" + crypto.randomUUID() + "." + extension;
  const metadata = [
    ["bucketName","emad-learning-files"],["objectName",path],["contentType",contentType],["cacheControl","3600"]
  ].map(([name,value])=>name+" "+encodeTusMetadata(value)).join(",");
  const created = await tusRequest(endpoint,{method:"POST",headers:{"Upload-Length":String(file.size),"Upload-Metadata":metadata,"x-upsert":"false"}},session.access_token,key);
  if(created.status!==201){const detail=await created.text().catch(()=>"");const error=new Error("resource_upload_start_failed");error.status=created.status;error.detail=detail;throw error;}
  const location=created.headers.get("Location");
  if(!location)throw new Error("resource_upload_location_missing");
  const uploadUrl=new URL(location,endpoint).toString();
  let offset=0;
  while(offset<file.size){
    const end=Math.min(offset+TUS_CHUNK_BYTES,file.size);
    const response=await tusRequest(uploadUrl,{method:"PATCH",headers:{"Content-Type":"application/offset+octet-stream","Upload-Offset":String(offset)},body:file.slice(offset,end)},session.access_token,key);
    if(response.status===204){offset=Number(response.headers.get("Upload-Offset")||end);onProgress(Math.min(100,Math.round(offset/file.size*100)),offset,file.size);continue;}
    if(response.status===409){offset=await tusOffset(uploadUrl,session.access_token,key);continue;}
    const detail=await response.text().catch(()=>"");const error=new Error("resource_upload_chunk_failed");error.status=response.status;error.detail=detail;throw error;
  }
  return path;
}

export async function deletePortalResource(path, portal = "teacher") {
  let clean=String(path||""); while(clean.startsWith("/")) clean=clean.slice(1);
  if(!clean||clean.includes(".."))return;
  const session=await refreshPortalSession(portal);
  if(!session?.access_token)throw new Error("portal_not_authenticated");
  const {url,key}=config();
  const response=await fetch(url+"/storage/v1/object/emad-learning-files/"+clean.split("/").map(encodeURIComponent).join("/"),{method:"DELETE",headers:{apikey:key,Authorization:"Bearer "+session.access_token}});
  if(!response.ok&&response.status!==404){const data=await response.json().catch(()=>({}));throw new Error(data.message||"resource_delete_failed");}
}
