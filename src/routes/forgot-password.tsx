import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  MailCheck,
  RotateCw,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { PasswordStrength } from "@/components/PasswordStrength";
import { validateEmail, validatePassword } from "@/lib/auth";
import {
  cognitoConfirmForgotPasswordFn,
  cognitoForgotPasswordFn,
} from "@/backend/cognito-bridge.functions";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
});

const COOLDOWN = 60;

type Step = "email" | "reset";

function ForgotPassword() {
  const navigate = useNavigate();
  const requestReset = useServerFn(cognitoForgotPasswordFn);
  const confirmReset = useServerFn(cognitoConfirmForgotPasswordFn);

  const [step, setStep] = useState<Step>("email");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [destination, setDestination] = useState<string | undefined>(undefined);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function friendlyError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (/LimitExceeded/i.test(msg)) return "Too many attempts. Please try again later.";
    if (/CodeMismatch/i.test(msg)) return "That code is incorrect. Please check and try again.";
    if (/ExpiredCode/i.test(msg)) return "That code has expired. Request a new one.";
    if (/InvalidPassword/i.test(msg)) return "Password does not meet the requirements.";
    if (/UserNotFound/i.test(msg))
      return "If an account exists for this email, a code has been sent.";
    return msg;
  }

  async function sendCode(target: string) {
    setBusy(true);
    try {
      const res = await requestReset({ data: { email: target.trim() } });
      setDestination(res.destination);
      setCooldown(COOLDOWN);
      return true;
    } catch (err) {
      // Don't reveal whether an account exists; still advance for UserNotFound.
      const msg = err instanceof Error ? err.message : "";
      if (/UserNotFound/i.test(msg)) {
        setDestination(undefined);
        setCooldown(COOLDOWN);
        return true;
      }
      toast.error(friendlyError(err));
      return false;
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

          {step === "email" ? (
            <>
              <h1 className="mt-5 text-center text-2xl font-bold">Forgot password?</h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Enter your email and we'll send you a verification code.
              </p>

              <form
                className="mt-7 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const emailErr = validateEmail(email);
                  if (emailErr) {
                    toast.error(emailErr);
                    return;
                  }
                  const ok = await sendCode(email);
                  if (ok) setStep("reset");
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                  {busy ? "Sending…" : "Send verification code"} <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <p className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <ArrowLeft className="h-3.5 w-3.5" />
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Back to login
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="mt-5 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <MailCheck className="h-6 w-6" />
                </div>
              </div>
              <h1 className="mt-4 text-center text-2xl font-bold">Enter code & new password</h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-foreground">
                  {destination ?? email}
                </span>
                .
              </p>

              <form
                className="mt-7 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!/^\d{6}$/.test(code)) {
                    toast.error("Enter the 6-digit code from your email.");
                    return;
                  }
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
                    await confirmReset({
                      data: { email: email.trim(), code, newPassword: password },
                    });
                    toast.success("Password updated! Redirecting to login…");
                    setTimeout(() => navigate({ to: "/login" }), 700);
                  } catch (err) {
                    toast.error(friendlyError(err));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="code">Verification code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="pl-9 tracking-[0.4em]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
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
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                  {busy ? "Updating…" : "Update password"} <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <Button
                variant="glass"
                size="lg"
                className="mt-3 w-full"
                disabled={busy || cooldown > 0}
                onClick={async () => {
                  const ok = await sendCode(email);
                  if (ok) toast.success("A new code was sent.");
                }}
              >
                <RotateCw className="h-4 w-4" />
                {cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : busy
                    ? "Sending…"
                    : "Resend code"}
              </Button>

              <p className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <ArrowLeft className="h-3.5 w-3.5" />
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="font-semibold text-primary hover:underline"
                >
                  Use a different email
                </button>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
