import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminAccount, verifyAdminCode } from "@/backend/auth.functions";


export const Route = createFileRoute("/admin")({
  component: AdminAuth,
});

function AdminAuth() {
  const navigate = useNavigate();
  const doEnsureAdmin = useServerFn(ensureAdminAccount);
  const doVerifyCode = useServerFn(verifyAdminCode);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  // Make sure the single admin account exists so the credentials always work.
  useEffect(() => {
    doEnsureAdmin().catch(() => undefined);
  }, [doEnsureAdmin]);

  async function handleAdmin(code: string, password: string) {
    if (!code.trim()) return toast.error("Admin access code is required.");
    if (!password) return toast.error("Password is required.");

    setBusy(true);
    try {
      // Ensure the account is provisioned, then validate the secret code.
      await doEnsureAdmin().catch(() => undefined);

      let email: string;
      try {
        ({ email } = await doVerifyCode({ data: { code } }));
      } catch {
        toast.error("Invalid admin access code.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error("Invalid admin password.");
        return;
      }

      toast.success("Admin login successful! Redirecting…");
      setTimeout(() => navigate({ to: "/admin-dashboard" }), 600);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }


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
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" /> Authority Access
          </div>
          <h1 className="mt-2 text-center text-2xl font-bold">Admin Login</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Enter your secret access code and password. No email required.
          </p>

          <form
            className="mt-7 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const code = (form.elements.namedItem("code") as HTMLInputElement).value;
              const password = (form.elements.namedItem("password") as HTMLInputElement).value;
              await handleAdmin(code, password);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="code">Admin Access Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="code"
                  name="code"
                  type="text"
                  autoComplete="off"
                  placeholder="CIVIC-ADMIN-XXXX"
                  className="pl-9 uppercase tracking-wide"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
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
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
              {busy ? "Verifying…" : "Login as Admin"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-border/60 bg-secondary/40 p-3 text-center text-xs text-muted-foreground">
            Admin access is restricted to a single secret code. Keep your access code and
            password private — anyone with both can manage all reports.
          </div>

          <div className="mt-4 flex flex-col items-center gap-1 text-center">
            <Button asChild variant="link" size="sm">
              <Link to="/admin-register">Register a new admin account</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">
                <ArrowLeft className="h-4 w-4" /> Back to user login
              </Link>
            </Button>
          </div>


        </motion.div>
      </div>
    </div>
  );
}
