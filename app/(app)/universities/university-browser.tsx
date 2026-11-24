"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { addToList, removeFromList, updateListItem } from "@/app/actions/universities";
import { Badge, Button, Card, CardHeader, Input, Select } from "@/components/ui";
import { APPLICATION_STATUS, REGIONS } from "@/lib/constants";
import { RANK_BANDS, nextDeadline, percent, rankBand, satFit, usd, type Fit } from "@/lib/universities";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import type { ApplicationStatus, University, UserUniversity } from "@/lib/types";

type Sort = "rank" | "selective" | "sat" | "deadline" | "name";
const PAGE = 50;

const ACCEPTANCE = [
  { id: "10", label: "Under 10% accepted", test: (r: number) => r < 0.1 },
  { id: "25", label: "10–25% accepted", test: (r: number) => r >= 0.1 && r < 0.25 },
  { id: "50", label: "25–50% accepted", test: (r: number) => r >= 0.25 && r < 0.5 },
  { id: "100", label: "Over 50% accepted", test: (r: number) => r >= 0.5 },
];

export function UniversityBrowser({
  universities,
  myList,
  initialQuery,
  isStudent,
  isAdmin,
  targetRegions,
  bestSat,
  bestIelts,
}: {
  universities: University[];
  myList: UserUniversity[];
  initialQuery: string;
  isStudent: boolean;
  isAdmin: boolean;
  targetRegions: string[];
  bestSat: number | null;
  bestIelts: number | null;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [band, setBand] = useState("");
  const [acceptance, setAcceptance] = useState("");
  const [fit, setFit] = useState("");
  const [within, setWithin] = useState("");
  const [sort, setSort] = useState<Sort>("rank");
  const [shown, setShown] = useState(PAGE);
  const [expanded, setExpanded] = useState<string | null>(initialQuery ? universities.find((u) => u.name === initialQuery)?.id ?? null : null);

  const listByUni = new Map(myList.map((l) => [l.university_id, l]));
  const countries = useMemo(
    () => [...new Set(universities.filter((u) => !region || u.region === region).map((u) => u.country))].sort(),
    [universities, region],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bandIndex = RANK_BANDS.findIndex((b) => b.id === band);
    const maxRank = bandIndex >= 0 ? RANK_BANDS[bandIndex]!.max : null;
    const minRank = bandIndex > 0 ? RANK_BANDS[bandIndex - 1]!.max : 0;
    const acceptanceTest = ACCEPTANCE.find((a) => a.id === acceptance)?.test;

    const rows = universities
      .map((u) => ({ uni: u, next: nextDeadline(u), fit: satFit(bestSat, u) }))
      .filter(({ uni, next, fit: f }) => {
        if (q && !`${uni.name} ${uni.country} ${uni.city ?? ""}`.toLowerCase().includes(q)) return false;
        if (region && uni.region !== region) return false;
        if (country && uni.country !== country) return false;
        if (maxRank && !(uni.world_rank && uni.world_rank > minRank && uni.world_rank <= maxRank)) return false;
        if (acceptanceTest && !(uni.acceptance_rate !== null && acceptanceTest(uni.acceptance_rate))) return false;
        if (fit && f?.label !== fit) return false;
        if (within && !(next && daysUntil(next.date!) <= Number(within))) return false;
        return true;
      });

    const nullsLast = (a: number | null, b: number | null) => (a === null ? (b === null ? 0 : 1) : b === null ? -1 : a - b);
    return rows.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.uni.name.localeCompare(b.uni.name);
        case "selective":
          return nullsLast(a.uni.acceptance_rate, b.uni.acceptance_rate);
        case "sat":
          return (b.uni.sat_avg ?? -1) - (a.uni.sat_avg ?? -1);
        case "deadline":
          return (a.next?.date ?? "9999").localeCompare(b.next?.date ?? "9999") || nullsLast(a.uni.world_rank, b.uni.world_rank);
        default:
          return nullsLast(a.uni.world_rank, b.uni.world_rank) || nullsLast(a.uni.acceptance_rate, b.uni.acceptance_rate);
      }
    });
  }, [universities, query, region, country, band, acceptance, fit, within, sort, bestSat]);

  const mine = myList
    .map((l) => ({ item: l, uni: universities.find((u) => u.id === l.university_id) }))
    .filter((r): r is { item: UserUniversity; uni: University } => Boolean(r.uni))
    .map((r) => ({ ...r, next: nextDeadline(r.uni, r.item.round) ?? nextDeadline(r.uni), fit: satFit(bestSat, r.uni) }))
    .sort((a, b) => (a.next?.date ?? "9999").localeCompare(b.next?.date ?? "9999"));

  const resetPaging = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setShown(PAGE);
  };

  return (
    <div className="space-y-6">
      {isStudent && (
        <Card>
          <CardHeader
            title="My list"
            description={
              mine.length
                ? `${mine.length} universities · ${mine.filter((m) => m.fit?.label === "Reach").length} reach, ${mine.filter((m) => m.fit?.label === "Target").length} target, ${mine.filter((m) => m.fit?.label === "Likely").length} likely`
                : "Add universities below to track deadlines and your SAT fit."
            }
            action={
              bestSat ? (
                <span className="text-xs text-slate-500">Your best SAT: <strong className="text-navy">{bestSat}</strong>{bestIelts ? ` · IELTS ${bestIelts}` : ""}</span>
              ) : (
                <Link href="/testing" className="text-xs font-medium text-accent">Log your SAT to see your fit</Link>
              )
            }
          />
          {mine.length > 0 && (
            <ul className="divide-y divide-line">
              {mine.map(({ item, uni, next, fit: f }) => (
                <MyListRow key={item.id} item={item} uni={uni} next={next} fit={f} />
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-slate-400" />
          <Input value={query} onChange={(e) => resetPaging(setQuery)(e.target.value)} placeholder="Search name, city, country" className="pl-8" />
        </div>
        <Select value={region} onChange={(e) => { resetPaging(setRegion)(e.target.value); setCountry(""); }} className="w-auto">
          <option value="">All regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}{targetRegions.includes(r) ? " ★" : ""}</option>)}
        </Select>
        <Select value={country} onChange={(e) => resetPaging(setCountry)(e.target.value)} className="w-auto">
          <option value="">All countries</option>
          {countries.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select value={band} onChange={(e) => resetPaging(setBand)(e.target.value)} className="w-auto">
          <option value="">Any THE rank</option>
          {RANK_BANDS.map((b) => <option key={b.id} value={b.id}>THE {b.label}</option>)}
        </Select>
        <Select value={acceptance} onChange={(e) => resetPaging(setAcceptance)(e.target.value)} className="w-auto">
          <option value="">Any acceptance rate</option>
          {ACCEPTANCE.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </Select>
        {bestSat && (
          <Select value={fit} onChange={(e) => resetPaging(setFit)(e.target.value)} className="w-auto">
            <option value="">Any SAT fit</option>
            <option value="Reach">Reach for me</option>
            <option value="Target">Target for me</option>
            <option value="Likely">Likely for me</option>
          </Select>
        )}
        <Select value={within} onChange={(e) => resetPaging(setWithin)(e.target.value)} className="w-auto">
          <option value="">Any deadline</option>
          <option value="30">Deadline in 30 days</option>
          <option value="60">Deadline in 60 days</option>
          <option value="90">Deadline in 90 days</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-auto sm:ml-auto">
          <option value="rank">Sort: THE rank</option>
          <option value="selective">Sort: most selective</option>
          <option value="sat">Sort: highest SAT</option>
          <option value="deadline">Sort: next deadline</option>
          <option value="name">Sort: name</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,1fr)_80px_90px_110px_170px_24px] gap-4 border-b border-line bg-slate-50 px-5 py-2 text-xs font-medium text-slate-500 md:grid">
          <span>{filtered.length.toLocaleString()} universities</span>
          <span>THE 2027</span>
          <span>Accepted</span>
          <span>SAT middle 50%</span>
          <span>Next deadline</span>
          <span />
        </div>
        <ul className="divide-y divide-line">
          {filtered.slice(0, shown).map(({ uni, next, fit: f }) => (
            <UniversityRow
              key={uni.id}
              uni={uni}
              next={next}
              fit={f}
              bestIelts={bestIelts}
              open={expanded === uni.id}
              onToggle={() => setExpanded(expanded === uni.id ? null : uni.id)}
              listItem={listByUni.get(uni.id)}
              isStudent={isStudent}
              isAdmin={isAdmin}
            />
          ))}
          {!filtered.length && <li className="px-5 py-10 text-center text-sm text-slate-500">No universities match these filters.</li>}
        </ul>
        {filtered.length > shown && (
          <div className="border-t border-line p-3 text-center">
            <Button variant="secondary" size="sm" onClick={() => setShown(shown + PAGE)}>
              Show {Math.min(PAGE, filtered.length - shown)} more of {(filtered.length - shown).toLocaleString()}
            </Button>
          </div>
        )}
      </Card>
      <p className="text-xs leading-relaxed text-slate-500">
        Rankings: Times Higher Education World University Rankings 2027 (exact where THE published the position, otherwise a band).
        U.S. acceptance rates, SAT ranges, costs, graduation rates and earnings: U.S. Department of Education College Scorecard (most recent data, released November 2026). The SAT middle 50% adds the section 25th and 75th percentiles, so treat it as an approximation.
        Deadlines and English requirements are researched for our curated list; always confirm on the official site.
      </p>
    </div>
  );
}

function Countdown({ date }: { date: string }) {
  const days = daysUntil(date);
  const tone = days <= 14 ? "rose" : days <= 45 ? "amber" : "neutral";
  return <Badge tone={tone} className="tabular-nums">{days === 0 ? "Today" : `${days}d`}</Badge>;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-line bg-white px-3 py-2" title={hint}>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function UniversityRow({
  uni,
  next,
  fit,
  bestIelts,
  open,
  onToggle,
  listItem,
  isStudent,
  isAdmin,
}: {
  uni: University;
  next: ReturnType<typeof nextDeadline>;
  fit: Fit | null;
  bestIelts: number | null;
  open: boolean;
  onToggle: () => void;
  listItem?: UserUniversity;
  isStudent: boolean;
  isAdmin: boolean;
}) {
  const [round, setRound] = useState(listItem?.round ?? next?.round ?? uni.deadlines[0]?.round ?? "");
  const [pending, start] = useTransition();
  const upcoming = uni.deadlines.find((d) => !d.date);
  const satRange = uni.sat_25 && uni.sat_75 ? `${uni.sat_25}–${uni.sat_75}` : uni.sat_avg ? `avg ${uni.sat_avg}` : "—";
  const ieltsGap = bestIelts !== null && uni.ielts_min !== null ? bestIelts - uni.ielts_min : null;

  return (
    <li>
      <button onClick={onToggle} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 text-left hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_80px_90px_110px_170px_24px]">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {uni.name}
            {listItem && <span className="ml-2 text-xs font-normal text-accent">On my list</span>}
          </p>
          <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
            {[uni.city, uni.country === "United States" ? null : uni.country].filter(Boolean).join(", ")}
            {fit && <Badge tone={fit.tone} className="px-1 py-0 text-[10px]">{fit.label}</Badge>}
          </p>
        </div>
        <span className="hidden text-sm tabular-nums text-slate-600 md:block" title={uni.rank_confirmed ? "Confirmed THE 2027 position" : "Approximate band"}>
          {uni.rank_confirmed && uni.world_rank ? `#${uni.world_rank}` : uni.world_rank ? rankBand(uni.world_rank) : "—"}
        </span>
        <span className={cn("hidden text-sm tabular-nums md:block", uni.acceptance_rate !== null && uni.acceptance_rate < 0.1 ? "font-medium text-rose-600" : "text-slate-600")}>
          {percent(uni.acceptance_rate, uni.acceptance_rate !== null && uni.acceptance_rate < 0.1 ? 1 : 0)}
        </span>
        <span className="hidden text-sm tabular-nums text-slate-600 md:block">{satRange}</span>
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
            <p className="truncate text-xs text-slate-400">{upcoming?.window ?? (uni.curated ? "All rounds passed" : "See official site")}</p>
          )}
        </div>
        <ChevronDown className={cn("size-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="space-y-5 border-t border-line bg-slate-50/60 px-5 py-5">
              {fit && (
                <div className={cn("rounded-md border px-4 py-3 text-sm", fit.tone === "emerald" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : fit.tone === "indigo" ? "border-indigo-200 bg-indigo-50 text-indigo-900" : "border-rose-200 bg-rose-50 text-rose-900")}>
                  <strong>{fit.label} for you.</strong> {fit.detail}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                <Stat label="Acceptance rate" value={percent(uni.acceptance_rate, 1)} />
                <Stat label="SAT middle 50%" value={satRange} />
                <Stat label="Average SAT" value={uni.sat_avg ? String(uni.sat_avg) : "—"} />
                <Stat label="ACT midpoint" value={uni.act_mid ? String(uni.act_mid) : "—"} />
                <Stat label="IELTS minimum" value={uni.ielts_min !== null ? uni.ielts_min.toFixed(1) : "Check site"} hint={uni.english ?? undefined} />
                <Stat label="TOEFL minimum" value={uni.toefl_min ? String(uni.toefl_min) : "Check site"} />
                <Stat label="Undergraduates" value={uni.undergrad_size ? uni.undergrad_size.toLocaleString("en-US") : "—"} />
                <Stat label="International students" value={percent(uni.intl_share, 1)} />
                <Stat label="Tuition (out-of-state)" value={usd(uni.tuition_out_of_state)} hint="International students pay this rate at public U.S. universities" />
                <Stat label="Total cost per year" value={usd(uni.cost_of_attendance)} hint="Tuition, housing, food, books (published cost of attendance)" />
                <Stat label="Graduate in 6 years" value={percent(uni.grad_rate)} />
                <Stat label="Median earnings at 10 yrs" value={usd(uni.median_earnings)} />
              </div>
              {ieltsGap !== null && (
                <p className={cn("text-sm", ieltsGap >= 0 ? "text-emerald-700" : "text-rose-700")}>
                  {ieltsGap >= 0 ? `Your IELTS ${bestIelts} meets their ${uni.ielts_min?.toFixed(1)} minimum.` : `You need ${Math.abs(ieltsGap).toFixed(1)} more IELTS band to reach their ${uni.ielts_min?.toFixed(1)} minimum.`}
                </p>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deadlines · {uni.cycle}</h3>
                    {uni.curated && (
                      <Badge tone={uni.deadline_status === "confirmed" ? "emerald" : "amber"}>
                        {uni.deadline_status === "confirmed" ? "Confirmed" : "Estimated"}
                      </Badge>
                    )}
                  </div>
                  {uni.deadlines.length ? (
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
                                <Badge>Date TBA</Badge>
                              )}
                            </div>
                            {d.window && <p className="mt-0.5 text-xs text-slate-500">{d.window}</p>}
                            {d.note && <p className="mt-0.5 text-xs text-slate-500">{d.note}</p>}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">This college isn't in our researched deadline list yet. Check its admissions site for this year's dates.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
                    <Detail label="Type" value={uni.ownership ? (uni.ownership === "public" ? "Public" : "Private nonprofit") : null} />
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
                        Official site
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
                      {uni.deadlines.length > 0 && (
                        <Select value={round} onChange={(e) => setRound(e.target.value)} className="h-8 text-xs">
                          {uni.deadlines.map((d) => <option key={d.round}>{d.round}</option>)}
                        </Select>
                      )}
                      <Button size="sm" disabled={pending} onClick={() => start(async () => void (await addToList(uni.id, round || null)))}>
                        <Plus className="size-3.5" />
                        Add to my list
                      </Button>
                    </div>
                  )}
                </div>
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

function MyListRow({ item, uni, next, fit }: { item: UserUniversity; uni: University; next: ReturnType<typeof nextDeadline>; fit: Fit | null }) {
  const [pending, start] = useTransition();
  return (
    <li className={cn("flex flex-wrap items-center gap-3 px-5 py-3", pending && "opacity-60")}>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          {uni.name}
          {fit && <Badge tone={fit.tone} className="px-1 py-0 text-[10px]">{fit.label}</Badge>}
        </p>
        <p className="text-xs text-slate-500">
          {next ? `${next.round} · ${formatDate(next.date)}` : uni.deadlines.find((d) => !d.date)?.window ?? "Check the official site for deadlines"}
          {uni.acceptance_rate !== null && ` · ${percent(uni.acceptance_rate, 1)} accepted`}
        </p>
      </div>
      {next && <Countdown date={next.date!} />}
      {uni.deadlines.length > 0 && (
        <Select
          value={item.round ?? ""}
          onChange={(e) => start(async () => void (await updateListItem(item.id, { round: e.target.value || null })))}
          className="h-8 w-44 text-xs"
          aria-label="Round"
        >
          <option value="">Any round</option>
          {uni.deadlines.map((d) => <option key={d.round}>{d.round}</option>)}
        </Select>
      )}
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
