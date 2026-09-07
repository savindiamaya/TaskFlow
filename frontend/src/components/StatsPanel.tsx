"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Stats } from "@/lib/types";

export function StatsPanel({ stats }: { stats: Stats }) {
  const statusData = [
    { name: "To Do", value: stats.byStatus.todo || 0 },
    { name: "Doing", value: stats.byStatus.doing || 0 },
    { name: "Done", value: stats.byStatus.done || 0 },
  ];

  const cards = [
    { label: "My tasks", value: stats.myTasks, color: "var(--brand)" },
    { label: "Completed", value: stats.completed, color: "var(--ok)" },
    { label: "Overdue", value: stats.overdue, color: "var(--danger)" },
  ];

  return (
    <div className="animate-rise space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
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
      <div className="surface p-5">
        <h2 className="mb-4 text-lg font-semibold">Progress by status</h2>
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
    </div>
  );
}
