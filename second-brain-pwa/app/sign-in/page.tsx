"use client";

import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignInPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="min-h-full flex items-center justify-center px-4 py-8">
      <div
        className="w-full max-w-sm rounded-2xl border p-6"
        style={{
          background: "var(--gary-surface)",
          borderColor: "var(--gary-border)",
        }}
      >
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--gary-accent)" }}>
          Gary
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--gary-text-muted)" }}>
          Sign in to access your second brain.
        </p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-xs mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              style={{
                background: "var(--gary-bg)",
                borderColor: "var(--gary-border)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none"
                style={{
                  background: "var(--gary-bg)",
                  borderColor: "var(--gary-border)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 flex items-center justify-center"
                style={{ color: "var(--gary-text-muted)" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs" style={{ color: "var(--gary-error)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            style={{
              background: "var(--gary-accent)",
              color: "var(--gary-bg)",
            }}
          >
            <LogIn size={16} />
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
