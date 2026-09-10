import "dotenv/config";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import taskRoutes from "./routes/tasks.js";
import notificationRoutes from "./routes/notifications.js";
import { checkDueDateReminders } from "./services/notifications.js";

const app = express();
const isVercel = Boolean(process.env.VERCEL);

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const allowedOrigins = clientUrl.split(",").map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins[0] || true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "../uploads"))
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "taskflow-api", runtime: isVercel ? "vercel" : "node" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);

// Due-date cron endpoint (Vercel Cron hits this hourly)
app.get("/api/cron/due-reminders", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
  try {
    const io = app.get("io") as Server | undefined;
    await checkDueDateReminders(io);
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Cron failed" });
  }
});

if (!isVercel) {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.includes("*") ? true : allowedOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });

  app.set("io", io);

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization?.replace("Bearer ", "") as
          | string
          | undefined);
      if (!token) return next(new Error("Unauthorized"));
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) return next(new Error("Server misconfigured"));
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    socket.on("disconnect", () => {});
  });

  setInterval(() => {
    void checkDueDateReminders(io);
  }, 60 * 60 * 1000);

  const PORT = Number(process.env.PORT) || 5000;
  server.listen(PORT, () => {
    console.log(`TaskFlow API listening on http://localhost:${PORT}`);
    void checkDueDateReminders(io);
  });
}

export default app;
