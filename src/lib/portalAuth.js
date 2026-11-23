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
  return response.status === 204 ? null : response.json();
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
