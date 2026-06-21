"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, mapApiError } from "@/lib/http-client";
import type { AppNotification, NotificationsResponse } from "@/features/notifications/notification.types";

export function useNotifications() {
  const { accessToken, isAuthenticated } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<NotificationsResponse>("/notifications", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setItems(response.items);
      setUnreadCount(response.unreadCount);
    } catch (requestError) {
      setError(mapApiError(requestError, "No se pudieron cargar las notificaciones."));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, load]);

  const markRead = useCallback(async (id: number) => {
    const current = items.find((item) => item.id === id);
    if (!current || current.isRead) return;
    setItems((value) => value.map((item) => item.id === id ? { ...item, isRead: true } : item));
    setUnreadCount((value) => Math.max(0, value - 1));
    try {
      await apiRequest(`/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      void load();
    }
  }, [accessToken, items, load]);

  const markAllRead = useCallback(async () => {
    setItems((value) => value.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      await apiRequest("/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      void load();
    }
  }, [accessToken, load]);

  return { items, unreadCount, loading, error, load, markRead, markAllRead };
}
