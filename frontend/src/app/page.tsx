"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  KanbanSquare,
  Moon,
  ShieldCheck,
  Sun,
  Tags,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

const FEATURES = [
  {
    icon: KanbanSquare,
    title: "Drag-and-drop board",
    body: "Move cards across To Do, Doing and Done — every change persists instantly.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    body: "Users manage their work; admins reassign and oversee the whole board.",
  },
  {
    icon: CalendarClock,
    title: "Due dates & priority",
    body: "Spot overdue and due-soon work with high, medium and low priorities.",
  },
  {
    icon: Tags,
    title: "Search & filters",
    body: "Filter by status, assignee, tags, due window and sort any way you need.",
  },
  {
    icon: BellRing,
    title: "Live notifications",
    body: "Realtime alerts for assignments, reassignments, status and overdue work.",
  },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace(user.role === "admin" ? "/admin" : "/dashboard");
  }, [loading, user, router]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="display text-2xl font-bold tracking-tight">
          Task<span style={{ color: "var(--brand)" }}>Flow</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={toggle} aria-label="Toggle theme">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link href="/auth" className="btn btn-ghost">
            Sign in
          </Link>
          <Link href="/auth?mode=register" className="btn btn-primary">
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20">
        <section className="animate-rise py-14 text-center sm:py-20">
          <p className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
            Kanban · Roles · Realtime
          </p>
          <h1 className="display mx-auto mt-5 max-w-3xl text-4xl leading-[1.05] font-bold sm:text-6xl">
            Move work forward without losing the thread.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base sm:text-lg" style={{ color: "var(--ink-muted)" }}>
            A modern Trello-style board with secure auth, admin controls, filters,
            due-date reminders and live notifications.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/auth?mode=register" className="btn btn-primary">
              Create account <ArrowRight size={16} />
            </Link>
            <Link href="/auth" className="btn btn-secondary">
              I already have one
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className="surface animate-rise p-6"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <f.icon size={22} style={{ color: "var(--brand)" }} />
              <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
                {f.body}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
