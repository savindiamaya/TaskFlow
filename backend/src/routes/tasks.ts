import { Router } from "express";
import type { Server } from "socket.io";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import {
  priorityFromApi,
  serializeTask,
  statusFromApi,
  taskInclude,
} from "../lib/serializers.js";
import type { AuthRequest } from "../types.js";
import { createNotification } from "../services/notifications.js";

const router = Router();

function getIo(req: AuthRequest): Server | undefined {
  return req.app.get("io");
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
  status: z.enum(["todo", "doing", "done"]).optional().default("todo"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  tags: z.array(z.string()).optional().default([]),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  position: z.number().int().optional(),
});

router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const {
      search,
      status,
      priority,
      assignee,
      tag,
      due,
      sort = "newest",
    } = req.query as Record<string, string | undefined>;

    const where: Prisma.TaskWhereInput = {};
    const and: Prisma.TaskWhereInput[] = [];

    if (search?.trim()) {
      and.push({
        OR: [
          { title: { contains: search.trim() } },
          { description: { contains: search.trim() } },
        ],
      });
    }

    if (status && status !== "all") {
      where.status = statusFromApi(status);
    }

    if (priority && priority !== "all") {
      where.priority = priorityFromApi(priority);
    }

    if (assignee === "unassigned") {
      where.assigneeId = null;
    } else if (assignee === "me") {
      where.assigneeId = req.user!.id;
    } else if (assignee && assignee !== "all") {
      where.assigneeId = assignee;
    }

    if (tag && tag !== "all") {
      and.push({ tags: { contains: tag } });
    }

    const now = new Date();
    if (due === "overdue") {
      and.push({ dueDate: { lt: now }, status: { not: "DONE" } });
    } else if (due === "today") {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      and.push({ dueDate: { gte: now, lte: end } });
    } else if (due === "soon" || due === "week") {
      const end = new Date(now.getTime() + 7 * 86400000);
      and.push({ dueDate: { gte: now, lte: end } });
    } else if (due === "none") {
      where.dueDate = null;
    }

    if (and.length) where.AND = and;

    // Normal users: own tasks + unassigned (so they can claim). Admins see all.
    if (req.user!.role !== "ADMIN") {
      const scope: Prisma.TaskWhereInput = {
        OR: [
          { creatorId: req.user!.id },
          { assigneeId: req.user!.id },
          { assigneeId: null },
        ],
      };
      where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), scope];
    }

    let orderBy: Prisma.TaskOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "oldest") orderBy = { createdAt: "asc" };
    else if (sort === "due") orderBy = { dueDate: "asc" };
    else if (sort === "updated") orderBy = { updatedAt: "desc" };
    else if (sort === "priority") orderBy = { priority: "asc" };

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy,
      take: 500,
    });

    let result = tasks.map(serializeTask);
    if (sort === "priority") {
      const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
      result = result.sort((a, b) => rank[a.priority] - rank[b.priority]);
    }

    return res.json({ tasks: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

router.get("/stats", async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === "ADMIN";
  const now = new Date();

  const baseWhere = isAdmin ? {} : { OR: [{ assigneeId: userId }, { creatorId: userId }] };
  const scopedAssignee = isAdmin ? {} : { assigneeId: userId };

  const [myTasks, completed, overdue, byStatus, byPriority, totalUsers, totalTasks, highPriority] =
    await Promise.all([
      prisma.task.count({
        where: isAdmin ? {} : { assigneeId: userId },
      }),
      prisma.task.count({
        where: {
          ...scopedAssignee,
          status: "DONE",
        },
      }),
      prisma.task.count({
        where: {
          ...scopedAssignee,
          dueDate: { lt: now },
          status: { not: "DONE" },
        },
      }),
      prisma.task.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: true,
      }),
      prisma.task.groupBy({
        by: ["priority"],
        where: scopedAssignee,
        _count: true,
      }),
      isAdmin ? prisma.user.count() : Promise.resolve(0),
      isAdmin ? prisma.task.count() : Promise.resolve(0),
      prisma.task.count({
        where: {
          ...scopedAssignee,
          priority: "HIGH",
        },
      }),
    ]);

  return res.json({
    stats: {
      myTasks,
      completed,
      overdue,
      totalUsers,
      totalTasks: isAdmin ? totalTasks : myTasks,
      highPriority,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status.toLowerCase(), s._count])),
      byPriority: Object.fromEntries(byPriority.map((p) => [p.priority.toLowerCase(), p._count])),
    },
  });
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = createSchema.parse(req.body);
    const isAdmin = req.user!.role === "ADMIN";

    let assigneeId = body.assigneeId ?? null;
    if (!isAdmin) {
      if (assigneeId && assigneeId !== req.user!.id) {
        return res.status(403).json({
          message: "Normal users can only assign tasks to themselves",
        });
      }
    }

    if (assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { id: assigneeId, isActive: true },
      });
      if (!assignee) return res.status(400).json({ message: "Assignee not found" });
    }

    const maxPos = await prisma.task.aggregate({
      where: { status: statusFromApi(body.status) },
      _max: { position: true },
    });

    const task = await prisma.task.create({
      data: {
        title: body.title.trim(),
        description: body.description ?? "",
        status: statusFromApi(body.status),
        priority: priorityFromApi(body.priority),
        tags: JSON.stringify(body.tags ?? []),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        creatorId: req.user!.id,
        assigneeId,
        position: (maxPos._max.position ?? 0) + 1,
      },
      include: taskInclude,
    });

    const io = getIo(req);
    if (assigneeId && assigneeId !== req.user!.id) {
      await createNotification(io, {
        userId: assigneeId,
        type: "TASK_ASSIGNED",
        message: `You were assigned to "${task.title}"`,
        taskId: task.id,
      });
    }

    return res.status(201).json({ task: serializeTask(task) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
    }
    console.error(err);
    return res.status(500).json({ message: "Failed to create task" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const taskId = req.params.id as string;
    const body = updateSchema.parse(req.body);
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) return res.status(404).json({ message: "Task not found" });

    const isAdmin = req.user!.role === "ADMIN";
    const isOwner =
      existing.creatorId === req.user!.id || existing.assigneeId === req.user!.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "You can only edit your own tasks" });
    }

    const data: Prisma.TaskUpdateInput = {};

    if (body.title !== undefined) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description;
    if (body.priority !== undefined) data.priority = priorityFromApi(body.priority);
    if (body.tags !== undefined) data.tags = JSON.stringify(body.tags);
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.position !== undefined) data.position = body.position;

    if (body.status !== undefined) {
      data.status = statusFromApi(body.status);
    }

    if (body.assigneeId !== undefined) {
      if (!isAdmin) {
        // Normal users may only claim unassigned tasks for themselves
        if (existing.assigneeId !== null) {
          return res.status(403).json({
            message: "Only admins can reassign tasks that already have an assignee",
          });
        }
        if (body.assigneeId !== req.user!.id && body.assigneeId !== null) {
          return res.status(403).json({
            message: "Normal users can only assign unassigned tasks to themselves",
          });
        }
      }
      if (body.assigneeId) {
        const assignee = await prisma.user.findFirst({
          where: { id: body.assigneeId, isActive: true },
        });
        if (!assignee) return res.status(400).json({ message: "Assignee not found" });
        data.assignee = { connect: { id: body.assigneeId } };
      } else {
        data.assignee = { disconnect: true };
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: taskInclude,
    });

    const io = getIo(req);

    if (body.status && statusFromApi(body.status) !== existing.status) {
      const targetUser = task.assigneeId || task.creatorId;
      if (targetUser !== req.user!.id) {
        await createNotification(io, {
          userId: targetUser,
          type: "STATUS_CHANGED",
          message: `"${task.title}" moved to ${body.status}`,
          taskId: task.id,
        });
      }
    }

    if (body.assigneeId !== undefined && body.assigneeId !== existing.assigneeId) {
      if (body.assigneeId) {
        await createNotification(io, {
          userId: body.assigneeId,
          type: existing.assigneeId ? "TASK_REASSIGNED" : "TASK_ASSIGNED",
          message: existing.assigneeId
            ? `Task "${task.title}" was reassigned to you`
            : `You were assigned to "${task.title}"`,
          taskId: task.id,
        });
      }
      if (existing.assigneeId && existing.assigneeId !== body.assigneeId) {
        await createNotification(io, {
          userId: existing.assigneeId,
          type: "TASK_REASSIGNED",
          message: `Task "${task.title}" was reassigned away from you`,
          taskId: task.id,
        });
      }
    }

    return res.json({ task: serializeTask(task) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
    }
    console.error(err);
    return res.status(500).json({ message: "Failed to update task" });
  }
});

