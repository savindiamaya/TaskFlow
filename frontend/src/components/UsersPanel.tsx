"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Task, User } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function UsersPanel({
  users,
  onUpdated,
}: {
  users: User[];
  onUpdated: () => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  useEffect(() => {
    if (!selected) {
      setUserTasks([]);
      return;
    }
    setLoadingTasks(true);
    void api<{ tasks: Task[] }>(`/users/${selected.id}/tasks`)
      .then((data) => setUserTasks(data.tasks))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load user tasks"))
      .finally(() => setLoadingTasks(false));
  }, [selected]);

  async function toggleActive(user: User) {
    try {
      setError("");
      await api(`/users/${user.id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div className="animate-rise space-y-4">
      <div className="surface p-4">
        <h2 className="mb-3 text-lg font-semibold">User Management</h2>
        <label className="label">Search users</label>
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            style={{ color: "var(--ink-muted)" }}
          />
          <input
            className="field"
            style={{ paddingLeft: "2.5rem" }}
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="surface overflow-x-auto p-4 lg:col-span-3">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead style={{ color: "var(--ink-muted)" }}>
              <tr>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="py-3">{u.email}</td>
                  <td className="py-3 capitalize">{u.role}</td>
                  <td className="py-3">
                    <span
                      className="badge"
                      style={{
                        background: u.isActive ? "var(--ok-soft)" : "var(--danger-soft)",
                        color: u.isActive ? "var(--ok)" : "var(--danger)",
                      }}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "0.35rem 0.8rem" }}
                        onClick={() => setSelected(u)}
                      >
                        View tasks
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "0.35rem 0.8rem" }}
                        onClick={() => void toggleActive(u)}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="mt-4 text-sm" style={{ color: "var(--ink-muted)" }}>
              No users match your search.
            </p>
          )}
        </div>

        <div className="surface p-4 lg:col-span-2">
          <h3 className="text-base font-semibold">
            {selected ? `${selected.name}'s tasks` : "Select a user"}
          </h3>
          {!selected && (
            <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
              Choose “View tasks” to inspect a user’s assigned and created work.
            </p>
          )}
          {loadingTasks && (
            <p className="mt-3 text-sm animate-pulse-soft" style={{ color: "var(--ink-muted)" }}>
              Loading tasks…
            </p>
          )}
          <div className="mt-3 max-h-[520px] space-y-2 overflow-auto">
            {selected &&
              !loadingTasks &&
              userTasks.map((t) => (
                <div key={t.id} className="rounded-xl border p-3" style={{ borderColor: "var(--line)" }}>
                  <div className="font-semibold">{t.title}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs" style={{ color: "var(--ink-muted)" }}>
                    <span className="badge" style={{ background: "var(--bg-muted)" }}>
                      {t.status}
                    </span>
                    <span className="badge" style={{ background: "var(--bg-muted)" }}>
                      {t.priority}
                    </span>
                    <span>Updated {formatDate(t.updatedAt)}</span>
                  </div>
                </div>
              ))}
            {selected && !loadingTasks && userTasks.length === 0 && (
              <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
                This user has no tasks yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
