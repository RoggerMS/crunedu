export type AppNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  referenceId: number | null;
  referenceType: string | null;
  createdAt: string;
};

export type NotificationsResponse = {
  items: AppNotification[];
  unreadCount: number;
};

export function notificationHref(notification: AppNotification): string {
  const id = notification.referenceId;
  switch (notification.referenceType?.toUpperCase()) {
    case "POST": return id ? `/app?post=${id}` : "/app";
    case "USER": return id ? `/app/perfil/${id}` : "/app/perfil";
    case "COMMUNITY": return id ? `/app/comunidades/${id}` : "/app/comunidades";
    case "DOCUMENT": return id ? `/app/apuntes/${id}` : "/app/apuntes";
    default: return "/app/notificaciones";
  }
}
