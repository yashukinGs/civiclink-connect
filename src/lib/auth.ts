import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Re-export validation helpers so existing imports keep working.
export {
  validateEmail,
  validatePassword,
  validateMobile,
  type AuthResult,
} from "./validation";

// ---- User session ----
export function useAuth(): { isLoggedIn: boolean; loading: boolean } {
  const [state, setState] = useState<{ isLoggedIn: boolean; loading: boolean }>({
    isLoggedIn: false,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ isLoggedIn: !!data.session, loading: false });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ isLoggedIn: !!session, loading: false });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function logout() {
  await supabase.auth.signOut();
}

// ---- Admin session ----
export function useAdminAuth(): { isAdmin: boolean; loading: boolean } {
  const [state, setState] = useState<{ isAdmin: boolean; loading: boolean }>({
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    async function check() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        if (active) setState({ isAdmin: false, loading: false });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (active) setState({ isAdmin: !!data, loading: false });
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange(() => check());

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

// Admin sign-out is the same as a normal sign-out (clears the session).
export async function adminLogout() {
  await supabase.auth.signOut();
}
