import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { PasswordStrength } from "@/components/PasswordStrength";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  // A recovery link establishes a temporary session. Supabase may deliver it
  // either as a hash (#access_token=...&type=recovery) or as a PKCE code
  // (?code=...). Handle both explicitly so the form is always usable.
  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const url = new URL(window.location.href);

        // Error returned in the URL from Supabase (expired/invalid link)
        const errorDesc =
          url.searchParams.get("error_description") ||
          new URLSearchParams(url.hash.replace(/^#/, "")).get("error_description");
        if (errorDesc) {
          if (active) setLinkError(decodeURIComponent(errorDesc));
          return;
        }

        // PKCE flow: ?code=...
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (active) setLinkError("This reset link is invalid or has expired. Please request a new one.");
            return;
          }
          // Clean the code out of the URL
          window.history.replaceState({}, "", url.pathname);
        }

        // Implicit flow tokens land in the hash and are parsed by supabase-js
        // automatically when detectSessionInUrl is on. Give it a tick, then check.
        const { data } = await supabase.auth.getSession();
        if (active && data.session) {
          setReady(true);
          return;
        }
      } catch {
        if (active) setLinkError("Could not verify this reset link. Please request a new one.");
      }
    }

    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setLinkError(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-hero-glow opacity-60" />
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card w-full rounded-3xl p-8"
        >
          <div className="flex justify-center">
            <Logo showText={false} />
          </div>
          <h1 className="mt-5 text-center text-2xl font-bold">Set a new password</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {linkError
              ? linkError
              : ready
                ? "Choose a strong password for your account."
                : "Verifying your reset link…"}
          </p>

          {linkError && (
            <Button
              variant="hero"
              size="lg"
              className="mt-6 w-full"
              onClick={() => navigate({ to: "/forgot-password" })}
            >
              Request a new reset link <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          <form
            className="mt-7 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const password = (form.elements.namedItem("password") as HTMLInputElement).value;
              const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;
              const pwErr = validatePassword(password);
              if (pwErr) {
                toast.error(pwErr);
                return;
              }
              if (password !== confirm) {
                toast.error("Passwords do not match.");
                return;
              }
              setBusy(true);
              try {
                const { error } = await supabase.auth.updateUser({ password });
                if (error) {
                  toast.error("Could not update password. Request a new reset link.");
                  return;
                }
                toast.success("Password updated! Redirecting to login…");
                await supabase.auth.signOut();
                setTimeout(() => navigate({ to: "/login" }), 700);
              } catch {
                toast.error("Something went wrong. Please try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength value={password} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm"
                  name="confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy || !ready}>
              {busy ? "Updating…" : "Update password"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
