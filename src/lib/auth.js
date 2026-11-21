const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION_KEY = "emad_student_auth_session";

function config() {
  if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) {
    throw new Error("missing_supabase_configuration");
  }
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_PUBLIC_KEY };
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "request_failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function createStudentAccount(formData) {
  const { url, key } = config();
  const response = await fetch(`${url}/functions/v1/emad-student-signup`, {
    method: "POST",
    headers: { apikey: key },
    body: formData,
  });
  return parseResponse(response);
}

export async function loginStudent(studentNumber, password) {
  const { url, key } = config();
  const response = await fetch(`${url}/functions/v1/emad-student-login`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ student_number: studentNumber, password }),
  });
  return parseResponse(response);
}

export function saveStudentSession(session) {
  if (!session?.access_token || !session?.refresh_token) return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage may be unavailable in a private browsing context.
  }
}

export function getSavedStudentSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function refreshStudentSession() {
  const session = getSavedStudentSession();
  if (!session?.refresh_token) return null;
  if (session.expires_at && session.expires_at * 1000 > Date.now() + 60_000) return session;

  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) {
    clearStudentSession();
    return null;
  }
  const data = await response.json();
  const nextSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    token_type: data.token_type || "bearer",
  };
  saveStudentSession(nextSession);
  return nextSession;
}

export function clearStudentSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore unavailable local storage.
  }
}
