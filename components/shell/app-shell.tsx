"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Building2,
  ChevronsLeft,
  IdCard,
  Compass,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Library,
  ListChecks,
  LogOut,
  Mail,
  PenLine,
  Search,
  Shield,
  Target,
  Trophy,
} from "lucide-react";
import { setGradeView, signOut } from "@/app/actions/profile";
import { GRADES } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";
import type { Profile, Role } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandMenu } from "./command-menu";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}

const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { href: "/admissions", label: "How admissions works", icon: Compass, group: "Overview" },
  { href: "/profile", label: "My application", icon: IdCard, group: "Overview" },
  { href: "/essays", label: "Essay Studio", icon: PenLine, group: "Build" },
  { href: "/activities", label: "Activities", icon: Trophy, group: "Build" },
  { href: "/recommenders", label: "Recommendations", icon: Mail, group: "Build" },
  { href: "/practice", label: "SAT Practice", icon: ListChecks, group: "Build" },
  { href: "/testing", label: "Scores", icon: Target, group: "Build" },
  { href: "/universities", label: "Universities", icon: Building2, group: "Explore" },
  { href: "/guides", label: "Guides", icon: BookOpen, group: "Explore" },
  { href: "/resources", label: "Resources", icon: Library, group: "Explore" },
];

const STAFF_NAV: NavItem[] = [
  { href: "/counselor", label: "Counsellor dashboard", icon: Inbox, group: "Counselling" },
  { href: "/admissions", label: "How admissions works", icon: Compass, group: "Explore" },
  { href: "/practice", label: "SAT Practice", icon: ListChecks, group: "Explore" },
  { href: "/universities", label: "Universities", icon: Building2, group: "Explore" },
  { href: "/guides", label: "Guides", icon: BookOpen, group: "Explore" },
  { href: "/resources", label: "Resources", icon: Library, group: "Explore" },
];

export function navFor(role: Role): NavItem[] {
  if (role === "student") return STUDENT_NAV;
  if (role === "admin") {
    const staffOnly = STAFF_NAV.filter((item) => !STUDENT_NAV.some((s) => s.href === item.href));
    return [...STUDENT_NAV, ...staffOnly, { href: "/admin", label: "Content & users", icon: Shield, group: "Admin" }];
  }
  return STAFF_NAV;
}

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  essays: "Essay Studio",
  guides: "Guides",
  testing: "Scores",
  practice: "SAT Practice",
  session: "Session",
  tutor: "AI tutor",
  official: "Official questions",
  resources: "Resources",
  admissions: "How admissions works",
  profile: "My application",
  profiles: "Profile review",
  activities: "Activities",
  recommenders: "Recommendations",
  universities: "Universities",
  counselor: "Counsellor dashboard",
  admin: "Content & users",
  meeting: "Meeting view",
};

export function AppShell({
  profile,
  gradeView,
  initialCollapsed,
  children,
}: {
  profile: Profile;
  gradeView: number;
  initialCollapsed: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const nav = navFor(profile.role);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `sidebar=${next ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
  }

  // Meeting view is a full-screen presentation mode.
  if (pathname.endsWith("/meeting")) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <motion.aside
        animate={{ width: collapsed ? 60 : 232 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white md:flex"
      >
        <div className="flex h-14 items-center gap-2 border-b border-line px-3.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-navy text-white">
            <GraduationCap className="size-4" />
          </span>
          {!collapsed && <span className="truncate text-sm font-semibold">Admissions Prep</span>}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {nav.map((item, index) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const heading = index === 0 || nav[index - 1]!.group !== item.group;
            return (
              <div key={item.href}>
              {heading && !collapsed && (
                <p className={cn("px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400", index === 0 ? "pt-1" : "pt-4")}>{item.group}</p>
              )}
              {heading && collapsed && index > 0 && <div className="mx-2 my-2 border-t border-line" />}
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors",
                  active ? "bg-accent-soft font-medium text-accent" : "text-slate-600 hover:bg-slate-50 hover:text-navy",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
              </div>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-line p-2">
          <div className="flex items-center gap-2.5 px-1.5 py-1.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-medium">
              {initials(profile.full_name)}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{profile.full_name}</p>
                <p className="truncate text-xs capitalize text-slate-500">{profile.role}</p>
              </div>
            )}
          </div>
          <div className={cn("flex", collapsed ? "flex-col" : "items-center justify-between")}>
            <form action={signOut}>
              <button type="submit" title="Sign out" className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-navy">
                <LogOut className="size-4" />
              </button>
            </form>
            <button
              onClick={toggleSidebar}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-navy"
            >
              <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
            </button>
          </div>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur md:px-6">
          <Breadcrumbs pathname={pathname} />
          <div className="ml-auto flex items-center gap-2">
            {profile.role !== "counselor" && <GradeSelect value={gradeView} />}
            <ThemeToggle />
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex h-8 items-center gap-2 rounded-md border border-line bg-white px-2.5 text-xs text-slate-500 hover:text-navy"
            >
              <Search className="size-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded bg-slate-100 px-1 font-sans text-[10px] sm:inline">⌘K</kbd>
            </button>
          </div>
        </header>

        <MobileNav items={nav} pathname={pathname} />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      <CommandMenu open={paletteOpen} onOpenChange={setPaletteOpen} nav={nav} />
    </div>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  return (
    <ol className="flex min-w-0 items-center gap-1.5 text-sm">
      {parts.map((part, i) => {
        const href = `/${parts.slice(0, i + 1).join("/")}`;
        const last = i === parts.length - 1;
        const label = LABELS[part] ?? (part.length > 20 ? "Detail" : decodeURIComponent(part).replace(/-/g, " "));
        return (
          <li key={href} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <span className="text-slate-300">/</span>}
            {last ? (
              <span className="truncate font-medium capitalize">{label}</span>
            ) : (
              <Link href={href} className="truncate capitalize text-slate-500 hover:text-navy">
                {label}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function GradeSelect({ value }: { value: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className={cn("flex rounded-md border border-line bg-white p-0.5", pending && "opacity-60")}>
      {GRADES.map((g) => (
        <button
          key={g}
          onClick={() =>
            start(async () => {
              await setGradeView(g);
              router.refresh();
            })
          }
          className={cn(
            "h-7 rounded px-2 text-xs font-medium tabular-nums transition-colors",
            g === value ? "bg-navy text-white" : "text-slate-500 hover:text-navy",
          )}
          aria-pressed={g === value}
        >
          G{g}
        </button>
      ))}
    </div>
  );
}

function MobileNav({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line bg-white px-3 py-2 md:hidden">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs",
              active ? "bg-accent-soft font-medium text-accent" : "text-slate-600",
            )}
          >
            <item.icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
