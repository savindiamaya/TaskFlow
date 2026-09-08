"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Stats } from "@/lib/types";

const PIE_COLORS = ["#0ea5a4", "#2563eb", "#059669", "#d97706", "#e11d48"];

export function StatsPanel({ stats, admin = false }: { stats: Stats; admin?: boolean }) {
  const statusData = [
    { name: "To Do", value: stats.byStatus.todo || 0 },
    { name: "Doing", value: stats.byStatus.doing || 0 },
    { name: "Done", value: stats.byStatus.done || 0 },
  ];

  const priorityData = [
    { name: "High", value: stats.byPriority.high || 0 },
    { name: "Medium", value: stats.byPriority.medium || 0 },
    { name: "Low", value: stats.byPriority.low || 0 },
  ];

  const cards = admin
    ? [
        { label: "Total users", value: stats.totalUsers ?? 0, color: "var(--brand)" },
        { label: "Total tasks", value: stats.totalTasks ?? 0, color: "var(--accent)" },
        { label: "To Do", value: stats.byStatus.todo || 0, color: "var(--ink-muted)" },
        { label: "Doing", value: stats.byStatus.doing || 0, color: "var(--warn)" },
        { label: "Done", value: stats.byStatus.done || 0, color: "var(--ok)" },
        { label: "High priority", value: stats.highPriority ?? 0, color: "var(--danger)" },
        { label: "Overdue", value: stats.overdue, color: "var(--danger)" },
      ]
    : [
        { label: "My tasks", value: stats.myTasks, color: "var(--brand)" },
        { label: "Completed", value: stats.completed, color: "var(--ok)" },
        { label: "Overdue", value: stats.overdue, color: "var(--danger)" },
        { label: "High priority", value: stats.highPriority ?? 0, color: "var(--accent)" },
      ];

  return (
    <div className="animate-rise space-y-4">
      <div className={`grid gap-4 ${admin ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {cards.map((c) => (
          <div key={c.label} className="surface p-5">
            <div className="text-sm" style={{ color: "var(--ink-muted)" }}>
              {c.label}
            </div>
            <div className="display mt-2 text-4xl font-bold" style={{ color: c.color }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="mb-4 text-lg font-semibold">Tasks by status</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="name" stroke="var(--ink-muted)" />
                <YAxis allowDecimals={false} stroke="var(--ink-muted)" />
                <Tooltip />
                <Bar dataKey="value" fill="var(--brand)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="mb-4 text-lg font-semibold">Tasks by priority</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" outerRadius={100} label>
                  {priorityData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
