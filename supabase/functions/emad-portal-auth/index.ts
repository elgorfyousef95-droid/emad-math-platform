import { createClient } from "npm:@supabase/supabase-js@2";

const origins = ["https://emadelsanafiry.vercel.app"];
const cors = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const ok = origins.includes(origin) || /^https:\/\/emad-math-platform-[a-z0-9-]+-e08773479-pixel\.vercel\.app$/.test(origin);
  return {
    ...(ok ? { "Access-Control-Allow-Origin": origin } : {}),
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
};
const config = {
  owner: { email: "owner-portal@portal.emadelsanafiry.invalid", name: "Yousef Elgorf" },
  teacher: { email: "teacher-portal@portal.emadelsanafiry.invalid", name: "مستر عماد السنافيري" }
} as const;

Deno.serve(async (req: Request) => {
  const headers = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers });

  const url = Deno.env.get("SUPABASE_URL") || "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  const secrets = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || secrets.default || "";
  if (!url || !anon || !service) return new Response(JSON.stringify({ error: "server_configuration_error" }), { status: 500, headers });

  const body = await req.json().catch(() => ({}));
  const pub = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  if (body.action === "login") {
    const portal = body.portal === "owner" || body.portal === "teacher" ? body.portal : null;
    const password = typeof body.password === "string" ? body.password : "";
    if (!portal || password.length < 12 || password.length > 72) return new Response(JSON.stringify({ error: "invalid_credentials" }), { status: 400, headers });
    const { data, error } = await pub.auth.signInWithPassword({ email: config[portal].email, password });
    if (error || !data.session || data.user?.app_metadata?.portal_role !== portal) return new Response(JSON.stringify({ error: "invalid_login" }), { status: 401, headers });
    return new Response(JSON.stringify({ portal, session: {
      access_token: data.session.access_token, refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at, token_type: data.session.token_type, user: data.user
    }}), { headers });
  }

  if (body.action === "setup") {
    const bootstrapToken = typeof body.bootstrap_token === "string" ? body.bootstrap_token.trim() : "";
    const { data: valid, error: validationError } = await admin.rpc("validate_emad_portal_bootstrap", { p_token: bootstrapToken });
    if (validationError || valid !== true) return new Response(JSON.stringify({ error: "bootstrap_invalid" }), { status: 403, headers });

    const ownerPassword = typeof body.owner_password === "string" ? body.owner_password : "";
    const teacherPassword = typeof body.teacher_password === "string" ? body.teacher_password : "";
    const teacherName = typeof body.teacher_name === "string" ? body.teacher_name.trim() : "مستر عماد السنافيري";
    if (ownerPassword.length < 12 || ownerPassword.length > 72 || teacherPassword.length < 12 ||
        teacherPassword.length > 72 || ownerPassword === teacherPassword || teacherName.length < 5 || teacherName.length > 100) {
      return new Response(JSON.stringify({ error: "invalid_portal_setup_data" }), { status: 400, headers });
    }

    const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return new Response(JSON.stringify({ error: "portal_user_lookup_failed" }), { status: 500, headers });
    const existingUsers = listed.users || [];

    for (const item of [
      { key: "owner", password: ownerPassword, name: config.owner.name },
      { key: "teacher", password: teacherPassword, name: teacherName }
    ] as const) {
      const email = config[item.key].email;
      const existing = existingUsers.find(user => user.email === email);
      let userId = existing?.id || "";
      if (existing) {
        const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
          password: item.password, user_metadata: { full_name: item.name }, app_metadata: { portal_role: item.key }
        });
        if (error || !data.user) return new Response(JSON.stringify({ error: "portal_account_update_failed", portal: item.key }), { status: 500, headers });
        userId = data.user.id;
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email, password: item.password, email_confirm: true,
          user_metadata: { full_name: item.name }, app_metadata: { portal_role: item.key }
        });
        if (error || !data.user) return new Response(JSON.stringify({ error: "portal_account_create_failed", portal: item.key }), { status: 409, headers });
        userId = data.user.id;
      }
      const { error: profileError } = await admin.from("profiles").upsert({
        id: userId, full_name: item.name, role: item.key, is_verified: true,
        student_number: null, grade: null, group_name: null
      }, { onConflict: "id" });
      if (profileError) return new Response(JSON.stringify({ error: "portal_profile_create_failed", portal: item.key }), { status: 500, headers });
    }

    const { data: consumed, error: consumeError } = await admin.rpc("consume_emad_portal_bootstrap", { p_token: bootstrapToken });
    if (consumeError || consumed !== true) return new Response(JSON.stringify({ error: "bootstrap_consume_failed" }), { status: 409, headers });
    return new Response(JSON.stringify({ message: "portal_accounts_created" }), { headers });
  }
  return new Response(JSON.stringify({ error: "unsupported_action" }), { status: 400, headers });
});