"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const INVALID_CREDENTIALS = "Invalid email or password";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      setErrorMessage(INVALID_CREDENTIALS);
      setPending(false);
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("jf_admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (adminError || !admin) {
      await supabase.auth.signOut();
      setErrorMessage(INVALID_CREDENTIALS);
      setPending(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-1" htmlFor="email">
        <span>Email</span>
        <input
          autoComplete="email"
          className="min-h-11 rounded border px-3"
          id="email"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="grid gap-1" htmlFor="password">
        <span>Password</span>
        <input
          autoComplete="current-password"
          className="min-h-11 rounded border px-3"
          id="password"
          name="password"
          required
          type="password"
        />
      </label>
      {errorMessage ? <p aria-live="polite" role="alert">{errorMessage}</p> : null}
      <button className="min-h-11 rounded border px-4 disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}