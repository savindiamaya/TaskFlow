"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical, UserPlus } from "lucide-react";
import type { Task } from "@/lib/types";
import { formatDate, isDueSoon, isOverdue } from "@/lib/utils";

const priorityStyle: Record<string, { bg: string; color: string }> = {
  high: { bg: "var(--danger-soft)", color: "var(--danger)" },
  medium: { bg: "var(--warn-soft)", color: "var(--warn)" },
  low: { bg: "var(--ok-soft)", color: "var(--ok)" },
};

export function TaskCard({
  task,
  currentUserId,
  isAdmin,
  onOpen,
  onClaim,
}: {
  task: Task;
  currentUserId: string;
  isAdmin: boolean;
  onOpen: () => void;
  onClaim: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overdue = isOverdue(task.dueDate, task.status);
  const soon = isDueSoon(task.dueDate, task.status);
  const canClaim = !task.assigneeId && (!isAdmin || true) && currentUserId;

  return (
    <article
      ref={setNodeRef}
      style={{
        ...style,
        border: "1px solid var(--line)",
        background: "var(--bg-elevated)",
      }}
      className="cursor-pointer rounded-2xl p-3"
      onClick={onOpen}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 cursor-grab"
          style={{ color: "var(--ink-muted)", background: "none", border: 0 }}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag task"
        >
          <GripVertical size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{task.title}</h3>
            <span
              className="badge"
              style={{
                background: priorityStyle[task.priority].bg,
                color: priorityStyle[task.priority].color,
              }}
            >
              {task.priority}
            </span>
          </div>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--ink-muted)" }}>
              {task.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="badge"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div
            className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs"
            style={{ color: "var(--ink-muted)" }}
          >
            <span>{task.assignee?.name || "Unassigned"}</span>
            {task.dueDate && (
              <span
                className="inline-flex items-center gap-1"
                style={{ color: overdue ? "var(--danger)" : soon ? "var(--warn)" : undefined }}
              >
                <Calendar size={12} />
                {overdue ? "Overdue · " : soon ? "Due soon · " : ""}
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
          {canClaim && !task.assigneeId && (
            <button
              className="btn btn-secondary mt-3"
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
              onClick={(e) => {
                e.stopPropagation();
                onClaim();
              }}
            >
              <UserPlus size={14} /> Assign to me
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
