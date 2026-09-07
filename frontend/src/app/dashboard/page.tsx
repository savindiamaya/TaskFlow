"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { io, type Socket } from "socket.io-client";
import {
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Sun,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { api, getToken } from "@/lib/api";
import type {
  NotificationItem,
  Stats,
  Task,
  TaskFilters,
  User,
} from "@/lib/types";
import { STATUSES } from "@/lib/types";
import { FilterBar } from "@/components/FilterBar";
import { TaskCard } from "@/components/TaskCard";
import { TaskDialog } from "@/components/TaskDialog";
import { BoardColumn } from "@/components/BoardColumn";
import { NotificationBell } from "@/components/NotificationBell";
import { StatsPanel } from "@/components/StatsPanel";
import { UsersPanel } from "@/components/UsersPanel";

export default function DashboardPage() {
  const { user, loading, logout, isAdmin } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({
    search: "",
    status: "all",
    priority: "all",
    assignee: "all",
    tag: "all",
    due: "all",
    sort: "newest",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<"board" | "stats" | "users">("board");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  async function loadTasks() {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== "all" && !(k === "search" && !v)) qs.set(k, String(v));
    });
    if (filters.search) qs.set("search", filters.search);
    const data = await api<{ tasks: Task[] }>(`/tasks?${qs.toString()}`);
    setTasks(data.tasks);
  }

  async function loadExtras() {
    const [statsRes, notifRes, usersRes] = await Promise.all([
      api<{ stats: Stats }>("/tasks/stats"),
      api<{ notifications: NotificationItem[] }>("/notifications"),
      api<{ users: User[] }>(isAdmin ? "/users" : "/users/assignable"),
    ]);
    setStats(statsRes.stats);
    setNotifications(notifRes.notifications);
    setUsers(usersRes.users);
  }

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        setBusy(true);
        await Promise.all([loadTasks(), loadExtras()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user) return;
    const handle = setTimeout(() => {
      void loadTasks().catch(() => {});
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (!user) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
    const socket: Socket = io(socketUrl, {
      auth: { token: getToken() },
    });
    socket.on("notification", (n: NotificationItem) => {
      setNotifications((prev) => [n, ...prev]);
    });
    return () => {
      socket.disconnect();
    };
  }, [user]);

  const columns = useMemo(() => {
    const map: Record<string, Task[]> = { todo: [], doing: [], done: [] };
    for (const t of tasks) map[t.status]?.push(t);
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [tasks]);

  const activeTask = tasks.find((t) => t.id === activeId) || null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const taskId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let nextStatus = task.status;
    if (STATUSES.some((s) => s.id === overId)) {
      nextStatus = overId as Task["status"];
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) nextStatus = overTask.status;
    }

    if (nextStatus === task.status) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );

    try {
      const data = await api<{ task: Task }>(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      const statsRes = await api<{ stats: Stats }>("/tasks/stats");
      setStats(statsRes.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
      await loadTasks();
    }
  }

  async function saveTask(payload: Partial<Task> & { title: string }) {
    if (editing) {
      const data = await api<{ task: Task }>(`/tasks/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setTasks((prev) => prev.map((t) => (t.id === editing.id ? data.task : t)));
    } else {
      const data = await api<{ task: Task }>("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTasks((prev) => [data.task, ...prev]);
    }
    setDialogOpen(false);
    setEditing(null);
    const [statsRes, notifRes] = await Promise.all([
      api<{ stats: Stats }>("/tasks/stats"),
      api<{ notifications: NotificationItem[] }>("/notifications"),
    ]);
    setStats(statsRes.stats);
    setNotifications(notifRes.notifications);
  }

  async function deleteTask(id: string) {
    await api(`/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDialogOpen(false);
    setEditing(null);
  }

  async function claimTask(task: Task) {
    if (!user) return;
    const data = await api<{ task: Task }>(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeId: user.id }),
    });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
  }

  if (loading || !user) {
    return <div className="p-10 text-center animate-pulse-soft">Loading board…</div>;
  }

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--line)",
          background: "color-mix(in srgb, var(--bg) 80%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="display text-xl font-bold">
              Task<span style={{ color: "var(--brand)" }}>Flow</span>
            </div>
            <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
              {isAdmin ? "Admin" : "User"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`btn ${tab === "board" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTab("board")}
            >
              <LayoutDashboard size={16} /> Board
            </button>
            <button
              className={`btn ${tab === "stats" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTab("stats")}
            >
              Stats
            </button>
            {isAdmin && (
              <button
                className={`btn ${tab === "users" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setTab("users")}
              >
                <Users size={16} /> Users
              </button>
            )}
            <NotificationBell
              notifications={notifications}
              onChange={setNotifications}
            />
            <button className="btn btn-ghost" onClick={toggle} aria-label="Toggle theme">
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus size={16} /> New task
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                logout();
                router.replace("/");
              }}
            >
              <LogOut size={16} /> {user.name}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {tab === "board" && (
          <>
            <FilterBar filters={filters} setFilters={setFilters} users={users} isAdmin={isAdmin} />
            {busy && <p className="mb-3 text-sm animate-pulse-soft" style={{ color: "var(--ink-muted)" }}>Refreshing…</p>}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            >
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {STATUSES.map((col) => (
                  <BoardColumn key={col.id} id={col.id} title={col.label} count={columns[col.id].length}>
                    <SortableContext
                      items={columns[col.id].map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {columns[col.id].map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            currentUserId={user.id}
                            isAdmin={isAdmin}
                            onOpen={() => {
                              setEditing(task);
                              setDialogOpen(true);
                            }}
                            onClaim={() => void claimTask(task)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </BoardColumn>
                ))}
              </div>
              <DragOverlay>
                {activeTask ? (
                  <div className="surface p-4 opacity-95">
                    <div className="font-semibold">{activeTask.title}</div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}

        {tab === "stats" && stats && <StatsPanel stats={stats} />}
        {tab === "users" && isAdmin && (
          <UsersPanel
            users={users}
            onUpdated={async () => {
              const data = await api<{ users: User[] }>("/users");
              setUsers(data.users);
            }}
          />
        )}
      </main>

      <TaskDialog
        open={dialogOpen}
        task={editing}
        users={users}
        isAdmin={isAdmin}
        currentUserId={user.id}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSave={saveTask}
        onDelete={editing ? () => deleteTask(editing.id) : undefined}
      />
    </div>
  );
}
