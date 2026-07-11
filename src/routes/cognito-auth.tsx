import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  cognitoConfirmSignUpFn,
  cognitoResendCodeFn,
  cognitoSignInFn,
  cognitoSignUpFn,
} from "@/backend/cognito.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/cognito-auth")({
  head: () => ({
    meta: [
      { title: "AWS Cognito Auth Demo" },
      { name: "description", content: "College project demo: sign up and sign in via AWS Cognito." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CognitoAuthPage,
});

function CognitoAuthPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            AWS Cognito Demo
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cognito Auth (Demo)</CardTitle>
            <CardDescription>
              This is an isolated demo of AWS Cognito sign-up and sign-in. Main app auth is
              unchanged.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
                <TabsTrigger value="confirm">Confirm</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-4">
                <SignInForm />
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <SignUpForm />
              </TabsContent>
              <TabsContent value="confirm" className="mt-4">
                <ConfirmForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-4 text-xs text-muted-foreground">
          Tokens are returned to the browser only for demo/inspection — nothing is persisted.
        </p>
      </div>
    </div>
  );
}

function SignInForm() {
  const signIn = useServerFn(cognitoSignInFn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<{ idToken: string; accessToken: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn({ data: { email, password } });
      setTokens({ idToken: res.idToken, accessToken: res.accessToken });
      toast.success("Signed in with Cognito");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="si-pass">Password</Label>
        <Input id="si-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      {tokens && (
        <div className="mt-3 rounded-md border bg-muted/40 p-3 text-xs">
          <div className="font-medium mb-1">ID Token (truncated)</div>
          <code className="break-all">{tokens.idToken.slice(0, 80)}…</code>
        </div>
      )}
    </form>
  );
}

function SignUpForm() {
  const signUp = useServerFn(cognitoSignUpFn);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signUp({ data: { email, password, name: name || undefined } });
      toast.success(
        res.confirmed
          ? "Account created and confirmed"
          : `Verification code sent to ${res.destination ?? email}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="su-name">Name (optional)</Label>
        <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="su-pass">Password</Label>
        <Input id="su-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <p className="text-xs text-muted-foreground">
          Must satisfy your Cognito pool's password policy.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}

function ConfirmForm() {
  const confirmSignUp = useServerFn(cognitoConfirmSignUpFn);
  const resendCode = useServerFn(cognitoResendCodeFn);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmSignUp({ data: { email, code } });
      toast.success("Email confirmed — you can sign in now");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    try {
      await resendCode({ data: { email } });
      toast.success("New code sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Resend failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="cf-email">Email</Label>
        <Input id="cf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cf-code">Verification code</Label>
        <Input id="cf-code" value={code} onChange={(e) => setCode(e.target.value)} required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Confirming…" : "Confirm"}
        </Button>
        <Button type="button" variant="outline" onClick={onResend}>
          Resend
        </Button>
      </div>
    </form>
  );
}
