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
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: clientUrl.split(",").map((s) => s.trim()),
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

app.set("io", io);

app.use(
  cors({
    origin: clientUrl.split(",").map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "taskflow-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);

io.use((socket, next) => {
  try {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.headers.authorization?.replace("Bearer ", "") as string | undefined);
    if (!token) return next(new Error("Unauthorized"));
    const secret = process.env.JWT_SECRET;
    if (!secret) return next(new Error("Server misconfigured"));
    const decoded = jwt.verify(token, secret) as { userId: string };
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

// Due-date reminder sweep every hour
setInterval(() => {
  void checkDueDateReminders(io);
}, 60 * 60 * 1000);

const PORT = Number(process.env.PORT) || 5000;
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`TaskFlow API listening on http://localhost:${PORT}`);
    void checkDueDateReminders(io);
  });
}

export default app;
