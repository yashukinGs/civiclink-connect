import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  KeyRound,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { PasswordStrength } from "@/components/PasswordStrength";
import { registerAdmin } from "@/lib/auth.functions";
import { validateEmail, validatePassword } from "@/lib/auth";

export const Route = createFileRoute("/admin-register")({
  component: AdminRegister,
});

function AdminRegister() {
  const navigate = useNavigate();
  const doRegister = useServerFn(registerAdmin);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-hero-glow opacity-60" />
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card w-full rounded-3xl p-8"
        >
          <div className="flex justify-center">
            <Logo showText={false} />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" /> Authority Registration
          </div>
          <h1 className="mt-2 text-center text-2xl font-bold">Register Admin</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Requires the Secret Admin Code issued to authority personnel.
          </p>

          <form
            className="mt-7 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const get = (n: string) =>
                (form.elements.namedItem(n) as HTMLInputElement).value;
              const code = get("code").trim();
              const name = get("name").trim();
              const email = get("email").trim();
              const pw = get("password");
              const confirm = get("confirm");

              if (!code) return toast.error("Secret Admin Code is required.");
              const emailErr = validateEmail(email);
              if (emailErr) return toast.error(emailErr);
              const passErr = validatePassword(pw);
              if (passErr) return toast.error(passErr);
              if (pw !== confirm) return toast.error("Passwords do not match.");

              setBusy(true);
              try {
                await doRegister({ data: { code, email, password: pw, name } });
                toast.success("Admin account created! You can now sign in.");
                setTimeout(() => navigate({ to: "/admin" }), 800);
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Registration failed.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="code">Secret Admin Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="code"
                  name="code"
                  type="text"
                  autoComplete="off"
                  placeholder="CIVIC-REGISTER-XXXX"
                  className="pl-9 uppercase tracking-wide"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" name="name" placeholder="Your name" className="pl-9" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@authority.gov"
                  className="pl-9"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <PasswordStrength value={password} />

            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
              {busy ? "Creating…" : "Create Admin Account"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-border/60 bg-secondary/40 p-3 text-center text-xs text-muted-foreground">
            The Secret Admin Code is validated on the server. Only authority personnel with the
            current code can create admin accounts.
          </div>

          <div className="mt-4 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4" /> Back to admin login
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
