"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { UsersPanel } from "@/components/UsersPanel";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/hooks/useNotifications";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export default function AdminUsersPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { notifications, setNotifications } = useNotifications(!!user && isAdmin);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (!isAdmin) router.replace("/dashboard");
  }, [loading, user, isAdmin, router]);

  async function loadUsers() {
    const data = await api<{ users: User[] }>("/users");
    setUsers(data.users);
  }

  useEffect(() => {
    if (!user || !isAdmin) return;
    void loadUsers().catch(() => {});
  }, [user, isAdmin]);

  if (loading || !user || !isAdmin) {
    return <div className="p-10 text-center animate-pulse-soft">Loading…</div>;
  }

  return (
    <AppShell
      title="User Management"
      notifications={notifications}
      onNotificationsChange={setNotifications}
    >
      <UsersPanel users={users} onUpdated={loadUsers} />
    </AppShell>
  );
}
