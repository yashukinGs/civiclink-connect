import { createServerFn } from "@tanstack/react-start";
import {
  cognitoConfirmSignUp,
  cognitoSignIn,
  cognitoSignUp,
  getCognitoConfig,
} from "@/backend/cognito.server";

// Cognito → Supabase bridge.
//
// - Register: create Cognito user + a matching Supabase user (email-confirmed)
//   so the existing handle_new_user trigger populates profiles.
// - Login: authenticate Cognito, then mint a Supabase magic-link token so the
//   client can call supabase.auth.verifyOtp() and get a real Supabase session.
//   All existing RLS / roles / features keep working unchanged.

function randomPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return (
    "Cx1!" +
    Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  );
}

export const cognitoRegisterBridgeFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { email: string; password: string; name?: string; mobile?: string }) => input,
  )
  .handler(async ({ data }) => {
    const config = getCognitoConfig();

    // 1) Create the Cognito user (may require email code confirmation).
    const signUp = await cognitoSignUp(config, {
      email: data.email,
      password: data.password,
      name: data.name,
    });

    // 2) Ensure a Supabase user exists with the same email so profile trigger runs.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Try to find an existing user by email (paginate a bit — small demo user base).
    let existingId: string | null = null;
    for (let page = 1; page <= 5 && !existingId; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) break;
      const match = list.users.find(
        (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
      );
      if (match) existingId = match.id;
      if (list.users.length < 200) break;
    }

    if (!existingId) {
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: randomPassword(),
        email_confirm: true,
        user_metadata: {
          name: data.name ?? null,
          mobile: data.mobile ?? null,
        },
      });
      if (error && !/already/i.test(error.message)) {
        throw new Error(error.message);
      }
    }

    return {
      cognitoUserSub: signUp.UserSub,
      confirmed: signUp.UserConfirmed,
      destination: signUp.CodeDeliveryDetails?.Destination,
    };
  });

export const cognitoConfirmRegisterBridgeFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string }) => input)
  .handler(async ({ data }) => {
    const config = getCognitoConfig();
    await cognitoConfirmSignUp(config, data);
    return { ok: true };
  });

export const cognitoLoginBridgeFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => input)
  .handler(async ({ data }) => {
    const config = getCognitoConfig();

    // 1) Authenticate against Cognito. Throws on wrong credentials / unconfirmed user.
    await cognitoSignIn(config, data);

    // 2) Ensure Supabase user exists (self-heal if register bridge was skipped).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userId: string | null = null;
    for (let page = 1; page <= 5 && !userId; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) break;
      const match = list.users.find(
        (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
      );
      if (match) userId = match.id;
      if (list.users.length < 200) break;
    }

    if (!userId) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: randomPassword(),
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
      userId = created.user?.id ?? null;
    }

    // 3) Mint a magiclink and return its hashed token so the client can
    //    exchange it for a Supabase session via verifyOtp().
    const { data: link, error: linkErr } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: data.email,
      });
    if (linkErr || !link.properties?.hashed_token) {
      throw new Error(linkErr?.message ?? "Failed to mint Supabase session token");
    }

    return {
      email: data.email,
      tokenHash: link.properties.hashed_token,
    };
  });
