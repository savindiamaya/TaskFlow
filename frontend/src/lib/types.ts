export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type UserRole = "user" | "admin";
export type SortOption = "newest" | "oldest" | "priority" | "due" | "updated";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  dueDate: string | null;
  position: number;
  creatorId: string;
  assigneeId: string | null;
  creator?: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  taskId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  assignee?: string;
  tag?: string;
  due?: string;
  sort?: SortOption;
}

export interface Stats {
  myTasks: number;
  completed: number;
  overdue: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export const STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "doing", label: "Doing" },
  { id: "done", label: "Done" },
];

export const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

export const SUGGESTED_TAGS = [
  "Bug",
  "Feature",
  "Urgent",
  "Documentation",
  "Improvement",
  "Backend",
  "Frontend",
];
