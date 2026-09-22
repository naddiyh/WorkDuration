"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const requestedNext = new URLSearchParams(window.location.search).get("next");
    const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/manage";
    const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` }
    });
    setLoading(false);
    setMessage(error ? error.message : "Check your email for a secure sign-in link.");
  }

  return <main className="auth-shell"><section className="auth-card"><a className="brand" href="/"><img className="brand-photo" src="/nade-profile.jpg" alt="Nade" /><span>Nade</span></a><p className="eyebrow">PRIVATE WORKSPACE</p><h1>Sign in to manage your hours.</h1><p>Enter Nadiyah&apos;s email address and we&apos;ll send a secure sign-in link.</p><form onSubmit={signIn}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="nadiyah@company.com" /></label><Button className="primary-button" disabled={loading}>{loading ? "Sending link..." : "Send sign-in link"}</Button></form>{message && <p className="auth-message">{message}</p>}</section></main>;
}
