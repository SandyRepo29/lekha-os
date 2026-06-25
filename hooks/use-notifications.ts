"use client";

import { useState, useEffect } from "react";
import type { NotificationItem } from "@/components/notifications/notification-types";

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Critical risk identified",
    body: "A new critical risk has been flagged in Risk Lens&#8482; &#8212; Vendor dependency on AWS ap-south-1 exceeds threshold.",
    type: "alert",
    module: "Risk Lens&#8482;",
    href: "/risks",
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
  },
  {
    id: "2",
    title: "Vendor document expiring soon",
    body: "Infosys Ltd has 2 documents expiring within 14 days. Review and renew before expiry.",
    type: "warning",
    module: "Vendor Hub&#8482;",
    href: "/vendors",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    read: false,
  },
  {
    id: "3",
    title: "Control health dropped below threshold",
    body: "Access Control Review control health score dropped to 48 &#8212; immediate attention required.",
    type: "alert",
    module: "Control Center&#8482;",
    href: "/controls",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22),
    read: false,
  },
  {
    id: "4",
    title: "ISO 27001 readiness improved",
    body: "Your ISO 27001 compliance readiness improved from 67% to 74% after recent evidence uploads.",
    type: "success",
    module: "Evidence Vault&#8482;",
    href: "/compliance",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
    read: true,
  },
  {
    id: "5",
    title: "Governance snapshot captured",
    body: "Daily Org Trust Score&#8482; snapshot saved. Current score: 82 &#8212; up 3 points from yesterday.",
    type: "info",
    module: "Trust Intelligence&#8482;",
    href: "/trust-intelligence",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 49),
    read: true,
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  useEffect(() => {
    fetch("/api/v1/notifications")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        const items: NotificationItem[] = data?.notifications ?? [];
        if (items.length > 0) {
          setNotifications(items);
        }
      })
      .catch(() => {
      });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return { notifications, unreadCount, markRead, markAllRead };
}
