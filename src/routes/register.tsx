import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { useState } from "react";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { PasswordStrength } from "@/components/PasswordStrength";
import { validateEmail, validatePassword, validateMobile } from "@/lib/auth";
import {
  cognitoConfirmRegisterBridgeFn,
  cognitoRegisterBridgeFn,
} from "@/backend/cognito-bridge.functions";
import { cognitoResendCodeFn } from "@/backend/cognito.functions";

export const Route = createFileRoute("/register")({
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const registerBridge = useServerFn(cognitoRegisterBridgeFn);
  const confirmBridge = useServerFn(cognitoConfirmRegisterBridgeFn);
  const resendCode = useServerFn(cognitoResendCodeFn);

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState<{ email: string; destination?: string } | null>(
    null,
  );
  const [code, setCode] = useState("");

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
          <h1 className="mt-5 text-center text-2xl font-bold">
            {needsConfirm ? "Verify your email" : "Create your account"}
          </h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {needsConfirm
              ? `Enter the 6-digit code sent to ${needsConfirm.destination ?? needsConfirm.email}.`
              : "Join the community making cities better."}
          </p>

          {!needsConfirm ? (
            <form
              className="mt-7 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement).value;
                const name = get("name").trim();
                const email = get("email").trim();
                const mobile = get("mobile");
                const pw = get("password");
                const confirm = get("confirm");

                const emailErr = validateEmail(email);
                if (emailErr) return toast.error(emailErr);
                const mobileErr = validateMobile(mobile);
                if (mobileErr) return toast.error(mobileErr);
                const passErr = validatePassword(pw);
                if (passErr) return toast.error(passErr);
                if (pw !== confirm) return toast.error("Passwords do not match.");

                setLoading(true);
                try {
                  const res = await registerBridge({
                    data: {
                      email,
                      password: pw,
                      name,
                      mobile: mobile.replace(/\D/g, ""),
                    },
                  });
                  if (res.confirmed) {
                    toast.success("Account created! You can log in now.");
                    setTimeout(() => navigate({ to: "/login" }), 1000);
                  } else {
                    toast.success("Verification code sent to your email.");
                    setNeedsConfirm({ email, destination: res.destination });
                  }
                } catch (err) {
                  const msg = err instanceof Error ? err.message : "Sign-up failed";
                  toast.error(
                    /UsernameExists|already/i.test(msg)
                      ? "An account with this email already exists. Please login."
                      : msg,
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Field id="name" label="Full Name" icon={User} placeholder="Your name" />
              <Field id="email" label="Email" icon={Mail} type="email" placeholder="you@email.com" />
              <Field id="mobile" label="Mobile Number" icon={Phone} type="tel" placeholder="9876543210" />
              <Field
                id="password"
                label="Password"
                icon={Lock}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
              />
              <PasswordStrength value={password} />
              <Field
                id="confirm"
                label="Confirm Password"
                icon={Lock}
                type="password"
                placeholder="••••••••"
              />
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? "Creating…" : "Create Account"} <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <form
              className="mt-7 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!code.trim()) return toast.error("Enter the verification code.");
                setLoading(true);
                try {
                  await confirmBridge({ data: { email: needsConfirm.email, code: code.trim() } });
                  toast.success("Email verified! Redirecting to login…");
                  setTimeout(() => navigate({ to: "/login" }), 1000);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Verification failed");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="hero" size="lg" className="flex-1" disabled={loading}>
                  {loading ? "Verifying…" : "Verify"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={async () => {
                    try {
                      await resendCode({ data: { email: needsConfirm.email } });
                      toast.success("New code sent.");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Resend failed");
                    }
                  }}
                >
                  Resend
                </Button>
              </div>
              <button
                type="button"
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setNeedsConfirm(null)}
              >
                ← Use a different email
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Secured by AWS Cognito
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const isPassword = type === "password";
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={inputType}
          placeholder={placeholder}
          className={isPassword ? "pl-9 pr-10" : "pl-9"}
          {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : {})}
          required
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
