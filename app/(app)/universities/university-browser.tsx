"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { addToList, removeFromList, updateListItem } from "@/app/actions/universities";
import { Badge, Button, Card, CardHeader, Input, Select } from "@/components/ui";
import { APPLICATION_STATUS, REGIONS } from "@/lib/constants";
import { RANK_BANDS, nextDeadline, rankBand } from "@/lib/universities";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import type { ApplicationStatus, University, UserUniversity } from "@/lib/types";

type Sort = "rank" | "deadline" | "name";

export function UniversityBrowser({
  universities,
  myList,
  initialQuery,
  isStudent,
  isAdmin,
  targetRegions,
}: {
  universities: University[];
  myList: UserUniversity[];
  initialQuery: string;
  isStudent: boolean;
  isAdmin: boolean;
  targetRegions: string[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [band, setBand] = useState("");
  const [within, setWithin] = useState("");
  const [sort, setSort] = useState<Sort>("deadline");
  const [expanded, setExpanded] = useState<string | null>(initialQuery ? universities.find((u) => u.name === initialQuery)?.id ?? null : null);

  const listByUni = new Map(myList.map((l) => [l.university_id, l]));
  const countries = useMemo(
    () => [...new Set(universities.filter((u) => !region || u.region === region).map((u) => u.country))].sort(),
    [universities, region],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const maxRank = RANK_BANDS.find((b) => b.id === band)?.max;
    const minRank = band ? (RANK_BANDS[RANK_BANDS.findIndex((b) => b.id === band) - 1]?.max ?? 0) : 0;
    const rows = universities
      .map((u) => ({ uni: u, next: nextDeadline(u) }))
      .filter(({ uni, next }) => {
        if (q && !`${uni.name} ${uni.country} ${uni.city ?? ""}`.toLowerCase().includes(q)) return false;
        if (region && uni.region !== region) return false;
        if (country && uni.country !== country) return false;
        if (maxRank && !(uni.qs_rank && uni.qs_rank > minRank && uni.qs_rank <= maxRank)) return false;
        if (within && !(next && daysUntil(next.date!) <= Number(within))) return false;
        return true;
      });

    return rows.sort((a, b) => {
      if (sort === "name") return a.uni.name.localeCompare(b.uni.name);
      if (sort === "rank") return (a.uni.qs_rank ?? 9999) - (b.uni.qs_rank ?? 9999);
      const ad = a.next?.date ?? "9999";
      const bd = b.next?.date ?? "9999";
      return ad.localeCompare(bd) || (a.uni.qs_rank ?? 9999) - (b.uni.qs_rank ?? 9999);
    });
  }, [universities, query, region, country, band, within, sort]);

  const mine = myList
    .map((l) => ({ item: l, uni: universities.find((u) => u.id === l.university_id)! }))
    .filter((r) => r.uni)
    .map((r) => ({ ...r, next: nextDeadline(r.uni, r.item.round) ?? nextDeadline(r.uni) }))
    .sort((a, b) => (a.next?.date ?? "9999").localeCompare(b.next?.date ?? "9999"));

  return (
    <div className="space-y-6">
      {isStudent && (
        <Card>
          <CardHeader title="My list" description={mine.length ? `${mine.length} universities` : "Add universities below to track their deadlines on your dashboard."} />
          {mine.length > 0 && (
            <ul className="divide-y divide-line">
              {mine.map(({ item, uni, next }) => (
                <MyListRow key={item.id} item={item} uni={uni} next={next} />
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, city, country" className="pl-8" />
        </div>
        <Select value={region} onChange={(e) => { setRegion(e.target.value); setCountry(""); }} className="w-auto">
          <option value="">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}{targetRegions.includes(r) ? " ★" : ""}</option>
          ))}
        </Select>
        <Select value={country} onChange={(e) => setCountry(e.target.value)} className="w-auto">
          <option value="">All countries</option>
          {countries.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select value={band} onChange={(e) => setBand(e.target.value)} className="w-auto">
          <option value="">Any QS rank</option>
          {RANK_BANDS.map((b) => <option key={b.id} value={b.id}>QS {b.label}</option>)}
        </Select>
        <Select value={within} onChange={(e) => setWithin(e.target.value)} className="w-auto">
          <option value="">Any deadline</option>
          <option value="30">Next 30 days</option>
          <option value="60">Next 60 days</option>
          <option value="90">Next 90 days</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-auto sm:ml-auto">
          <option value="deadline">Sort: next deadline</option>
          <option value="rank">Sort: QS rank</option>
          <option value="name">Sort: name</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,1fr)_90px_190px_120px_32px] gap-4 border-b border-line bg-slate-50 px-5 py-2 text-xs font-medium text-slate-500 md:grid">
          <span>University</span>
          <span>QS 2026</span>
          <span>Next deadline</span>
          <span>Platform</span>
          <span />
        </div>
        <ul className="divide-y divide-line">
          {filtered.map(({ uni, next }) => (
            <UniversityRow
              key={uni.id}
              uni={uni}
              next={next}
              open={expanded === uni.id}
              onToggle={() => setExpanded(expanded === uni.id ? null : uni.id)}
              listItem={listByUni.get(uni.id)}
              isStudent={isStudent}
              isAdmin={isAdmin}
            />
          ))}
          {!filtered.length && <li className="px-5 py-10 text-center text-sm text-slate-500">No universities match these filters.</li>}
        </ul>
      </Card>
      <p className="text-xs text-slate-500">
        {universities.length} universities. Rankings are approximate positions in the QS World University Rankings 2026 and are shown as bands.
        Deadlines are for first-year undergraduate entry in fall 2027 unless noted.
      </p>
    </div>
  );
}

function Countdown({ date }: { date: string }) {
  const days = daysUntil(date);
  const tone = days <= 14 ? "rose" : days <= 45 ? "amber" : "neutral";
  return <Badge tone={tone} className="tabular-nums">{days === 0 ? "Today" : `${days}d`}</Badge>;
}

function UniversityRow({
  uni,
  next,
  open,
  onToggle,
  listItem,
  isStudent,
  isAdmin,
}: {
  uni: University;
  next: ReturnType<typeof nextDeadline>;
  open: boolean;
  onToggle: () => void;
  listItem?: UserUniversity;
  isStudent: boolean;
  isAdmin: boolean;
}) {
  const [round, setRound] = useState(listItem?.round ?? next?.round ?? uni.deadlines[0]?.round ?? "");
  const [pending, start] = useTransition();
  const upcoming = uni.deadlines.find((d) => !d.date);

  return (
    <li>
      <button onClick={onToggle} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 text-left hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_90px_190px_120px_32px]">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {uni.name}
            {listItem && <span className="ml-2 text-xs font-normal text-accent">On my list</span>}
          </p>
          <p className="truncate text-xs text-slate-500">{[uni.city, uni.country].filter(Boolean).join(", ")}</p>
        </div>
        <span className="hidden text-sm tabular-nums text-slate-600 md:block">{rankBand(uni.qs_rank)}</span>
        <div className="hidden min-w-0 md:block">
          {next ? (
            <div className="flex items-center gap-2">
              <Countdown date={next.date!} />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{formatDate(next.date)}</p>
                <p className="truncate text-[11px] text-slate-500">{next.round}</p>
              </div>
            </div>
          ) : (
            <p className="truncate text-xs text-slate-500">{upcoming?.window ?? "All rounds passed"}</p>
          )}
        </div>
        <span className="hidden truncate text-xs text-slate-500 md:block">{uni.platform}</span>
        <ChevronDown className={cn("size-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="grid gap-6 border-t border-line bg-slate-50/60 px-5 py-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deadlines · {uni.cycle}</h3>
                  <Badge tone={uni.deadline_status === "confirmed" ? "emerald" : "amber"}>
                    {uni.deadline_status === "confirmed" ? "Confirmed" : "Estimated"}
                  </Badge>
                </div>
                <ul className="space-y-2">
                  {uni.deadlines.map((d) => {
                    const passed = d.date ? daysUntil(d.date) < 0 : false;
                    return (
                      <li key={d.round} className={cn("rounded-md border border-line bg-white px-3 py-2", passed && "opacity-60")}>
                        <div className="flex items-center gap-2">
                          <p className={cn("flex-1 text-sm font-medium", passed && "line-through")}>{d.round}</p>
                          {d.date ? (
                            <>
                              <span className="text-sm tabular-nums">{formatDate(d.date)}</span>
                              {passed ? <Badge>Passed</Badge> : <Countdown date={d.date} />}
                            </>
                          ) : (
                            <Badge tone="neutral">Date TBA</Badge>
                          )}
                        </div>
                        {d.window && <p className="mt-0.5 text-xs text-slate-500">{d.window}</p>}
                        {d.note && <p className="mt-0.5 text-xs text-slate-500">{d.note}</p>}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[11px] text-slate-500">Last reviewed {formatDate(uni.last_reviewed)}. Check the official site for time zones and program-specific dates.</p>
              </div>

              <div className="space-y-4">
                <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
                  <Detail label="Apply via" value={uni.platform} />
                  <Detail label="Testing" value={uni.testing} />
                  <Detail label="English" value={uni.english} />
                  <Detail label="Application fee" value={uni.app_fee} />
                  <Detail label="Financial aid" value={uni.financial_aid} />
                  <Detail label="Notes" value={uni.notes} />
                </dl>
                <div className="flex flex-wrap items-center gap-2">
                  {uni.website && (
                    <a href={uni.website} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white px-2.5 text-xs font-medium hover:bg-slate-50">
                      Official admissions site
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                  {isAdmin && (
                    <Link href={`/admin/universities/${uni.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-slate-600 hover:bg-white">
                      <Pencil className="size-3" />
                      Edit
                    </Link>
                  )}
                </div>
                {isStudent && !listItem && (
                  <div className="flex items-center gap-2 border-t border-line pt-4">
                    <Select value={round} onChange={(e) => setRound(e.target.value)} className="h-8 text-xs">
                      {uni.deadlines.map((d) => <option key={d.round}>{d.round}</option>)}
                    </Select>
                    <Button size="sm" disabled={pending} onClick={() => start(async () => void (await addToList(uni.id, round || null)))}>
                      <Plus className="size-3.5" />
                      Add to my list
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function MyListRow({ item, uni, next }: { item: UserUniversity; uni: University; next: ReturnType<typeof nextDeadline> }) {
  const [pending, start] = useTransition();
  return (
    <li className={cn("flex flex-wrap items-center gap-3 px-5 py-3", pending && "opacity-60")}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{uni.name}</p>
        <p className="text-xs text-slate-500">
          {next ? `${next.round} · ${formatDate(next.date)}` : uni.deadlines.find((d) => !d.date)?.window ?? "No upcoming dated deadline"}
        </p>
      </div>
      {next && <Countdown date={next.date!} />}
      <Select
        value={item.round ?? ""}
        onChange={(e) => start(async () => void (await updateListItem(item.id, { round: e.target.value || null })))}
        className="h-8 w-44 text-xs"
        aria-label="Round"
      >
        <option value="">Any round</option>
        {uni.deadlines.map((d) => <option key={d.round}>{d.round}</option>)}
      </Select>
      <Select
        value={item.status}
        onChange={(e) => start(async () => void (await updateListItem(item.id, { status: e.target.value as ApplicationStatus })))}
        className="h-8 w-32 text-xs"
        aria-label="Status"
      >
        {(Object.keys(APPLICATION_STATUS) as ApplicationStatus[]).map((s) => (
          <option key={s} value={s}>{APPLICATION_STATUS[s].label}</option>
        ))}
      </Select>
      <button onClick={() => start(async () => void (await removeFromList(item.id)))} className="text-slate-400 hover:text-rose-600" aria-label="Remove from list">
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}
