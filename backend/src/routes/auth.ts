import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { signToken, authenticate } from "../middleware/auth.js";
import { serializeUser } from "../lib/serializers.js";
import { PASSWORD_RULES_MESSAGE, validatePassword } from "../lib/password.js";
import type { AuthRequest } from "../types.js";

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = process.env.VERCEL
  ? path.join("/tmp", "taskflow-uploads", "avatars")
  : path.join(__dirname, "../../uploads/avatars");

try {
  fs.mkdirSync(uploadsRoot, { recursive: true });
} catch {
  // Serverless filesystems may be read-only until /tmp is used
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsRoot),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `${(req as AuthRequest).user!.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const profileSchema = z.object({
  name: z.string().min(2).max(80),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().max(100),
});

router.post("/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const passwordError = validatePassword(body.password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError || PASSWORD_RULES_MESSAGE });
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email: body.email.toLowerCase(),
        passwordHash,
        role: "USER",
      },
    });

    const token = signToken({ userId: user.id, role: user.role });
    return res.status(201).json({ token, user: serializeUser(user) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
    }
    console.error(err);
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    if (!user.isActive) return res.status(403).json({ message: "Account is deactivated" });

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken({ userId: user.id, role: user.role });
    return res.json({ token, user: serializeUser(user) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
    }
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || !user.isActive) return res.status(401).json({ message: "Unauthorized" });
  return res.json({ user: serializeUser(user) });
});

router.patch("/profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const body = profileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: body.name.trim() },
    });
    return res.json({ user: serializeUser(user) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
    }
    console.error(err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

router.patch("/password", authenticate, async (req: AuthRequest, res) => {
  try {
    const body = passwordChangeSchema.parse(req.body);
    const passwordError = validatePassword(body.newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
    }
    console.error(err);
    return res.status(500).json({ message: "Failed to update password" });
  }
});

router.post("/avatar", authenticate, (req: AuthRequest, res) => {
  upload.single("avatar")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Please choose an image file" });
    }

    try {
      const existing = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (existing?.avatarUrl?.startsWith("/uploads/")) {
        const oldPath = process.env.VERCEL
          ? path.join("/tmp", "taskflow-uploads", existing.avatarUrl.replace(/^\/uploads\//, ""))
          : path.join(__dirname, "../..", existing.avatarUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatarUrl },
      });
      return res.json({ user: serializeUser(user) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to upload avatar" });
    }
  });
});

router.delete("/avatar", authenticate, async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!existing) return res.status(404).json({ message: "User not found" });

    if (existing.avatarUrl?.startsWith("/uploads/")) {
      const oldPath = process.env.VERCEL
        ? path.join("/tmp", "taskflow-uploads", existing.avatarUrl.replace(/^\/uploads\//, ""))
        : path.join(__dirname, "../..", existing.avatarUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl: null },
    });
    return res.json({ user: serializeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to remove avatar" });
  }
});

export default router;
