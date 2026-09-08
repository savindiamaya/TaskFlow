"use client";

import { useEffect, useMemo, useState } from "react";
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
import { api } from "@/lib/api";
import type { Stats, Task, TaskFilters, User } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import { BoardColumn } from "@/components/BoardColumn";
import { FilterBar } from "@/components/FilterBar";
import { SearchBar } from "@/components/SearchBar";
import { TaskCard } from "@/components/TaskCard";
import { TaskDialog } from "@/components/TaskDialog";

export function TaskBoard({
  currentUserId,
  isAdmin,
  users,
  dialogOpen,
  setDialogOpen,
  onStatsChange,
}: {
  currentUserId: string;
  isAdmin: boolean;
  users: User[];
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  onStatsChange?: (stats: Stats) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({
    search: "",
    status: "all",
    priority: "all",
    assignee: "all",
    tag: "all",
    due: "all",
    sort: "newest",
  });
  const [editing, setEditing] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function loadTasks() {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== "all" && !(k === "search" && !v)) qs.set(k, String(v));
    });
    if (filters.search) qs.set("search", filters.search);
    const data = await api<{ tasks: Task[] }>(`/tasks?${qs.toString()}`);
    setTasks(data.tasks);
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      setBusy(true);
      void loadTasks()
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load tasks"))
        .finally(() => setBusy(false));
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (dialogOpen && !editing) {
      // creating new task — no extra load
    }
  }, [dialogOpen, editing]);

  const columns = useMemo(() => {
    const map: Record<string, Task[]> = { todo: [], doing: [], done: [] };
    for (const t of tasks) map[t.status]?.push(t);
    for (const key of Object.keys(map)) map[key].sort((a, b) => a.position - b.position);
    return map;
  }, [tasks]);

  const activeTask = tasks.find((t) => t.id === activeId) || null;

  async function refreshStats() {
    if (!onStatsChange) return;
    const statsRes = await api<{ stats: Stats }>("/tasks/stats");
    onStatsChange(statsRes.stats);
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const taskId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let nextStatus = task.status;
    if (STATUSES.some((s) => s.id === overId)) nextStatus = overId as Task["status"];
    else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) nextStatus = overTask.status;
    }
    if (nextStatus === task.status) return;

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)));
    try {
      const data = await api<{ task: Task }>(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      await refreshStats();
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
    await refreshStats();
  }

  async function deleteTask(id: string) {
    await api(`/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDialogOpen(false);
    setEditing(null);
    await refreshStats();
  }

  async function claimTask(task: Task) {
    const data = await api<{ task: Task }>(`/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeId: currentUserId }),
    });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
  }

  return (
    <>
      {error && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        <SearchBar
          value={filters.search || ""}
          onChange={(search) => setFilters({ ...filters, search })}
        />
        <FilterBar filters={filters} setFilters={setFilters} users={users} isAdmin={isAdmin} />
      </div>

      {busy && (
        <p className="mt-3 text-sm animate-pulse-soft" style={{ color: "var(--ink-muted)" }}>
          Refreshing…
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={onDragEnd}
      >
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {STATUSES.map((col) => (
            <BoardColumn key={col.id} id={col.id} title={col.label} count={columns[col.id].length}>
              <SortableContext items={columns[col.id].map((t) => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {columns[col.id].map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                            onOpen={() => {
                              setEditing(task);
                              setDialogOpen(true);
                            }}
                            onClaim={() => void claimTask(task)}
                            onDelete={(t) => void deleteTask(t.id)}
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

      <TaskDialog
        open={dialogOpen}
        task={editing}
        users={users}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSave={saveTask}
        onDelete={editing ? () => deleteTask(editing.id) : undefined}
      />
    </>
  );
}
