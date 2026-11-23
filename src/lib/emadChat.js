import { getSavedStudentSession, refreshStudentSession, studentApi } from "./auth.js";
import { getPortalSession, refreshPortalSession, portalApi } from "./portalAuth.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg","image/png","image/webp","audio/webm","audio/ogg","audio/mp4","audio/mpeg","audio/wav","application/pdf",
  "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation"
]);

export async function emadChatApi(portal, path, options = {}) {
  if (portal === "student") {
    const session = await refreshStudentSession();
    if (!session?.access_token) throw new Error("not_authenticated");
    return studentApi(path, options);
  }
  return portalApi(portal, path, options);
}

async function sessionFor(portal) {
  if (portal === "student") {
    const session = await refreshStudentSession();
    if (!session?.access_token) throw new Error("not_authenticated");
    return session;
  }
  const session = await refreshPortalSession(portal);
  if (!session?.access_token) throw new Error("not_authenticated");
  return session;
}

export async function uploadEmadChatAttachment(portal, conversationId, file) {
  if (!file || !ALLOWED.has(file.type)) throw new Error("unsupported_attachment");
  if (file.size > MAX_ATTACHMENT_SIZE) throw new Error("attachment_too_large");
  const session = await sessionFor(portal);
  const safeName = String(file.name || "attachment").replace(/[^\p{L}\p{N}._-]/gu, "_").slice(-90);
  const path = conversationId + "/" + crypto.randomUUID() + "-" + safeName;
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/emad-chat-attachments/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLIC_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": file.type,
      "x-upsert": "false"
    },
    body: file
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "attachment_upload_failed");
  return { path, name: file.name || safeName, mime: file.type, size: file.size };
}

export async function getEmadChatAttachmentUrl(portal, path) {
  const session = await sessionFor(portal);
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/sign/emad-chat-attachments/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLIC_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ expiresIn: 3600 })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "attachment_link_failed");
  const signed = data.signedURL || data.signedUrl || data.url;
  if (!signed) throw new Error("attachment_link_missing");
  return signed.startsWith("http") ? signed : SUPABASE_URL.replace(/\/$/, "") + "/storage/v1" + signed;
}

export async function getEmadChatProfileCards(portal, ids) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (!unique.length) return [];
  return emadChatApi(portal, "rpc/emad_chat_profile_cards", {
    method: "POST",
    body: JSON.stringify({ p_ids: unique })
  });
}
