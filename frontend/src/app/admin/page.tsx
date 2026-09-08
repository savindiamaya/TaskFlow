"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StatsPanel } from "@/components/StatsPanel";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/hooks/useNotifications";
import { api } from "@/lib/api";
import type { Stats } from "@/lib/types";

export default function AdminDashboardPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { notifications, setNotifications } = useNotifications(!!user && isAdmin);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (!isAdmin) router.replace("/dashboard");
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    void api<{ stats: Stats }>("/tasks/stats")
      .then((data) => setStats(data.stats))
      .catch(() => {});
  }, [user, isAdmin]);

  if (loading || !user || !isAdmin) {
    return <div className="p-10 text-center animate-pulse-soft">Loading admin dashboard…</div>;
  }

  return (
    <AppShell
      title="Admin Dashboard"
      notifications={notifications}
      onNotificationsChange={setNotifications}
    >
      <div className="mb-4">
        <h1 className="display text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
          System-wide overview of users, tasks, priorities and overdue work.
        </p>
      </div>
      {stats ? <StatsPanel stats={stats} admin /> : <p>Loading stats…</p>}
    </AppShell>
  );
}
