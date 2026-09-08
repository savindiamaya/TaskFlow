"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TaskBoard } from "@/components/TaskBoard";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/hooks/useNotifications";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export default function AdminBoardPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { notifications, setNotifications } = useNotifications(!!user && isAdmin);
  const [users, setUsers] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    void api<{ users: User[] }>("/users")
      .then((data) => setUsers(data.users))
      .catch(() => {});
  }, [user, isAdmin]);

  if (loading || !user || !isAdmin) {
    return <div className="p-10 text-center animate-pulse-soft">Loading…</div>;
  }

  return (
    <AppShell
      title="All Tasks Board"
      notifications={notifications}
      onNotificationsChange={setNotifications}
      onNewTask={() => setDialogOpen(true)}
    >
      <TaskBoard
        currentUserId={user.id}
        isAdmin
        users={users}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
      />
    </AppShell>
  );
}
