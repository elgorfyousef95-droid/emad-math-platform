import { refreshStudentSession } from "./auth.js";
import { refreshPortalSession } from "./portalAuth.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = "emad-lecture-videos";
const PUBLIC_MARKER = "/storage/v1/object/public/" + BUCKET + "/";

function storagePath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const at = raw.indexOf(PUBLIC_MARKER);
  if (at >= 0) return decodeURIComponent(raw.slice(at + PUBLIC_MARKER.length).split("?")[0]);
  if (raw.startsWith(BUCKET + "/")) return raw.slice(BUCKET.length + 1);
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const marker = "/storage/v1/object/";
      const index = url.pathname.indexOf(marker);
      if (index < 0) return "";
      const remainder = url.pathname.slice(index + marker.length);
      const bucketPrefix = BUCKET + "/";
      const withoutVisibility = remainder.replace(/^(public|sign|authenticated)\//, "");
      if (!withoutVisibility.startsWith(bucketPrefix)) return "";
      return decodeURIComponent(withoutVisibility.slice(bucketPrefix.length));
    } catch {
      return "";
    }
  }
  return raw.replace(/^\/+/, "");
}

function storageUrl(base, signedValue) {
  const value = String(signedValue || "").trim();
  if (!value) throw new Error("lecture_video_url_missing");
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/storage/v1/")) return base + value;
  if (value.startsWith("storage/v1/")) return base + "/" + value;
  if (value.startsWith("/")) return base + "/storage/v1" + value;
  if (value.startsWith("object/")) return base + "/storage/v1/" + value;
  throw new Error("lecture_video_url_invalid");
}

export async function getLectureVideoUrl(value, portal = "student") {
  const path = storagePath(value);
  if (!path) {
    const raw = String(value || "").trim();
    if (/^https?:\/\//i.test(raw)) return raw;
    throw new Error("lecture_video_path_missing");
  }
  const session = portal === "student"
    ? await refreshStudentSession()
    : await refreshPortalSession(portal);
  if (!session?.access_token) throw new Error("not_authenticated");
  if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) throw new Error("missing_supabase_configuration");

  const base = SUPABASE_URL.replace(/\/$/, "");
  const encodedPath = path.split("/").map(segment => encodeURIComponent(segment)).join("/");
  const response = await fetch(base + "/storage/v1/object/sign/" + BUCKET + "/" + encodedPath, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLIC_KEY,
      Authorization: "Bearer " + session.access_token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 21600 }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || "lecture_video_access_denied");
    error.status = response.status;
    console.error("lecture_video_sign_failed", { status: response.status, message: error.message });
    throw error;
  }
  return storageUrl(base, data.signedURL || data.signedUrl || data.url);
}

export function getLectureEmbedUrl(value) {
  const raw = String(value || "").trim();
  if (!/^https?:\/\//i.test(raw)) return "";
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
    else if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
      id = url.searchParams.get("v") || "";
      if (!id) {
        const parts = url.pathname.split("/").filter(Boolean);
        const marker = parts.findIndex(part => ["embed", "shorts", "live"].includes(part));
        if (marker >= 0) id = parts[marker + 1] || "";
      }
    }
    if (id && /^[A-Za-z0-9_-]{6,}$/.test(id)) return "https://www.youtube-nocookie.com/embed/" + id;
    if (["vimeo.com", "player.vimeo.com"].includes(host)) {
      const match = url.pathname.match(/(?:video\/)?(\d{6,})/);
      if (match) return "https://player.vimeo.com/video/" + match[1];
    }
  } catch {}
  return "";
}
