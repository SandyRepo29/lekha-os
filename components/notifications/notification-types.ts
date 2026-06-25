export type NotificationType = "alert" | "info" | "warning" | "success";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  module: string;
  href?: string;
  createdAt: Date | string;
  read: boolean;
};
