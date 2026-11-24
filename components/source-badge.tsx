import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceAttribution } from "@/lib/types";

const PLATFORM_STYLES: Record<string, string> = {
  "College Essay Guy": "border-indigo-200 bg-indigo-50 text-indigo-700",
  "Hack the College Essay": "border-amber-200 bg-amber-50 text-amber-800",
  "stoic.education": "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function SourceBadge({ source, className }: { source: SourceAttribution; className?: string }) {
  const style = PLATFORM_STYLES[source.platform] ?? "border-slate-200 bg-slate-50 text-slate-700";
  const content = (
    <>
      {source.platform}
      {source.url && <ExternalLink className="size-3 opacity-60" />}
    </>
  );
  const classes = cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium", style, className);

  return source.url ? (
    <a href={source.url} target="_blank" rel="noreferrer" className={classes}>
      {content}
    </a>
  ) : (
    <span className={classes}>{content}</span>
  );
}

/** Full citation line: Title — Author, Platform. */
export function Citation({ source }: { source: SourceAttribution }) {
  return (
    <div className="space-y-1.5">
      <SourceBadge source={source} />
      {source.title && <p className="text-sm font-medium">{source.title}</p>}
      {source.author && <p className="text-xs text-slate-500">{source.author}</p>}
      {source.url && (
        <a href={source.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-accent hover:underline">
          {source.url.replace(/^https?:\/\//, "")}
        </a>
      )}
    </div>
  );
}
