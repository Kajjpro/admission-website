"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Copy, Printer, Wand2 } from "lucide-react";
import { saveLetterBody, setLetterStatus } from "@/app/actions/letters";
import { Button, Card, CardHeader, buttonClass } from "@/components/ui";
import { cn, countWords } from "@/lib/utils";
import type { LetterStatus } from "@/lib/types";

export function LetterEditor({ id, initial, status, outline }: { id: string; initial: string; status: LetterStatus; outline: string }) {
  const [body, setBody] = useState(initial);
  const [saveState, setSaveState] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const saved = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (body === saved.current) return;
    setSaveState("Unsaved");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await saveLetterBody(id, body);
      if ("error" in res && res.error) return setSaveState(`Couldn't save: ${res.error}`);
      saved.current = body;
      setSaveState("Saved");
    }, 800);
    return () => clearTimeout(timer.current);
  }, [body, id]);

  const words = countWords(body);
  const done = status === "done";

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Letter"
        description={`${words} words${words ? (words < 350 ? " · most counsellor letters run 400–700" : words > 900 ? " · long; readers skim past ~800" : "") : ""}${saveState ? ` · ${saveState}` : ""}`}
        action={
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              disabled={!body.trim()}
              onClick={async () => {
                await navigator.clipboard.writeText(body);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Link href={`/counselor/letters/${id}/print`} className={buttonClass("secondary", "sm")}>
              <Printer className="size-3.5" />
              Print / PDF
            </Link>
          </div>
        }
      />
      {!body.trim() && (
        <div className="flex items-center gap-3 border-b border-line bg-slate-50 px-5 py-3 text-sm">
          <span className="flex-1 text-slate-600">Start from an outline filled in with this student's details.</span>
          <Button size="sm" variant="secondary" onClick={() => setBody(outline)}>
            <Wand2 className="size-3.5" />
            Insert outline
          </Button>
        </div>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-[60vh] w-full flex-1 resize-none bg-transparent px-6 py-5 font-serif text-[17px] leading-relaxed text-navy outline-none placeholder:text-slate-400"
        placeholder="Dear Admissions Committee,"
        spellCheck
      />
      <div className="flex flex-wrap items-center gap-3 border-t border-line p-4">
        {done ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><Check className="size-4" />Marked finished. The student sees "Written".</span>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => void (await setLetterStatus(id, "writing")))} className="ml-auto">
              Reopen
            </Button>
          </>
        ) : (
          <>
            <Button disabled={pending || words < 50} onClick={() => start(async () => void (await setLetterStatus(id, "done")))}>
              <Check className="size-4" />
              Mark finished
            </Button>
            <span className={cn("text-xs text-slate-500")}>The student only sees the status, never the text.</span>
          </>
        )}
      </div>
    </Card>
  );
}
