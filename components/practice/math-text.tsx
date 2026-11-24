import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";

/** Markdown with LaTeX math ($...$ and $$...$$). */
export function MathText({ children, className, inline }: { children: string; className?: string; inline?: boolean }) {
  return (
    <div
      className={cn(
        "prose prose-slate max-w-none prose-p:my-2 prose-table:my-3 prose-table:text-sm prose-th:text-left prose-td:py-1.5 prose-th:py-1.5",
        inline && "prose-p:my-0 [&>p]:inline",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
