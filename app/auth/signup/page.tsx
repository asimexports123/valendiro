"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      <div className="relative w-full max-w-md bg-background rounded-2xl border border-border/60 p-8 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center gap-2 mb-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            V
          </span>
          <h1 className="text-xl font-semibold text-foreground">Create Account</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Sign up to access the {SITE_NAME} dashboard.</p>
        {success ? (
          <div className="space-y-4">
            <p className="text-sm text-emerald-700 bg-emerald-50/50 border border-emerald-200 p-3 rounded-xl">
              Account created. Ask your admin to set your role to admin in Supabase, then{" "}
              <Link href="/auth/login" className="font-semibold underline">
                sign in
              </Link>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50 transition"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-foreground font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
