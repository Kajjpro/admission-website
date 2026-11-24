"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Plus, X } from "lucide-react";
import { saveGuide } from "@/app/actions/admin";
import { Button, Card, CardHeader, Input, Label, Select, Textarea } from "@/components/ui";
import { GUIDE_CATEGORIES, KNOWN_SOURCES } from "@/lib/constants";
import type { Guide, SourceAttribution } from "@/lib/types";

export function GuideEditor({ guide }: { guide: Guide | null }) {
  const [content, setContent] = useState(guide?.content_markdown ?? "");
  const [preview, setPreview] = useState(false);
  const [sources, setSources] = useState<SourceAttribution[]>(guide?.source_attribution ?? []);

  const updateSource = (i: number, patch: Partial<SourceAttribution>) =>
    setSources(sources.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <form action={saveGuide} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {guide && <input type="hidden" name="id" value={guide.id} />}
      <input type="hidden" name="source_attribution" value={JSON.stringify(sources)} />

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={guide?.title} />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required defaultValue={guide?.slug} placeholder="values-exercise" />
          </div>
        </div>
        <div>
          <Label htmlFor="summary">Summary</Label>
          <Input id="summary" name="summary" defaultValue={guide?.summary ?? ""} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="content_markdown" className="mb-0">Content (Markdown)</Label>
            <button type="button" onClick={() => setPreview(!preview)} className="text-xs font-medium text-accent">
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
          {preview ? (
            <Card className="prose-guide min-h-[420px] p-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </Card>
          ) : null}
          <Textarea
            id="content_markdown"
            name="content_markdown"
            rows={22}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={preview ? "hidden" : "font-mono text-[13px]"}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Settings" />
          <div className="space-y-3 p-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" defaultValue={guide?.category ?? "ps"}>
                {Object.entries(GUIDE_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="published" defaultChecked={guide?.published ?? true} className="size-4 accent-accent" />
              Published
            </label>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Source attribution"
            description="Shown as badges and in the Sources drawer."
            action={
              <Button size="sm" variant="ghost" onClick={() => setSources([...sources, { platform: KNOWN_SOURCES[0] }])}>
                <Plus className="size-3.5" />
                Add
              </Button>
            }
          />
          <div className="space-y-4 p-4">
            {sources.map((s, i) => (
              <div key={i} className="relative space-y-2 rounded-md border border-line p-3">
                <button type="button" onClick={() => setSources(sources.filter((_, j) => j !== i))} className="absolute right-2 top-2 text-slate-400 hover:text-rose-600" aria-label="Remove source">
                  <X className="size-3.5" />
                </button>
                <div>
                  <Label>Platform</Label>
                  <Input list="known-sources" value={s.platform} onChange={(e) => updateSource(i, { platform: e.target.value })} />
                </div>
                <Input placeholder="Title" value={s.title ?? ""} onChange={(e) => updateSource(i, { title: e.target.value })} />
                <Input placeholder="Author" value={s.author ?? ""} onChange={(e) => updateSource(i, { author: e.target.value })} />
                <Input placeholder="https://" type="url" value={s.url ?? ""} onChange={(e) => updateSource(i, { url: e.target.value || undefined })} />
              </div>
            ))}
            {!sources.length && <p className="text-xs text-slate-500">No sources. Original school content.</p>}
            <datalist id="known-sources">
              {KNOWN_SOURCES.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
        </Card>

        <Button type="submit" className="w-full">Save guide</Button>
      </div>
    </form>
  );
}
