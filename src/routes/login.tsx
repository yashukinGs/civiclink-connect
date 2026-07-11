import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { validateEmail } from "@/lib/auth";
import { cognitoLoginBridgeFn } from "@/backend/cognito-bridge.functions";



export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const destination = redirect === "/report" ? "/report" : "/";
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const cognitoLogin = useServerFn(cognitoLoginBridgeFn);


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
          <h1 className="mt-5 text-center text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Login to continue improving your city.
          </p>

          <form
            className="mt-7 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const email = (form.elements.namedItem("email") as HTMLInputElement).value;
              const password = (form.elements.namedItem("password") as HTMLInputElement).value;
              const emailErr = validateEmail(email);
              if (emailErr) {
                toast.error(emailErr);
                return;
              }
              if (!password) {
                toast.error("Password is required.");
                return;
              }
              setLoading(true);
              try {
                const { tokenHash } = await cognitoLogin({ data: { email, password } });
                const { error } = await supabase.auth.verifyOtp({
                  token_hash: tokenHash,
                  type: "magiclink",
                });
                if (error) {
                  toast.error("Signed in with Cognito, but session bridge failed.");
                  return;
                }
                toast.success("Logged in! Redirecting…");
                setTimeout(() => navigate({ to: destination }), 500);
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Login failed";
                toast.error(
                  /NotAuthorized|Incorrect|password/i.test(msg)
                    ? "Invalid email or password."
                    : /UserNotConfirmed/i.test(msg)
                      ? "Please verify your email first (check your inbox for the code)."
                      : msg,
                );
              } finally {
                setLoading(false);
              }
            }}
          >

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="you@email.com" className="pl-9" required />
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
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full">
              Login <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Link to="/cognito-auth" className="mt-4 block">
            <Button type="button" variant="outline" size="lg" className="w-full">
              Login with AWS Cognito
            </Button>
          </Link>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Are you an authority?{" "}
            <Link to="/admin" className="text-primary hover:underline">
              Admin login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
