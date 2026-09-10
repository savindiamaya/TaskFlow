"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api, getToken } from "@/lib/api";
import type { NotificationItem } from "@/lib/types";

export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!enabled) return;
    void api<{ notifications: NotificationItem[] }>("/notifications")
      .then((data) => setNotifications(data.notifications))
      .catch(() => {});

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
    const socket: Socket = io(socketUrl, {
      auth: { token: getToken() },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
    });
    socket.on("notification", (n: NotificationItem) => {
      setNotifications((prev) => [n, ...prev]);
    });
    socket.on("connect_error", () => {
      // REST notifications still work when Socket.IO is unavailable (e.g. Vercel serverless)
    });
    return () => {
      socket.disconnect();
    };
  }, [enabled]);

  return { notifications, setNotifications };
}
