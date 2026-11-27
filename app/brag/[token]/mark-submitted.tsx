"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { teacherMarkSubmitted } from "@/app/actions/brag";
import { Button } from "@/components/ui";

export function MarkSubmitted({ token, submitted }: { token: string; submitted: boolean }) {
  const [done, setDone] = useState(submitted);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <Check className="size-4" />
        Letter marked as submitted. Thank you.
      </p>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await teacherMarkSubmitted(token);
            if (res?.error) setError(res.error);
            else setDone(true);
          })
        }
      >
        <Check className="size-4" />
        I've submitted the letter
      </Button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
