"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Task, TaskPriority, TaskStatus, User } from "@/lib/types";
import { PRIORITIES, STATUSES, SUGGESTED_TAGS } from "@/lib/types";

export function TaskDialog({
  open,
  task,
  users,
  isAdmin,
  currentUserId,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  task: Task | null;
  users: User[];
  isAdmin: boolean;
  currentUserId: string;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    tags: string[];
    dueDate: string | null;
    assigneeId: string | null;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setStatus(task?.status || "todo");
    setPriority(task?.priority || "medium");
    setTags(task?.tags || []);
    setDueDate(task?.dueDate ? task.dueDate.slice(0, 10) : "");
    setAssigneeId(task?.assigneeId || "");
    setError("");
  }, [open, task]);

  if (!open) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let nextAssignee: string | null = assigneeId || null;
      if (!isAdmin) {
        if (task?.assigneeId) nextAssignee = task.assigneeId;
        else if (nextAssignee && nextAssignee !== currentUserId) {
          throw new Error("You can only assign unassigned tasks to yourself");
        }
      }
      await onSave({
        title,
        description,
        status,
        priority,
        tags,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assigneeId: nextAssignee,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <form
        className="surface animate-rise w-full max-w-lg p-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2 className="display text-2xl font-bold">{task ? "Edit task" : "New task"}</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="field min-h-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="field" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="field"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due date</label>
              <input
                className="field"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Assignee</label>
              <select
                className="field"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={!isAdmin && !!task?.assigneeId}
              >
                <option value="">Unassigned</option>
                {isAdmin
                  ? users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))
                  : (
                      <option value={currentUserId}>Me</option>
                    )}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Tags</label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className="badge"
                    style={{
                      background: active ? "var(--brand)" : "var(--bg-muted)",
                      color: active ? "white" : "var(--ink-muted)",
                      border: 0,
                      cursor: "pointer",
                    }}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {error && (
          <p className="mt-3 text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <div>
            {onDelete && (
              <button
                type="button"
                className="btn btn-danger"
                disabled={busy}
                onClick={() => void onDelete()}
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