router.patch("/:id/status", async (req: AuthRequest, res) => {
  try {
    const taskId = req.params.id as string;
    const schema = z.object({
      status: z.enum(["todo", "doing", "done"]),
      position: z.number().int().optional(),
    });
    const body = schema.parse(req.body);
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) return res.status(404).json({ message: "Task not found" });

    const isAdmin = req.user!.role === "ADMIN";
    const canMove =
      isAdmin ||
      existing.creatorId === req.user!.id ||
      existing.assigneeId === req.user!.id;
    if (!canMove) {
      return res.status(403).json({
        message: "You can only change status on tasks you created or are assigned to",
      });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: statusFromApi(body.status),
        ...(body.position !== undefined ? { position: body.position } : {}),
      },
      include: taskInclude,
    });

    if (existing.status !== task.status) {
      const io = getIo(req);
      const targetUser = task.assigneeId || task.creatorId;
      if (targetUser !== req.user!.id) {
        await createNotification(io, {
          userId: targetUser,
          type: "STATUS_CHANGED",
          message: `"${task.title}" moved to ${body.status}`,
          taskId: task.id,
        });
      }
    }

    return res.json({ task: serializeTask(task) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
    }
    console.error(err);
    return res.status(500).json({ message: "Failed to update status" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const taskId = req.params.id as string;
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) return res.status(404).json({ message: "Task not found" });

  const isAdmin = req.user!.role === "ADMIN";
  const canDelete =
    isAdmin ||
    existing.creatorId === req.user!.id ||
    existing.assigneeId === req.user!.id;
  if (!canDelete) {
    return res.status(403).json({ message: "You can only delete your own tasks" });
  }

  await prisma.task.delete({ where: { id: taskId } });
  return res.json({ message: "Task deleted" });
});

export default router;
