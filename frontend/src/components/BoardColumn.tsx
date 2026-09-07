"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";

export function BoardColumn({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section
      ref={setNodeRef}
      className="surface min-h-[420px] p-4 transition-colors"
      style={{
        background: isOver
          ? "color-mix(in srgb, var(--brand-soft) 55%, var(--bg-elevated))"
          : undefined,
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wide uppercase">{title}</h2>
        <span className="badge" style={{ background: "var(--bg-muted)", color: "var(--ink-muted)" }}>
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}
