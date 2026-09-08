"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StatsPanel } from "@/components/StatsPanel";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/hooks/useNotifications";
import { api } from "@/lib/api";
import type { Stats } from "@/lib/types";

export default function UserStatsPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { notifications, setNotifications } = useNotifications(!!user && !isAdmin);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (isAdmin) router.replace("/admin");
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    if (!user || isAdmin) return;
    void api<{ stats: Stats }>("/tasks/stats")
      .then((data) => setStats(data.stats))
      .catch(() => {});
  }, [user, isAdmin]);

  if (loading || !user || isAdmin) {
    return <div className="p-10 text-center animate-pulse-soft">Loading…</div>;
  }

  return (
    <AppShell
      title="My Stats"
      notifications={notifications}
      onNotificationsChange={setNotifications}
    >
      {stats ? <StatsPanel stats={stats} /> : <p>Loading stats…</p>}
    </AppShell>
  );
}
