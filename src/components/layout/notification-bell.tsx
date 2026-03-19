"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: "TASK_ASSIGNED" | "TASK_APPROVED" | "TASK_REJECTED" | "COMMENT_ADDED";
  message: string;
  isRead: boolean;
  taskId: string | null;
  projectId: string | null;
  createdAt: string;
  actor: { id: string; name: string } | null;
}

const typeColors: Record<Notification["type"], string> = {
  TASK_ASSIGNED: "bg-sky-500",
  TASK_APPROVED: "bg-teal-500",
  TASK_REJECTED: "bg-rose-500",
  COMMENT_ADDED: "bg-amber-500",
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail
    }
  }, []);

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAsRead(id: string) {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }

  async function markAllRead() {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read-all", { method: "PATCH" });
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setOpen(false);
    if (notification.projectId && notification.taskId) {
      router.push(`/dashboard/projects/${notification.projectId}?task=${notification.taskId}`);
    } else if (notification.projectId) {
      router.push(`/dashboard/projects/${notification.projectId}`);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all duration-150 cursor-pointer"
      >
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-stone-200/80 bg-white shadow-lg shadow-stone-900/[0.08] animate-fade-up overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <h3 className="text-[13px] font-semibold text-stone-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-medium text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-stone-400">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-stone-50">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors cursor-pointer ${
                        !notification.isRead ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          notification.isRead ? "bg-stone-200" : typeColors[notification.type]
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] leading-snug ${notification.isRead ? "text-stone-500" : "text-stone-700"}`}>
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[11px] text-stone-400">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
