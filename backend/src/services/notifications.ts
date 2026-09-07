import type { NotificationType } from "@prisma/client";
import type { Server } from "socket.io";
import prisma from "../lib/prisma.js";

export async function createNotification(
  io: Server | undefined,
  input: {
    userId: string;
    type: NotificationType;
    message: string;
    taskId?: string | null;
  }
) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      message: input.message,
      taskId: input.taskId ?? null,
    },
  });

  io?.to(`user:${input.userId}`).emit("notification", {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    taskId: notification.taskId,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  });

  return notification;
}

export async function checkDueDateReminders(io?: Server) {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const dueSoon = await prisma.task.findMany({
    where: {
      assigneeId: { not: null },
      status: { not: "DONE" },
      dueDate: { gte: now, lte: in24h },
    },
  });

  for (const task of dueSoon) {
    if (!task.assigneeId) continue;
    const recent = await prisma.notification.findFirst({
      where: {
        userId: task.assigneeId,
        taskId: task.id,
        type: "DUE_SOON",
        createdAt: { gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
      },
    });
    if (recent) continue;
    await createNotification(io, {
      userId: task.assigneeId,
      type: "DUE_SOON",
      message: `"${task.title}" is due soon`,
      taskId: task.id,
    });
  }

  const overdue = await prisma.task.findMany({
    where: {
      assigneeId: { not: null },
      status: { not: "DONE" },
      dueDate: { lt: now },
    },
  });

  for (const task of overdue) {
    if (!task.assigneeId) continue;
    const recent = await prisma.notification.findFirst({
      where: {
        userId: task.assigneeId,
        taskId: task.id,
        type: "OVERDUE",
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recent) continue;
    await createNotification(io, {
      userId: task.assigneeId,
      type: "OVERDUE",
      message: `"${task.title}" is overdue`,
      taskId: task.id,
    });
  }
}
