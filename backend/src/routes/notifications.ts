import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import type { AuthRequest } from "../types.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return res.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      taskId: n.taskId,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
    unreadCount: notifications.filter((n) => !n.isRead).length,
  });
});

router.patch("/:id/read", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const n = await prisma.notification.findFirst({
    where: { id, userId: req.user!.id },
  });
  if (!n) return res.status(404).json({ message: "Notification not found" });
  const updated = await prisma.notification.update({
    where: { id: n.id },
    data: { isRead: true },
  });
  return res.json({ notification: updated });
});

router.post("/read-all", async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  return res.json({ message: "All notifications marked as read" });
});

export default router;
