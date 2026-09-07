"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import type { NotificationItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function NotificationBell({
  notifications,
  onChange,
}: {
  notifications: NotificationItem[];
  onChange: (items: NotificationItem[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.isRead).length;

  async function markAll() {
    await api("/notifications/read-all", { method: "POST" });
    onChange(notifications.map((n) => ({ ...n, isRead: true })));
  }

  async function markOne(id: string) {
    await api(`/notifications/${id}/read`, { method: "PATCH" });
    onChange(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  return (
    <div className="relative">
      <button className="btn btn-ghost relative" onClick={() => setOpen((v) => !v)} aria-label="Notifications">
        <Bell size={16} />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="surface absolute right-0 z-40 mt-2 w-80 max-w-[90vw] p-3">
          <div className="mb-2 flex items-center justify-between">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button className="text-xs font-semibold" style={{ color: "var(--brand)", background: "none", border: 0, cursor: "pointer" }} onClick={() => void markAll()}>
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 space-y-2 overflow-auto">
            {notifications.length === 0 && (
              <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
                No notifications yet.
              </p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                className="w-full rounded-xl p-2 text-left text-sm"
                style={{
                  background: n.isRead ? "transparent" : "var(--brand-soft)",
                  border: "1px solid var(--line)",
                  cursor: "pointer",
                  color: "var(--ink)",
                }}
                onClick={() => void markOne(n.id)}
              >
                <div className="font-medium">{n.message}</div>
                <div className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                  {formatDate(n.createdAt)} · {n.type.replaceAll("_", " ").toLowerCase()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
