"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { useAuth } from "@/lib/auth";
import { passwordError } from "@/lib/password";
import { PasswordField } from "@/components/PasswordField";

function AuthForm() {
  const params = useSearchParams();
  const initialMode = params.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      const pwErr = passwordError(password);
      if (pwErr) {
        setError(pwErr);
        return;
      }
    }

    setBusy(true);
    try {
      const user =
        mode === "login"
          ? await login(email, password)
          : await register(name, email, password);
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="surface animate-rise w-full max-w-md p-7">
        <Link href="/" className="display text-xl font-bold">
          Task<span style={{ color: "var(--brand)" }}>Flow</span>
        </Link>
        <h1 className="mt-5 text-2xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
          {mode === "login"
            ? "Sign in to continue to your workspace."
            : "Register as a normal user. Admin accounts are created by seeding only."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="label">Name</label>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <PasswordField
            value={password}
            onChange={setPassword}
            showRules={mode === "register"}
            label="Password"
          />
          {error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            className="font-semibold"
            style={{ color: "var(--brand)", background: "none", border: 0, cursor: "pointer" }}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading…</div>}>
      <AuthForm />
    </Suspense>
  );
}
