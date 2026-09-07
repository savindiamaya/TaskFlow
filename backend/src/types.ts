import type { Request } from "express";
import type { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export type TaskStatusApi = "todo" | "doing" | "done";
export type TaskPriorityApi = "low" | "medium" | "high";
