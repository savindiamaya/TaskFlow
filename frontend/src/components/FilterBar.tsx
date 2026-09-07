"use client";

import type { TaskFilters, User } from "@/lib/types";
import { PRIORITIES, SUGGESTED_TAGS } from "@/lib/types";

export function FilterBar({
  filters,
  setFilters,
  users,
  isAdmin,
}: {
  filters: TaskFilters;
  setFilters: (f: TaskFilters) => void;
  users: User[];
  isAdmin: boolean;
}) {
  function patch(partial: Partial<TaskFilters>) {
    setFilters({ ...filters, ...partial });
  }

  return (
    <div className="surface grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="xl:col-span-2">
        <label className="label">Search</label>
        <input
          className="field"
          placeholder="Search title or description…"
          value={filters.search || ""}
          onChange={(e) => patch({ search: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Status</label>
        <select
          className="field"
          value={filters.status || "all"}
          onChange={(e) => patch({ status: e.target.value as TaskFilters["status"] })}
        >
          <option value="all">All</option>
          <option value="todo">To Do</option>
          <option value="doing">Doing</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div>
        <label className="label">Priority</label>
        <select
          className="field"
          value={filters.priority || "all"}
          onChange={(e) => patch({ priority: e.target.value as TaskFilters["priority"] })}
        >
          <option value="all">All</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Assigned user</label>
        <select
          className="field"
          value={filters.assignee || "all"}
          onChange={(e) => patch({ assignee: e.target.value })}
        >
          <option value="all">All</option>
          <option value="me">Me</option>
          <option value="unassigned">Unassigned</option>
          {isAdmin &&
            users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
        </select>
      </div>
      <div>
        <label className="label">Due date</label>
        <select
          className="field"
          value={filters.due || "all"}
          onChange={(e) => patch({ due: e.target.value })}
        >
          <option value="all">All</option>
          <option value="today">Due today</option>
          <option value="soon">Due soon</option>
          <option value="overdue">Overdue</option>
          <option value="none">No due date</option>
        </select>
      </div>
      <div>
        <label className="label">Tag</label>
        <select
          className="field"
          value={filters.tag || "all"}
          onChange={(e) => patch({ tag: e.target.value })}
        >
          <option value="all">All</option>
          {SUGGESTED_TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Sort</label>
        <select
          className="field"
          value={filters.sort || "newest"}
          onChange={(e) => patch({ sort: e.target.value as TaskFilters["sort"] })}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="priority">Priority</option>
          <option value="due">Due date</option>
          <option value="updated">Recently updated</option>
        </select>
      </div>
    </div>
  );
}
