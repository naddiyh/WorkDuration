"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const requestedNext = new URLSearchParams(window.location.search).get(
      "next",
    );
    const next =
      requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : "/manage";
    const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.assign(next);
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a className="brand" href="/">
          <img className="brand-photo" src="/nade-profile.jpg" alt="Nade" />
          <span>Nade</span>
        </a>
        <p className="eyebrow">PRIVATE WORKSPACE</p>
        <h1>Login to manage your work time</h1>
        <p>Use the email address and password registered for this workspace.</p>
        <form onSubmit={signIn}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="nadiyah@company.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <Button className="primary-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        {message && <p className="auth-message">{message}</p>}
      </section>
    </main>
  );
}
