import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { serializeTask, serializeUser, taskInclude } from "../lib/serializers.js";
import type { AuthRequest } from "../types.js";

const router = Router();

router.use(authenticate);

router.get("/", requireAdmin, async (req, res) => {
  const search = String(req.query.search || "").trim();
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return res.json({ users: users.map(serializeUser) });
});

router.get("/assignable", async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return res.json({ users: users.map(serializeUser) });
});

router.get("/:id/tasks", requireAdmin, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ message: "User not found" });

  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ assigneeId: user.id }, { creatorId: user.id }],
    },
    include: taskInclude,
    orderBy: { updatedAt: "desc" },
  });

  return res.json({
    user: serializeUser(user),
    tasks: tasks.map(serializeTask),
  });
});

router.patch("/:id/active", requireAdmin, async (req: AuthRequest, res) => {
  const schema = z.object({ isActive: z.boolean() });
  try {
    const { isActive } = schema.parse(req.body);
    if (req.params.id === req.user!.id && !isActive) {
      return res.status(400).json({ message: "You cannot deactivate yourself" });
    }
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.role === "ADMIN" && !isActive) {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot deactivate the last admin" });
      }
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
    });
    return res.json({ user: serializeUser(user) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
    }
    console.error(err);
    return res.status(500).json({ message: "Failed to update user" });
  }
});

export default router;
