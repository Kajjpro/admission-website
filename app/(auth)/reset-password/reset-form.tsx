"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label } from "@/components/ui";

export function ResetForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm"))) return setError("The two passwords don't match.");
    setPending(true);
    setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    setPending(false);
    if (error) return setError(error.message);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Choose a password</h1>
      <p className="mt-1 text-sm text-slate-500">At least 8 characters.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <Label htmlFor="confirm">Repeat it</Label>
          <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving…" : "Save password"}</Button>
      </form>
    </>
  );
}
