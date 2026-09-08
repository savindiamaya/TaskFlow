"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Sun,
  UserCircle2,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { NotificationBell } from "@/components/NotificationBell";
import type { NotificationItem } from "@/lib/types";

import { assetUrl } from "@/lib/api";

export function AppShell({
  children,
  notifications,
  onNotificationsChange,
  onNewTask,
  title,
}: {
  children: ReactNode;
  notifications: NotificationItem[];
  onNotificationsChange: (items: NotificationItem[]) => void;
  onNewTask?: () => void;
  title?: string;
}) {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  const homeHref = isAdmin ? "/admin" : "/dashboard";
  const links = isAdmin
    ? [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/board", label: "Board", icon: KanbanSquare },
      ]
    : [
        { href: "/dashboard", label: "My Board", icon: KanbanSquare },
        { href: "/dashboard/stats", label: "Stats", icon: LayoutDashboard },
      ];

  const avatarSrc = assetUrl(user.avatarUrl);

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--line)",
          background: "color-mix(in srgb, var(--bg) 82%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={homeHref} className="display text-xl font-bold">
              Task<span style={{ color: "var(--brand)" }}>Flow</span>
            </Link>
            <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>
              {isAdmin ? "Admin" : "User"}
            </span>
            {title && (
              <span className="hidden truncate text-sm font-semibold sm:inline" style={{ color: "var(--ink-muted)" }}>
                {title}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`btn ${active ? "btn-primary" : "btn-ghost"}`}
                >
                  <link.icon size={16} /> {link.label}
                </Link>
              );
            })}

            <NotificationBell notifications={notifications} onChange={onNotificationsChange} />

            <button className="btn btn-ghost" onClick={toggle} aria-label="Toggle theme">
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {onNewTask && (
              <button className="btn btn-secondary" onClick={onNewTask}>
                <Plus size={16} /> New task
              </button>
            )}

            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-full border px-2 py-1 transition hover:opacity-90"
              style={{ borderColor: "var(--line)", background: "var(--bg-elevated)" }}
              title="My profile"
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt={user.name} className="avatar" />
              ) : (
                <span
                  className="avatar inline-flex items-center justify-center"
                  style={{ color: "var(--brand-strong)" }}
                >
                  <UserCircle2 size={22} />
                </span>
              )}
              <span className="hidden pr-1 text-sm font-bold sm:inline">{user.name}</span>
            </Link>

            <button
              className="btn btn-logout"
              onClick={() => {
                logout();
                router.replace("/auth");
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
