const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION_KEY = "emad_student_auth_session_v2";

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
    user: data.user || session.user || null,
  };
  saveStudentSession(nextSession);
  return nextSession;
}

export function clearStudentSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("emad_student_auth_session");
  } catch {
    // Ignore unavailable local storage.
  }
}

export async function studentApi(path, options = {}) {
  const { url, key } = config();
  const session = getSavedStudentSession();
  if (!session?.access_token) throw new Error("not_authenticated");
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
    throw new Error(body.message || body.code || "student_api_error");
  }
  return response.status === 204 ? null : response.json();
}

function getSessionUserId(session) {
  if (session?.user?.id) return session.user.id;
  try {
    const token = String(session?.access_token || "");
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
    return typeof decoded.sub === "string" ? decoded.sub : null;
  } catch {
    return null;
  }
}

export async function loadStudentWorkspace() {
  const session = getSavedStudentSession();
  const userId = getSessionUserId(session);
  if (!userId) throw new Error("session_identity_missing");

  // Always bind the profile lookup to the authenticated JWT subject.
  // Owner accounts can read all profiles under RLS, so an unfiltered limit=1
  // could otherwise load a different student's profile.
  const [profiles, subscriptions, notifications] = await Promise.all([
    studentApi("profiles?select=id,full_name,student_number,grade,group_name,avatar_url,is_verified,role&id=eq." + encodeURIComponent(userId) + "&limit=1"),
    studentApi("emad_student_subscriptions?select=id,grade,starts_at,ends_at&ends_at=gt." + encodeURIComponent(new Date().toISOString()) + "&order=ends_at.desc&limit=1"),
    studentApi("emad_notifications?select=id,notification_type,title,body,action_url,read_at,created_at&order=created_at.desc&limit=30"),
  ]);
  const profile = profiles?.[0] || null;
  if (!profile || profile.id !== userId) throw new Error("authenticated_profile_not_found");
  return {
    profile,
    subscription: subscriptions?.[0] || null,
    notifications: notifications || [],
  };
}

export async function redeemStudentSubscription(code) {
  const { url, key } = config();
  const session = getSavedStudentSession();
  if (!session?.access_token) throw new Error("not_authenticated");
  const response = await fetch(`${url}/rest/v1/rpc/emad_redeem_subscription_code`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_code: code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.code || "subscription_activation_failed");
  return data;
}

export async function markStudentNotificationRead(id) {
  return studentApi(`emad_notifications?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ read_at: new Date().toISOString() }),
  });
}

export async function issueStudentSubscriptionCode(grade) {
  const { url, key } = config();
  const session = getSavedStudentSession();
  if (!session?.access_token) throw new Error("not_authenticated");
  const response = await fetch(`${url}/rest/v1/rpc/emad_issue_subscription_code`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_grade: grade }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.code || "subscription_code_issue_failed");
  return data;
}
