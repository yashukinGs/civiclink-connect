import { createServerFn } from "@tanstack/react-start";

/**
 * Admin access is code-based. Secrets live in server-side env vars (never in
 * source). Configure ADMIN_EMAIL, ADMIN_CODE, ADMIN_PASSWORD, and
 * ADMIN_REGISTRATION_CODE via the Lovable Cloud secrets store.
 */
function getAdminSecrets() {
  const email = process.env.ADMIN_EMAIL;
  const code = process.env.ADMIN_CODE;
  const password = process.env.ADMIN_PASSWORD;
  const registrationCode = process.env.ADMIN_REGISTRATION_CODE;
  if (!email || !code || !password || !registrationCode) {
    throw new Error("Admin secrets are not configured on the server.");
  }
  return { email, code, password, registrationCode };
}

// Make sure the single administrator account exists and holds the admin role.
// Idempotent: if the account already exists its password is left untouched.
export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ ready: boolean }> => {
    const { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = getAdminSecrets();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve the admin auth user (create if missing).
    let userId: string | undefined;
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });

    if (created?.user?.id) {
      userId = created.user.id;
    } else if (createErr) {
      // Already exists — look up the id from the profiles table.
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", ADMIN_EMAIL)
        .maybeSingle();
      userId = prof?.id;
    }

    if (!userId) return { ready: false };

    // Ensure the admin role is granted (ignore duplicate errors).
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!existingRole) {
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
    }

    return { ready: true };
  },
);

// Verify the secret admin access code and return the internal login email.
// The password (checked by Supabase during sign-in) is the real secret.
export const verifyAdminCode = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }): Promise<{ email: string }> => {
    if ((data.code ?? "").trim().toUpperCase() !== ADMIN_CODE) {
      throw new Error("Invalid admin access code.");
    }
    return { email: ADMIN_EMAIL };
  });

// Register a new administrator. The caller must supply the secret admin
// registration code. On success the account is created (email auto-confirmed)
// and granted the `admin` role.
export const registerAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { code: string; email: string; password: string; name?: string }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: true; userId: string }> => {
    const code = (data.code ?? "").trim().toUpperCase();
    const email = (data.email ?? "").trim().toLowerCase();
    const password = data.password ?? "";
    const name = (data.name ?? "").trim();

    if (code !== ADMIN_REGISTRATION_CODE) {
      throw new Error("Invalid admin registration code.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("A valid email is required.");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Create the auth user (email pre-confirmed so they can sign in immediately).
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: name ? { name } : undefined,
    });

    if (createErr || !created?.user?.id) {
      if (createErr && /already|exists|registered/i.test(createErr.message)) {
        throw new Error("An account with this email already exists.");
      }
      throw new Error(createErr?.message ?? "Failed to create admin account.");
    }

    const userId = created.user.id;

    // Grant admin role (idempotent).
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!existingRole) {
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      if (roleErr) throw new Error(roleErr.message);
    }

    return { ok: true, userId };
  });
