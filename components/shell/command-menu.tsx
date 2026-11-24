"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { BookOpen, Building2, FileText } from "lucide-react";
import { getSearchIndex, type SearchItem } from "@/app/actions/search";
import type { NavItem } from "./app-shell";

const GROUP_ICONS = { Guides: BookOpen, Essays: FileText, Universities: Building2 };

export function CommandMenu({
  open,
  onOpenChange,
  nav,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nav: NavItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<SearchItem[] | null>(null);

  useEffect(() => {
    if (open && !items) getSearchIndex().then(setItems).catch(() => setItems([]));
  }, [open, items]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  const groups = (["Essays", "Guides", "Universities"] as const).map((group) => ({
    group,
    entries: (items ?? []).filter((i) => i.group === group),
  }));

  const itemClass =
    "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-slate-700 data-[selected=true]:bg-slate-100 data-[selected=true]:text-navy";
  const groupClass =
    "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-400";

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search"
      overlayClassName="fixed inset-0 z-40 bg-navy/20"
      contentClassName="fixed left-1/2 top-[18vh] z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-lg border border-line bg-white shadow-xl"
    >
      <Command.Input
        placeholder="Search pages, essays, guides, universities…"
        className="h-12 w-full border-b border-line px-4 text-sm outline-none placeholder:text-slate-400"
      />
      <Command.List className="max-h-[360px] overflow-y-auto p-1.5">
        <Command.Empty className="px-3 py-6 text-center text-sm text-slate-500">
          {items ? "No results." : "Loading…"}
        </Command.Empty>
        <Command.Group heading="Go to" className={groupClass}>
          {nav.map((n) => (
            <Command.Item key={n.href} value={`page ${n.label}`} onSelect={() => go(n.href)} className={itemClass}>
              <n.icon className="size-4 text-slate-400" />
              {n.label}
            </Command.Item>
          ))}
        </Command.Group>
        {groups.map(({ group, entries }) => {
          if (!entries.length) return null;
          const Icon = GROUP_ICONS[group];
          return (
            <Command.Group key={group} heading={group} className={groupClass}>
              {entries.map((item) => (
                <Command.Item
                  key={`${group}-${item.id}`}
                  value={`${group} ${item.label} ${item.hint ?? ""}`}
                  onSelect={() => go(item.href)}
                  className={itemClass}
                >
                  <Icon className="size-4 text-slate-400" />
                  <span className="truncate">{item.label}</span>
                  {item.hint && <span className="ml-auto text-xs text-slate-400">{item.hint}</span>}
                </Command.Item>
              ))}
            </Command.Group>
          );
        })}
      </Command.List>
    </Command.Dialog>
  );
}
