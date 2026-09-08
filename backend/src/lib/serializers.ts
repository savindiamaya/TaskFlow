import type { NotificationType, Prisma, Task, TaskPriority, TaskStatus, User } from "@prisma/client";

export function statusToApi(status: TaskStatus): string {
  return status.toLowerCase();
}

export function statusFromApi(status: string): TaskStatus {
  const map: Record<string, TaskStatus> = {
    todo: "TODO",
    doing: "DOING",
    done: "DONE",
  };
  const value = map[status.toLowerCase()];
  if (!value) throw new Error("Invalid status");
  return value;
}

export function priorityToApi(priority: TaskPriority): string {
  return priority.toLowerCase();
}

export function priorityFromApi(priority: string): TaskPriority {
  const map: Record<string, TaskPriority> = {
    low: "LOW",
    medium: "MEDIUM",
    high: "HIGH",
  };
  const value = map[priority.toLowerCase()];
  if (!value) throw new Error("Invalid priority");
  return value;
}

export function serializeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "ADMIN" ? "admin" : "user",
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

type TaskWithPeople = Task & {
  creator?: Pick<User, "id" | "name" | "email"> | null;
  assignee?: Pick<User, "id" | "name" | "email"> | null;
};

export function serializeTask(task: TaskWithPeople) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: statusToApi(task.status),
    priority: priorityToApi(task.priority),
    tags: task.tags ?? [],
    dueDate: task.dueDate,
    position: task.position,
    creatorId: task.creatorId,
    assigneeId: task.assigneeId,
    creator: task.creator
      ? { id: task.creator.id, name: task.creator.name, email: task.creator.email }
      : undefined,
    assignee: task.assignee
      ? { id: task.assignee.id, name: task.assignee.name, email: task.assignee.email }
      : null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export type NotifyFn = (
  userId: string,
  type: NotificationType,
  message: string,
  taskId?: string | null
) => Promise<void>;

export const taskInclude = {
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TaskInclude;
