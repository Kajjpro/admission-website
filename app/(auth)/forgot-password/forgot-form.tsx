"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label } from "@/components/ui";

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email"));
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setPending(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Set or reset your password</h1>
      <p className="mt-1 text-sm text-slate-500">
        We'll email you a link. Counsellors whose account was made for them use this to choose their first password.
      </p>
      {sent ? (
        <p className="mt-6 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          If that email has an account, a link is on its way. Open it on this device.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Sending…" : "Email me a link"}</Button>
        </form>
      )}
      <p className="mt-6 text-sm text-slate-500">
        <Link href="/login" className="font-medium text-accent">Back to sign in</Link>
      </p>
    </>
  );
}
