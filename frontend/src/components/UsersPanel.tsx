"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function UsersPanel({
  users,
  onUpdated,
}: {
  users: User[];
  onUpdated: () => Promise<void>;
}) {
  const [error, setError] = useState("");

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
    <div className="surface animate-rise overflow-x-auto p-4">
      <h2 className="mb-4 text-lg font-semibold">All users</h2>
      {error && (
        <p className="mb-3 text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead style={{ color: "var(--ink-muted)" }}>
          <tr>
            <th className="pb-3 font-medium">Name</th>
            <th className="pb-3 font-medium">Email</th>
            <th className="pb-3 font-medium">Role</th>
            <th className="pb-3 font-medium">Joined</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderTop: "1px solid var(--line)" }}>
              <td className="py-3 font-medium">{u.name}</td>
              <td className="py-3">{u.email}</td>
              <td className="py-3 capitalize">{u.role}</td>
              <td className="py-3">{formatDate(u.createdAt)}</td>
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
                <button className="btn btn-secondary" style={{ padding: "0.35rem 0.8rem" }} onClick={() => void toggleActive(u)}>
                  {u.isActive ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
