"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { markAsRead, markAllAsRead } from "@/app/(candidate)/notifications/actions";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  initialNotifications?: NotificationItem[];
  initialUnreadCount?: number;
}

const TYPE_ROUTES: Record<string, string> = {
  document_verified: "/documents",
  document_rejected: "/documents",
  assessment_assigned: "/assessments",
  assessment_submitted: "/feedback",
  assessment_reviewed: "/feedback",
  assessment_feedback: "/feedback",
  assessment_report: "/reports",
};

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell({
  initialNotifications = [],
  initialUnreadCount = 0,
}: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  const handleMarkAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await markAllAsRead();
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markAsRead(item.id);
    }
    setOpen(false);
    const target = TYPE_ROUTES[item.type];
    if (target) router.push(target);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-xs"
            style={{ backgroundColor: "var(--destructive)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="text-xs font-bold text-foreground uppercase tracking-wide">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-3 transition-colors hover:bg-muted/50 cursor-pointer ${
                  !n.is_read
                    ? "border-l-3 bg-primary/5"
                    : ""
                }`}
                style={!n.is_read ? { borderLeftColor: "var(--primary)" } : undefined}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className={`text-xs font-semibold ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                    {n.title}
                  </p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(n.created_at)}</span>
                </div>
                {n.message && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
